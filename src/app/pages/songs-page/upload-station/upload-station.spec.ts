import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadStation } from './upload-station';

describe('UploadStation', () => {
  let component: UploadStation;
  let fixture: ComponentFixture<UploadStation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadStation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadStation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
