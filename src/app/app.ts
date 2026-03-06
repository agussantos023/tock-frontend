import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PlayerControls } from './layouts/player-controls/player-controls';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PlayerControls],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('tock-frontend');
}
