import { TestBed } from '@angular/core/testing';

import { PlaybackManager } from './playback-manager';

describe('PlaybackManager', () => {
  let service: PlaybackManager;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlaybackManager);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
