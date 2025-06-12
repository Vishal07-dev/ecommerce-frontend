import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-payment-cancel',
  imports: [CommonModule],
  templateUrl: './payment-cancel.component.html',
  styleUrl: './payment-cancel.component.css'
})
export class PaymentCancelComponent {
 sessionId: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Extract session ID if available
    this.route.queryParams.subscribe(params => {
      this.sessionId = params['session_id'];
    });
  }

  tryAgain() {
    // Navigate back to checkout or payment page
    this.router.navigate(['/checkout']);
  }

  returnToCart() {
    // Navigate to cart page
    this.router.navigate(['/cart']);
  }

  continueShopping() {
    // Navigate to home or products page
    this.router.navigate(['/']);
  }

  contactSupport() {
    // Navigate to support page or open support modal
    this.router.navigate(['/support']);
    // Or you could open a support chat widget, email client, etc.
  }
}
