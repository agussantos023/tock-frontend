export type UploadStatus = 'pending' | 'converting' | 'uploading' | 'success' | 'error' | 'stopped';

export interface UploadTask {
  id: string;
  file: File;
  title: string;
  status: UploadStatus;
  progress: number; // 0 a 100
  error?: string; // Mensaje en caso de fallo
  finalBlob?: Blob; // El archivo .opus resultante
}

export interface UploadStats {
  total: number;
  completed: number;
  failed: number;
  isPaused: boolean;
}
