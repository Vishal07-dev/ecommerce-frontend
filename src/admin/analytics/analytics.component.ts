import { Component } from '@angular/core';

@Component({
  selector: 'app-analytics',
  imports: [],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.css'
})
export class AnalyticsComponent {
  topProducts = [
    { name: 'Wireless Headphones', sales: 245, revenue: 12450, percentage: 85 },
    { name: 'Smart Watch', sales: 189, revenue: 9450, percentage: 65 },
    { name: 'Laptop Stand', sales: 156, revenue: 4680, percentage: 42 },
    { name: 'USB-C Cable', sales: 134, revenue: 2680, percentage: 30 }
  ];

  recentActivity = [
    { type: 'order', message: 'New order #1234 received', time: '5 minutes ago' },
    { type: 'payment', message: 'Payment of $299.99 processed', time: '12 minutes ago' },
    { type: 'customer', message: 'New customer John Doe registered', time: '1 hour ago' },
    { type: 'product', message: 'Product "Smart Watch" updated', time: '2 hours ago' },
    { type: 'order', message: 'Order #1230 shipped', time: '3 hours ago' }
  ];

  ngOnInit() {
    // Initialize analytics data
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'order': return 'O';
      case 'payment': return 'p';
      case 'customer': return 'C';
      case 'product': return 'P';
      default: return '?';
    }
  }
}


