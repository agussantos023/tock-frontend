export type NotificationType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: NotificationType;
}
