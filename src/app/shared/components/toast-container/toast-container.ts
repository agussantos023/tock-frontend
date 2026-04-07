import { Component, inject } from '@angular/core';
import { NotificationManager } from '../../../services/notification-manager';

@Component({
  selector: 'app-toast-container',
  imports: [],
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.css',
})
export class ToastContainer {
  notificationManager = inject(NotificationManager);

  getToastClasses(type: string): string {
    const base = 'toast-card ';
    const types: Record<string, string> = {
      success: 'toast-success',
      error: 'toast-error',
      info: 'toast-info',
    };
    return base + (types[type] || types['info']);
  }
}
