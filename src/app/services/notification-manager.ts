import { Injectable, signal } from '@angular/core';
import { NotificationType, Toast } from '../shared/interface/notification.interface';

@Injectable({
  providedIn: 'root',
})
export class NotificationManager {
  #toasts = signal<Toast[]>([]);

  public toasts = this.#toasts.asReadonly();

  show(message: string, type: NotificationType = 'success') {
    const id = Date.now();

    this.#toasts.update((prev) => [...prev, { id, message, type }]);

    // Auto-eliminar después de 4 segundos
    setTimeout(() => this.remove(id), 4000);
  }

  remove(id: number) {
    this.#toasts.update((prev) => prev.filter((t) => t.id !== id));
  }
}
