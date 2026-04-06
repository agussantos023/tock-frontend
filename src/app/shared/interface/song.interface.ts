export interface Song {
  id: number;
  title: string;
  artist: string;
  duration: number;
  file_size: string;
  created_at: string;
  audio_url: string;
}

export interface PaginatedSongs {
  page: number;
  limit: number;
  data: Song[];
}

export interface DeleteSongsResponse {
  message: string;
  count: number;
  storage: {
    used: string;
    limit: string;
    available: string;
  };
}
