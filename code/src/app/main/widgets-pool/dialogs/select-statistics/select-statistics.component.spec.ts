import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectStatisticsComponent } from './select-statistics.component';

describe('SelectStatisticsComponent', () => {
  let component: SelectStatisticsComponent;
  let fixture: ComponentFixture<SelectStatisticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SelectStatisticsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectStatisticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
