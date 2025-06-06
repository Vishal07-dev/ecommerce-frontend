import { Component, AfterViewInit, inject, ElementRef } from '@angular/core';
import { HotToastRef } from '@ngxpert/hot-toast';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-confetti-toast',
  standalone: true,
  template: `<div class="font-semibold">🎉 Added to cart successfully!</div>`,
})
export class ConfettiToastComponent implements AfterViewInit {
  toastRef = inject(HotToastRef);
  elementRef = inject(ElementRef);

  ngAfterViewInit() {
    setTimeout(() => {
      const element = this.elementRef.nativeElement as HTMLElement;
      const { x, y, width, height } = element.getBoundingClientRect();
      const origin = {
        x: (x + width / 2) / window.innerWidth,
        y: (y + height / 2) / window.innerHeight,
      };

      this.launchConfetti(origin);
    }, 200);
  }

  private launchConfetti(origin: { x: number; y: number }) {
    confetti({
      particleCount: 100,
      spread: 70,
      origin,
    });
  }
}
