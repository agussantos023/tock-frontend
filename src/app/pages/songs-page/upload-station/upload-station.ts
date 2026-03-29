import { Component, inject, signal } from '@angular/core';
import { UploadManager } from '../../../services/upload-manager';
import { EditableTitle } from '../../../shared/directives/editable-title';

@Component({
  selector: 'app-upload-station',
  imports: [EditableTitle],
  templateUrl: './upload-station.html',
  styleUrl: './upload-station.css',
})
export class UploadStation {
  public uploadManager = inject(UploadManager);

  isDragging = signal(false);

  handleFiles(files: FileList | null | undefined) {
    if (!files || files.length === 0) return;

    const mp3Files = Array.from(files).filter(
      (file) => file.type === 'audio/mpeg' || file.name.toLowerCase().endsWith('.mp3'),
    );

    if (mp3Files.length === 0) {
      alert('Por favor, selecciona solo archivos MP3.');
      return;
    }

    this.uploadManager.addFilesToQueue(mp3Files);
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.handleFiles(input.files);
  }

  handleDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    this.handleFiles(event.dataTransfer?.files);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave() {
    this.isDragging.set(false);
  }
}
