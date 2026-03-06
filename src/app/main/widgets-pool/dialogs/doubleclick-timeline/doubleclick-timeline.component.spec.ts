import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoubleclickTimelineComponent } from './doubleclick-timeline.component';

describe('DoubleclickTimelineComponent', () => {
  let component: DoubleclickTimelineComponent;
  let fixture: ComponentFixture<DoubleclickTimelineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DoubleclickTimelineComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DoubleclickTimelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
