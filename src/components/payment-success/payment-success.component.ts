import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environment/environment';


@Component({
  selector: 'app-payment-success',
  imports: [CommonModule],
  templateUrl: './payment-success.component.html',
  styleUrl: './payment-success.component.css'
})
export class PaymentSuccessComponent {
paymentDetails: any = {};
  apiUrl = environment.apiUrl;

http=inject(HttpClient)
  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Extract query parameters from Stripe redirect
    this.route.queryParams.subscribe(params => {
    const sessionId = params['session_id'];
    this.http.post(`${this.apiUrl}/payment/store-order`, { sessionId }).subscribe((res: any) => {
      this.paymentDetails = res;
      console.log(res);
      
    });
  });
  }

  goToHome() {
    this.router.navigate(['/']);
  }

  downloadReceipt() {
  const orderId = this.paymentDetails?.orderId;
  if (!orderId) return;

  this.http.get(`${this.apiUrl}/receipet/download-receipt/${orderId}`, {
    responseType: 'blob'
  }).subscribe(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${orderId}.pdf`;
    a.click();
  });
}

}
