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

  onSeek(event: any) {
    this.playbackManager.seek(event.target.value);
  }
}
