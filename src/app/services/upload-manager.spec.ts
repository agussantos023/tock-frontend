import { TestBed } from '@angular/core/testing';

import { UploadManager } from './upload-manager';

describe('UploadManager', () => {
  let service: UploadManager;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UploadManager);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
