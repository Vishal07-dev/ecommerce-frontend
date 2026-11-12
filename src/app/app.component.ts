import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MotionService } from '../ui/motion.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class AppComponent {
  constructor() {
    inject(MotionService).init();
  }
}
