import { Component, HostListener, inject, signal } from '@angular/core';
import { PlaybackManager } from '../../../services/playback-manager';

@Component({
  selector: 'app-volume-visualizer',
  imports: [],
  templateUrl: './volume-visualizer.html',
  styleUrl: './volume-visualizer.css',
})
export class VolumeVisualizer {
  protected playbackManager = inject(PlaybackManager);

  private isDragging = signal<boolean>(false);

  volumeBars = new Array(25).fill(0).map(() => ({
    randomDelay: Math.random(),
  }));

  onMouseDown(event: MouseEvent) {
    this.isDragging.set(true);

    this.updateVolumeFromEvent(event);
  }

  // Escuchar el movimiento globalmente mientras se arrastra
  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.isDragging()) this.updateVolumeFromEvent(event);
  }

  // Soltar el clic en cualquier parte de la pantalla
  @HostListener('window:mouseup')
  onMouseUp() {
    this.isDragging.set(false);
  }

  private updateVolumeFromEvent(event: MouseEvent) {
    const container = document.querySelector('.volume-container') as HTMLElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const width = rect.width;

    const newVolume = Math.max(0, Math.min(1, x / width));
    this.playbackManager.updateVolume(newVolume);
  }
}
