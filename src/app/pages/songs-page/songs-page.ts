import { AfterViewInit, Component, inject, OnInit, signal } from '@angular/core';
import { SongManager } from '../../services/song-manager';
import { environment } from '../../../environments/environment.development';
import { Song } from '../../shared/interface/song.interface';
import { DurationPipe } from '../../shared/pipes/duration-pipe';
import { FilesizePipe } from '../../shared/pipes/filesize-pipe';
import { PlaybackManager } from '../../services/playback-manager';
import { UploadManager } from '../../services/upload-manager';
import { UploadStation } from './upload-station/upload-station';

@Component({
  selector: 'app-songs-page',
  imports: [DurationPipe, FilesizePipe, UploadStation],
  templateUrl: './songs-page.html',
  styleUrl: './songs-page.css',
})
export class SongsPage implements OnInit, AfterViewInit {
  public songManager = inject(SongManager);
  public playbackManager = inject(PlaybackManager);
  public uploadManager = inject(UploadManager);

  private observer!: IntersectionObserver;

  backendUrl = environment.apiUrl.replace('/api', '');

  // UI State
  showUploadStation = signal(false);

  ngOnInit() {
    this.songManager.loadMore();
  }

  toggleForm() {
    this.showUploadStation.update((v) => !v);
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

  ngOnDestroy() {
    if (this.observer) this.observer.disconnect();
  }
}
