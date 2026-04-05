import { inject, Injectable, signal } from '@angular/core';
import { SongManager } from './song-manager';
import { Song } from '../shared/interface/song.interface';

const VOLUME_KEY = 'tock_player_volume';

@Injectable({
  providedIn: 'root',
})
export class PlaybackManager {
  private songManager = inject(SongManager);
  private audio = new Audio();

  // Estados
  currentSong = signal<Song | null>(null);
  isPlaying = signal<boolean>(false);
  currentTime = signal<number>(0);
  duration = signal<number>(0);
  volume = signal<number>(this.getStoredVolume());

  constructor() {
    this.audio.volume = this.volume();

    this.setupAudioListeners();
  }

  private setupAudioListeners() {
    this.audio.ontimeupdate = () => this.currentTime.set(this.audio.currentTime);
    this.audio.onloadedmetadata = () => {
      this.duration.set(this.audio.duration);
      this.updateMediaSession(); // Actualizar metadatos
    };

    this.audio.onended = () => this.next();

    // Escuchar cambios del elemento audio
    this.audio.onplay = () => {
      this.isPlaying.set(true);
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
    };
    this.audio.onpause = () => {
      this.isPlaying.set(false);
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    };
  }

  private updateMediaSession() {
    if (!('mediaSession' in navigator)) return;

    const song = this.currentSong();
    if (!song) return;

    // Mostrar info en el SO
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist || 'Artista desconocido',
      album: 'Tock Music',
    });

    // Mapear botones
    navigator.mediaSession.setActionHandler('play', () => this.togglePlay());
    navigator.mediaSession.setActionHandler('pause', () => this.togglePlay());
    navigator.mediaSession.setActionHandler('previoustrack', () => this.previous());
    navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
  }

  async playSong(song: Song) {
    if (this.currentSong()?.id === song.id) {
      this.togglePlay();
      return;
    }

    this.currentSong.set(song);
    this.songManager.getAudioBlob(song.id).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      this.audio.src = url;
      this.audio.play();
      this.isPlaying.set(true);
    });
  }

  togglePlay() {
    if (this.audio.paused) {
      this.audio.play();
      this.isPlaying.set(true);
    } else {
      this.audio.pause();
      this.isPlaying.set(false);
    }
  }

  async next() {
    const list = this.songManager.songs();
    const currentIndex = list.findIndex((s) => s.id === this.currentSong()?.id);

    if (currentIndex >= list.length - 3 && !this.songManager.isAllSongsLoaded()) {
      await this.songManager.loadMore();
    }

    // Recalculamos la lista y el índice
    const updatedList = this.songManager.songs();
    let nextIndex = currentIndex + 1;

    // si hemos llegado al final absoluto
    if (nextIndex >= updatedList.length) {
      nextIndex = 0; // Volver al principio
    }

    this.playSong(updatedList[nextIndex]);
  }

  previous() {
    const list = this.songManager.songs();
    const index = list.findIndex((s) => s.id === this.currentSong()?.id);

    const prevIndex = (index - 1 + list.length) % list.length;
    this.playSong(list[prevIndex]);
  }

  async shuffleAndPlay() {
    const shuffledSongs = await this.songManager.shuffle();

    if (shuffledSongs.length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Reproduce automáticamente la primera canción de la nueva lista
      this.playSong(shuffledSongs[0]);
    }
  }

  eject() {
    this.audio.pause();
    this.audio.src = '';
    this.audio.load();

    this.currentSong.set(null);
    this.isPlaying.set(false);
    this.currentTime.set(0);
    this.duration.set(0);

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
    }
  }

  reset() {
    this.audio.currentTime = 0;

    // Si estaba pausada empieza automaticamente
    if (!this.isPlaying()) {
      this.audio.play();
      this.isPlaying.set(true);
    }
  }

  updateVolume(value: number) {
    const safeVolume = Math.max(0, Math.min(1, value));

    this.audio.volume = safeVolume;
    this.volume.set(safeVolume);

    localStorage.setItem(VOLUME_KEY, safeVolume.toString());
  }

  setMute(mute: boolean) {
    this.audio.muted = mute;
  }

  seek(time: number) {
    this.audio.currentTime = time;

    this.currentTime.set(time);
  }

  private getStoredVolume(): number {
    const saved = localStorage.getItem(VOLUME_KEY);
    return saved ? parseFloat(saved) : 0.5;
  }
}
