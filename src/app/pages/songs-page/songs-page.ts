import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { SongManager } from '../../services/song-manager';
import { Song } from '../../shared/interface/song.interface';
import { DurationPipe } from '../../shared/pipes/duration-pipe';
import { PlaybackManager } from '../../services/playback-manager';
import { UploadManager } from '../../services/upload-manager';
import { UploadStation } from './upload-station/upload-station';
import { AuthUser } from '../../services/auth-user';
import { UsernamePipe } from '../../shared/pipes/username-pipe';
import { DecimalPipe } from '@angular/common';
import { DataSizePipe } from '../../shared/pipes/datasize-pipe';

@Component({
  selector: 'app-songs-page',
  imports: [DurationPipe, DecimalPipe, DataSizePipe, UploadStation, UsernamePipe],
  templateUrl: './songs-page.html',
  styleUrl: './songs-page.css',
})
export class SongsPage implements OnInit, AfterViewInit {
  public songManager = inject(SongManager);
  public authUser = inject(AuthUser);
  public playbackManager = inject(PlaybackManager);
  public uploadManager = inject(UploadManager);

  private observer!: IntersectionObserver;

  @ViewChild('profileMenuContainer') profileMenuContainer!: ElementRef;
  @ViewChild('confirmInput') inputRef!: ElementRef<HTMLInputElement>;

  showUploadStation = signal(false);
  showProfileMenu = signal(false);
  showDeleteModal = signal(false);
  canDelete = signal(false);

  isSelectionMode = signal(false);
  selectedIds = signal<Set<number>>(new Set());

  selectionCount = computed(() => this.selectedIds().size);
  isAllSelected = computed(() => {
    const songs = this.songManager.songs();
    return songs.length > 0 && this.selectedIds().size === songs.length;
  });

  deleteButtonText = computed(() => {
    if (this.isAllSelected()) return 'Eliminar todas las canciones';
    return `Eliminar ${this.selectionCount()} ${this.selectionCount() === 1 ? 'canción' : 'canciones'}`;
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.showProfileMenu()) return;

    const clickedInside = this.profileMenuContainer.nativeElement.contains(event.target);

    if (!clickedInside) this.showProfileMenu.set(false);
  }

  ngOnInit() {
    this.songManager.loadMore();
  }

  toggleForm() {
    this.showUploadStation.update((v) => !v);
  }

  ngAfterViewInit() {
    this.observer = new IntersectionObserver(
      (entries) => {
        // Si el centinela es visible y NO estamos cargando ya
        if (entries[0].isIntersecting && !this.songManager.loading()) {
          this.songManager.loadMore();
        }
      },
      {
        threshold: 0.1, //la función se disparará cuando apenas el 10% del centinela sea visible
      },
    );

    const sentinel = document.querySelector('#scroll-sentinel');
    if (sentinel) this.observer.observe(sentinel);
  }

  togglePlay(song: Song) {
    this.playbackManager.playSong(song);
  }

  ngOnDestroy() {
    if (this.observer) this.observer.disconnect();
  }

  toggleProfileMenu() {
    this.showProfileMenu.update((v) => !v);
  }

  onLogout() {
    this.authUser.logout();
  }

  openDeleteModal() {
    this.showProfileMenu.set(false);
    this.showDeleteModal.set(true);

    setTimeout(() => {
      this.inputRef?.nativeElement.focus();
    }, 0);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.canDelete.set(false);

    if (this.inputRef) {
      this.inputRef.nativeElement.value = '';
    }
  }

  checkDeleteConfirmation(value: string) {
    const isSame = value.toLowerCase() === 'eliminar';
    this.canDelete.set(isSame);
  }

  onConfirmDelete() {
    this.authUser.deleteAccount().subscribe({
      next: () => {
        console.log('Cuenta borrada con éxito');
      },
      error: (msg) => {
        alert(msg);
      },
    });
  }

  toggleSelectionMode() {
    this.isSelectionMode.update((v) => !v);

    if (!this.isSelectionMode()) {
      this.selectedIds.update((set) => {
        set.clear();
        return new Set(set);
      });
    }
  }

  toggleSongSelection(songId: number) {
    this.selectedIds.update((set) => {
      const newSet = new Set(set);
      if (newSet.has(songId)) newSet.delete(songId);
      else newSet.add(songId);
      return newSet;
    });
  }

  selectAll(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      const allIds = this.songManager.songs().map((s) => s.id);
      this.selectedIds.set(new Set(allIds));
    } else {
      this.selectedIds.set(new Set());
    }
  }

  async onBulkDelete() {
    const totalSelected = this.selectionCount();
    if (totalSelected === 0) return;

    // Si quieres una confirmación rápida antes de borrar
    const message = this.isAllSelected()
      ? '¿Estás seguro de que quieres eliminar TODAS las canciones?'
      : `¿Eliminar ${totalSelected} canciones?`;

    if (!confirm(message)) return;

    try {
      const idsToDelete = this.isAllSelected() ? 'all' : Array.from(this.selectedIds());

      await this.songManager.delete(idsToDelete);

      // Limpiamos el estado de selección tras el éxito
      this.isSelectionMode.set(false);
      this.selectedIds.set(new Set());
    } catch (err) {
      console.error('Error al eliminar canciones:', err);
    }
  }
}
