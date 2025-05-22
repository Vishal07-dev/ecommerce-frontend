import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
interface StatCard {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  icon: string;
}

interface RecentOrder {
  id: string;
  customer: string;
  product: string;
  amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  date: string;
}
@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  stats: StatCard[] = [
    {
      title: 'Total Revenue',
      value: '$54,239',
      change: '+12.5%',
      changeType: 'increase',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    {
      title: 'Total Orders',
      value: '1,429',
      change: '+8.2%',
      changeType: 'increase',
      icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
    },
    {
      title: 'Total Products',
      value: '342',
      change: '+5.1%',
      changeType: 'increase',
      icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
    },
    {
      title: 'Active Customers',
      value: '892',
      change: '-2.3%',
      changeType: 'decrease',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
    }
  ];

  recentOrders: RecentOrder[] = [
    {
      id: '#1234',
      customer: 'John Doe',
      product: 'Wireless Headphones',
      amount: 299.99,
      status: 'completed',
      date: '2024-01-15'
    },
    {
      id: '#1235',
      customer: 'Jane Smith',
      product: 'Smart Watch',
      amount: 199.99,
      status: 'pending',
      date: '2024-01-14'
    },
    {
      id: '#1236',
      customer: 'Mike Johnson',
      product: 'Laptop Stand',
      amount: 79.99,
      status: 'completed',
      date: '2024-01-13'
    },
    {
      id: '#1237',
      customer: 'Sarah Wilson',
      product: 'USB-C Cable',
      amount: 24.99,
      status: 'cancelled',
      date: '2024-01-12'
    }
  ];

  topProducts = [
    { name: 'Wireless Headphones', sales: 245, revenue: 12450 },
    { name: 'Smart Watch', sales: 189, revenue: 9450 },
    { name: 'Laptop Stand', sales: 156, revenue: 4680 },
    { name: 'USB-C Cable', sales: 134, revenue: 2680 }
  ];

  ngOnInit() {
    // Initialize component data
  }
}
