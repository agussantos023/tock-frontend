import { HttpClient, HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { SongManager } from './song-manager';
import { environment } from '../../environments/environment';
import { UploadStatus, UploadTask } from '../shared/interface/upload.interface';
import { catchError, concatMap, EMPTY, filter, of, Subject, takeUntil, tap, timer } from 'rxjs';
import { PlaybackManager } from './playback-manager';

@Injectable({
  providedIn: 'root',
})
export class UploadManager {
  private http = inject(HttpClient);
  private songManager = inject(SongManager);
  private playbackManager = inject(PlaybackManager);

  private apiUrl = `${environment.apiUrl}/songs`;
  private readonly MAX_BATCH_SIZE = 50;

  queue = signal<UploadTask[]>([]);
  isProcessing = signal<boolean>(false);
  isStorageFull = signal<boolean>(false); //

  totalFiles = computed(() => this.queue().length);

  // ESTADÍSTICAS DERIVADAS
  successCount = computed(() => this.queue().filter((t) => t.status === 'success').length);
  errorCount = computed(() => this.queue().filter((t) => t.status === 'error').length);
  pendingCount = computed(() => this.queue().filter((t) => t.status === 'pending').length);

  hasCompleted = computed(() => this.successCount() > 0);
  isQueueFull = computed(() => this.queue().length >= this.MAX_BATCH_SIZE);
  isFinished = computed(
    () => this.queue().length > 0 && this.pendingCount() === 0 && !this.isProcessing(),
  );

  isStartUpload = signal<boolean>(false);

  private stopSignal$ = new Subject<void>();

  /**
   * Captura y Selección
   */
  addFilesToQueue(files: FileList | File[]) {
    const currentQueue = this.queue();
    const newFiles = Array.from(files);

    if (currentQueue.length + newFiles.length > this.MAX_BATCH_SIZE) {
      alert(`Límite máximo de ${this.MAX_BATCH_SIZE} archivos. Por favor, reduce la selección.`);
      return;
    }

    const newTasks: UploadTask[] = newFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      title: file.name.replace(/\.[^/.]+$/, ''),
      status: 'pending',
      progress: 0,
    }));

    this.queue.update((prev) => [...prev, ...newTasks]);
  }

  /**
   * Actualizar título de la canción
   */
  updateTaskTitle(id: string, newTitle: string) {
    this.queue.update((tasks) =>
      tasks.map((task) => (task.id === id ? { ...task, title: newTitle } : task)),
    );
  }

  /**
   * INICIO DE LA COLA
   */
  startUploads() {
    if (this.isProcessing()) return;
    this.isProcessing.set(true);
    this.isStartUpload.set(true);
    this.processNextTask();
  }

  /**
   * Busca la siguiente tarea pendiente de forma dinámica
   */
  private processNextTask() {
    if (!this.isProcessing()) return;

    // Buscamos la PRIMERA tarea que esté 'pending'
    const nextTask = this.queue().find((t) => t.status === 'pending');

    // Si no hay más tareas pendientes
    if (!nextTask) {
      this.isProcessing.set(false);

      this.isStartUpload.set(false);
      if (this.playbackManager.isPlaying()) return;

      this.songManager.refresh(); // Refresca la lista
      return;
    }

    this.executeFlow(nextTask)
      .pipe(takeUntil(this.stopSignal$))
      .subscribe({
        next: () => {
          const completed = this.successCount();
          this.checkAndRefresh(completed);
          // Cuando termine (incluyendo el delay), buscamos la siguiente
          this.processNextTask();
        },
        error: () => {
          this.isProcessing.set(false);
        },
      });
  }

  private executeFlow(task: UploadTask) {
    return of(task).pipe(
      tap(() => this.updateTaskStatus(task.id, 'uploading', 0)),

      concatMap(() => this.uploadToServer(task)),

      concatMap(() => {
        const randomDelay = Math.floor(Math.random() * 2000) + 1000;
        return timer(randomDelay);
      }),

      catchError((err) => {
        this.handleError(task.id, err);
        if (err.status === 507) {
          this.stopSignal$.next();
          return EMPTY;
        }
        return of(null);
      }),
    );
  }

  /**
   * Lógica de red
   */
  private uploadToServer(task: UploadTask) {
    const formData = new FormData();
    formData.append('title', task.title);
    formData.append('file', task.finalBlob || task.file);

    return this.http
      .post(this.apiUrl, formData, {
        reportProgress: true,
        observe: 'events',
      })
      .pipe(
        tap((event) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            const progress = Math.round((100 * event.loaded) / event.total);
            this.updateTaskStatus(task.id, 'uploading', progress);
          }
        }),
        filter((event) => event.type === HttpEventType.Response),
        tap(() => {
          this.updateTaskStatus(task.id, 'success', 100);
        }),
      );
  }

  removeFromQueue(id: string) {
    const task = this.queue().find((task) => task.id === id);

    // Evitar borrar si ya se está subiendo
    if (task?.status === 'uploading') return;

    this.queue.update((tasks) => tasks.filter((t) => t.id !== id));
  }

  // Helpers de Estado

  private updateTaskStatus(id: string, status: UploadStatus, progress: number) {
    this.queue.update((tasks) =>
      tasks.map((task) => (task.id === id ? { ...task, status, progress } : task)),
    );
  }

  private handleError(id: string, error: HttpErrorResponse) {
    let msg = 'Error desconocido';

    if (error.status === 507) {
      msg = 'Límite de almacenamiento';
      this.isStorageFull.set(true); // Bloqueamos el Dropzone
      this.stopSignal$.next(); // Paramos la cola inmediatamente
      this.isProcessing.set(false);
    }
    this.updateTaskStatus(id, 'error', 0);

    this.queue.update((tasks) => tasks.map((t) => (t.id === id ? { ...t, error: msg } : t)));
  }

  stopUploads() {
    if (!this.isProcessing()) return;

    this.isProcessing.set(false);
  }

  /**
   * Lógica de refresco inteligente
   */
  private checkAndRefresh(currentCompleted: number) {
    if (this.playbackManager.isPlaying()) return;

    const total = this.totalFiles();

    // Más de 20 canciones -> Cada 10
    if (total > 20) {
      if (currentCompleted % 10 === 0) {
        this.songManager.refresh();
      }
    }
    // Entre 5 y 20 canciones -> A la mitad
    else if (total >= 5 && total <= 20) {
      const half = Math.floor(total / 2);
      if (currentCompleted === half) {
        this.songManager.refresh();
      }
    }
  }

  clearQueue() {
    if (this.isProcessing()) return;
    this.queue.set([]);
    this.isStartUpload.set(false);
  }

  clearByStatus(status: UploadStatus) {
    // Bloqueo de seguridad: No limpiar si estamos procesando
    if (this.isProcessing()) return;

    this.queue.update((tasks) => tasks.filter((t) => t.status !== status));

    // Si la cola se vacía por completo, reseteamos la sesión
    if (this.queue().length === 0) this.isStartUpload.set(false);
  }
}
