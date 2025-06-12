import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-payment-success',
  imports: [CommonModule],
  templateUrl: './payment-success.component.html',
  styleUrl: './payment-success.component.css'
})
export class PaymentSuccessComponent {
paymentDetails: any = {};

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Extract query parameters from Stripe redirect
    this.route.queryParams.subscribe(params => {
      this.paymentDetails = {
        sessionId: params['session_id'],
        amount: params['amount'],
        email: params['email']
      };
    });
  }

  goToHome() {
    this.router.navigate(['/']);
  }

  downloadReceipt() {
    // Implement receipt download logic
    console.log('Downloading receipt...');
    // You can call your API to generate and download receipt
  }
}
