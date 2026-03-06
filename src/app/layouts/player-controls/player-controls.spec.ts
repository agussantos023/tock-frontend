import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerControls } from './player-controls';

describe('PlayerControls', () => {
  let component: PlayerControls;
  let fixture: ComponentFixture<PlayerControls>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerControls]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayerControls);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
