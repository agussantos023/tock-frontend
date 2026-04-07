import { HttpClient } from '@angular/common/http';
import { inject, Injectable, Injector, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { catchError, firstValueFrom } from 'rxjs';
import { DeleteSongsResponse, PaginatedSongs, Song } from '../shared/interface/song.interface';
import { AuthUser } from './auth-user';
import { UploadManager } from './upload-manager';
import { NotificationManager } from './notification-manager';

@Injectable({
  providedIn: 'root',
})
export class SongManager {
  private http = inject(HttpClient);
  private authUser = inject(AuthUser);
  private injector = inject(Injector);

  private apiUrl = `${environment.apiUrl}/songs`;

  currentPage = signal<number>(1);
  songs = signal<Song[]>([]);
  loading = signal<boolean>(false);
  isAllSongsLoaded = signal<boolean>(false);
  error = signal<string | null>(null);

  async loadMore(limit: number = 15) {
    if (this.isAllSongsLoaded()) return; // Evitar peticiones inecesarias
    if (this.loading()) return; // Evitar múltiples peticiones

    this.loading.set(true);
    this.error.set(null);

    try {
      const data = await firstValueFrom(
        this.http.get<PaginatedSongs>(`${this.apiUrl}`, {
          params: { page: this.currentPage(), limit },
        }),
      );

      this.songs.update((current) => [...current, ...data.data]);
      this.isAllSongsLoaded.set(data.data.length < limit);
      this.currentPage.update((p) => p + 1);
    } catch (err) {
      this.error.set('Error al cargar canciones');
    } finally {
      this.loading.set(false);
    }
  }

  async refresh() {
    this.isAllSongsLoaded.set(false);
    this.songs.set([]);
    this.currentPage.set(1);
    await this.loadMore();
  }

  async delete(target: number[] | 'all') {
    const uploadManager = this.injector.get(UploadManager);
    const notificationManager = this.injector.get(NotificationManager);

    const payload = {
      ids: target === 'all' ? 'all' : target,
    };

    try {
      const response = await firstValueFrom(
        this.http.delete<DeleteSongsResponse>(`${this.apiUrl}`, { body: payload }),
      );

      const count = target === 'all' ? 'Todas las' : (target as number[]).length;
      notificationManager.show(`${count} canciones eliminadas correctamente`, 'success');

      this.songs.update((list) => {
        if (target === 'all') return [];

        const targetIds = target as number[];

        return list.filter((s) => !targetIds.includes(s.id));
      });

      if (response.storage) {
        this.authUser.updateStorage(response.storage.used);
        uploadManager.isStorageFull.set(false);
      }
    } catch (err) {
      notificationManager.show('No se pudieron eliminar las canciones', 'error');
      this.error.set('Error al eliminar las canciones');
    }
  }

  async shuffle(limit: number = 15): Promise<Song[]> {
    const notificationManager = this.injector.get(NotificationManager);

    this.loading.set(true);

    try {
      const data = await firstValueFrom(
        this.http.post<PaginatedSongs>(`${this.apiUrl}/shuffle?limit=${limit}`, {}),
      );

      this.songs.set(data.data);
      this.currentPage.set(2);
      this.isAllSongsLoaded.set(data.data.length < limit);

      return data.data;
    } catch (err) {
      notificationManager.show('Error al mezclar la biblioteca', 'error');

      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  getAudioBlob(songId: number) {
    const notificationManager = this.injector.get(NotificationManager);

    return this.http
      .get(`${this.apiUrl}/${songId}/audio`, {
        responseType: 'blob',
      })
      .pipe(
        catchError((err) => {
          notificationManager.show('No se pudo obtener el archivo de audio', 'error');
          throw err;
        }),
      );
  }
}
