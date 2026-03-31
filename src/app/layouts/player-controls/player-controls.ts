import { Component, inject, signal } from '@angular/core';
import { PlaybackManager } from '../../services/playback-manager';
import { SongManager } from '../../services/song-manager';
import { DurationPipe } from '../../shared/pipes/duration-pipe';
import { VolumeVisualizer } from './volume-visualizer/volume-visualizer';

@Component({
  selector: 'app-player-controls',
  imports: [DurationPipe, VolumeVisualizer],
  templateUrl: './player-controls.html',
  styleUrl: './player-controls.css',
})
export class PlayerControls {
  protected songManager = inject(SongManager);
  protected playbackManager = inject(PlaybackManager);

  isExpanded = signal<boolean>(true);
  isTimeHovered = signal<boolean>(false);

  toggleExpand(): void {
    this.isExpanded.update((v) => !v);
  }

  onSeekStart() {
    this.playbackManager.setMute(true);
  }

  onSeek(event: any) {
    this.playbackManager.seek(Number(event.target.value));
  }

  onSeekEnd() {
    this.playbackManager.setMute(false);
  }

  scrollToCurrentSong() {
    const currentSong = this.playbackManager.currentSong();
    if (!currentSong) return;

    const elementId = `song-${currentSong.id}`;
    const element = document.getElementById(elementId);

    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });

      // pequeño efecto visual
      element.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-2', 'ring-offset-gray-950');

      setTimeout(() => {
        element.classList.remove(
          'ring-2',
          'ring-indigo-500',
          'ring-offset-2',
          'ring-offset-gray-950',
        );
      }, 2000);
    }
  }
}
