import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterModelComponent } from './register-model.component';

describe('RegisterModelComponent', () => {
  let component: RegisterModelComponent;
  let fixture: ComponentFixture<RegisterModelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterModelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterModelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
