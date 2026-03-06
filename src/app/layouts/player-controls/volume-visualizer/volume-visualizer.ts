import { Component, inject } from '@angular/core';
import { PlaybackManager } from '../../../services/playback-manager';

@Component({
  selector: 'app-volume-visualizer',
  imports: [],
  templateUrl: './volume-visualizer.html',
  styleUrl: './volume-visualizer.css',
})
export class VolumeVisualizer {
  protected playbackManager = inject(PlaybackManager);

  volumeBars = new Array(25).fill(0).map(() => ({
    randomDelay: Math.random(),
  }));

  onBarClick(event: MouseEvent) {
    const container = event.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left; // Posición X del clic dentro del div
    const width = rect.width;

    // Calculamos el porcentaje (0 a 1)
    let newVolume = x / width;

    // Limitar entre 0 y 1 por seguridad
    newVolume = Math.max(0, Math.min(1, newVolume));

    this.playbackManager.updateVolume(newVolume);
  }
}
