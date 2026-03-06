import { Component, inject } from '@angular/core';
import { PlaybackManager } from '../../services/playback-manager';
import { SongManager } from '../../services/song-manager';
import { DurationPipe } from '../../pipes/duration-pipe';

@Component({
  selector: 'app-player-controls',
  imports: [DurationPipe],
  templateUrl: './player-controls.html',
  styleUrl: './player-controls.css',
})
export class PlayerControls {
  protected songManager = inject(SongManager);
  protected playbackManager = inject(PlaybackManager);

  onSeek(event: any) {
    this.playbackManager.seek(event.target.value);
  }

  onVolume(event: any) {
    this.playbackManager.updateVolume(event.target.value);
  }
}
