import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfettiToastComponent } from './confetti-toast.component';

describe('ConfettiToastComponent', () => {
  let component: ConfettiToastComponent;
  let fixture: ComponentFixture<ConfettiToastComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfettiToastComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfettiToastComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
