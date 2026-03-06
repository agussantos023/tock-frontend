import { Component, inject, signal } from '@angular/core';
import { PlaybackManager } from '../../services/playback-manager';
import { SongManager } from '../../services/song-manager';
import { DurationPipe } from '../../pipes/duration-pipe';
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

  isTimeHovered = signal<boolean>(false);

  onSeek(event: any) {
    this.playbackManager.seek(event.target.value);
  }
}
