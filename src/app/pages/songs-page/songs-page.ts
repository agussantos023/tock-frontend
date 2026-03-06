import { AfterViewInit, Component, inject, OnInit, signal } from '@angular/core';
import { SongManager } from '../../services/song-manager';
import { environment } from '../../../environments/environment.development';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Song } from '../../interface/song.interface';
import { DurationPipe } from '../../pipes/duration-pipe';
import { FilesizePipe } from '../../pipes/filesize-pipe';
import { PlaybackManager } from '../../services/playback-manager';

@Component({
  selector: 'app-songs-page',
  imports: [ReactiveFormsModule, DurationPipe, FilesizePipe],
  templateUrl: './songs-page.html',
  styleUrl: './songs-page.css',
})
export class SongsPage implements OnInit, AfterViewInit {
  public songManager = inject(SongManager);
  public playbackManager = inject(PlaybackManager);
  private observer!: IntersectionObserver;

  backendUrl = environment.apiUrl.replace('/api', '');

  // UI State
  showForm = signal(false);
  isUploading = signal(false);
  errorMessage = signal<string | null>(null);

  ngOnInit() {
    this.songManager.loadMore();
  }

  uploadForm = new FormGroup({
    fileSource: new FormControl<File | null>(null, Validators.required),
    title: new FormControl('', Validators.required), // Se rellena solo
  });

  private audio = new Audio();
  private currentObjectUrl: string | null = null; // Para limpiar memoria

  toggleForm() {
    this.showForm.update((v) => !v);
    this.errorMessage.set(null);
    this.uploadForm.reset();
  }

  onFileChange(event: any) {
    this.errorMessage.set(null);

    if (event.target.files.length === 0) {
      this.uploadForm.reset();
      return;
    }

    const file = event.target.files[0] as File;

    if (!file) return;

    // 50MB (50 * 1024 * 1024 bytes)
    const maxSize = 50 * 1024 * 1024;

    if (file.size > maxSize) {
      this.errorMessage.set(
        `⚠️ El archivo es demasiado grande (${(file.size / 1024 / 1024).toFixed(2)}MB). Máximo 50MB.`,
      );
      this.uploadForm.reset();
      return;
    }

    // "Mi Cancion.mp3" -> "Mi Cancion"
    const title = file.name.replace(/\.[^/.]+$/, '');

    this.uploadForm.patchValue({
      fileSource: file,
      title: title,
    });
  }

  async onSubmit() {
    if (this.uploadForm.invalid) return;

    this.isUploading.set(true);
    const { fileSource, title } = this.uploadForm.value;

    try {
      if (fileSource && title) {
        await this.songManager.upload(fileSource, title);

        this.toggleForm(); // Cierra el formulario
        this.songManager.refresh();
      }
    } catch (error) {
      console.error(error);
      this.errorMessage.set('Error al subir la canción.');
    } finally {
      this.isUploading.set(false);
    }
  }

  ngAfterViewInit() {
    this.observer = new IntersectionObserver(
      (entries) => {
        // Si el centinela es visible y NO estamos cargando ya
        if (entries[0].isIntersecting && !this.songManager.loading()) {
          this.songManager.loadMore();
        }
      },
      {
        threshold: 0.1, //la función se disparará cuando apenas el 10% del centinela sea visible
      },
    );

    const sentinel = document.querySelector('#scroll-sentinel');
    if (sentinel) this.observer.observe(sentinel);
  }

  togglePlay(song: Song) {
    this.playbackManager.playSong(song);
  }

  formatSize(bytes: string): string {
    const mb = parseInt(bytes) / (1024 * 1024);
    return mb.toFixed(2) + ' MB';
  }

  ngOnDestroy() {
    if (this.observer) this.observer.disconnect();
  }
}
