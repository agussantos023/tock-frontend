import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VolumeVisualizer } from './volume-visualizer';

describe('VolumeVisualizer', () => {
  let component: VolumeVisualizer;
  let fixture: ComponentFixture<VolumeVisualizer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VolumeVisualizer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VolumeVisualizer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
