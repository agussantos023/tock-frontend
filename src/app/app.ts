import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PlayerControls } from './layouts/player-controls/player-controls';
import { ToastContainer } from './shared/components/toast-container/toast-container';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PlayerControls, ToastContainer],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('tock-frontend');
}
