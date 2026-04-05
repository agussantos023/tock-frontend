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

  showBulkDeleteModal = signal(false);

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

  toggleUploadStation() {
    if (this.isSelectionMode()) {
      this.isSelectionMode.set(false);
      this.selectedIds.set(new Set());
    }
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
    if (this.showUploadStation()) this.showUploadStation.set(false);

    this.isSelectionMode.update((v) => !v);

    if (!this.isSelectionMode()) {
      this.selectedIds.set(new Set());
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
    const count = this.selectionCount();

    if (count === 0) return;

    // Si es solo una, borramos del tirón. Si son varias, pedimos confirmación.
    if (count === 1) {
      await this.executeDeletion();
    } else {
      this.showBulkDeleteModal.set(true);
    }
  }

  async executeDeletion() {
    try {
      const selectedIdsArray = Array.from(this.selectedIds());
      const idsToDelete = this.isAllSelected() ? 'all' : selectedIdsArray;

      const current = this.playbackManager.currentSong();
      if (current) {
        const isCurrentDeleted = this.isAllSelected() || selectedIdsArray.includes(current.id);
        if (isCurrentDeleted) this.playbackManager.eject();
      }

      await this.songManager.delete(idsToDelete);

      // Limpieza
      this.closeBulkDeleteModal();
      this.isSelectionMode.set(false);
      this.selectedIds.set(new Set());
    } catch (err) {
      console.error('Error al eliminar:', err);
    }
  }

  closeBulkDeleteModal() {
    this.showBulkDeleteModal.set(false);
  }
}
