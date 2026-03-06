import { inject, Injectable, signal } from '@angular/core';
import { SongManager } from './song-manager';
import { Song } from '../interface/song.interface';

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
  volume = signal<number>(0.5);

  constructor() {
    this.setupAudioListeners();
  }

  private setupAudioListeners() {
    this.audio.ontimeupdate = () => this.currentTime.set(this.audio.currentTime);
    this.audio.onloadedmetadata = () => this.duration.set(this.audio.duration);
    this.audio.onended = () => this.next();
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

  next() {
    const list = this.songManager.songs();
    const index = list.findIndex((s) => s.id === this.currentSong()?.id);
    const nextIndex = (index + 1) % list.length;
    this.playSong(list[nextIndex]);
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

  updateVolume(value: number) {
    this.audio.volume = value;
    this.volume.set(value);
  }

  seek(time: number) {
    this.audio.currentTime = time;
  }
}
