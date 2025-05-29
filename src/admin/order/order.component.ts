import { CommonModule, NgIf } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
interface Order {
  id: string;
  customer: {
    name: string;
    email: string;
  };
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
  shippingAddress: string;
}

@Component({
  selector: 'app-order',
  imports: [NgIf,FormsModule,CommonModule],
  templateUrl: './order.component.html',
  styleUrl: './order.component.css'
})
export class OrderComponent {
 searchTerm = '';
  selectedStatus = '';
  selectedDate = '';

  orders: Order[] = [
    {
      id: '#ORD-1001',
      customer: {
        name: 'John Doe',
        email: 'john.doe@example.com'
      },
      items: [
        { name: 'Wireless Headphones', quantity: 1, price: 299.99 }
      ],
      total: 299.99,
      status: 'pending',
      date: '2024-01-15',
      shippingAddress: '123 Main St, Anytown, ST 12345'
    },
    {
      id: '#ORD-1002',
      customer: {
        name: 'Jane Smith',
        email: 'jane.smith@example.com'
      },
      items: [
        { name: 'Smart Watch', quantity: 1, price: 199.99 },
        { name: 'USB-C Cable', quantity: 2, price: 24.99 }
      ],
      total: 249.97,
      status: 'processing',
      date: '2024-01-14',
      shippingAddress: '456 Oak Ave, Another City, ST 67890'
    },
    {
      id: '#ORD-1003',
      customer: {
        name: 'Mike Johnson',
        email: 'mike.johnson@example.com'
      },
      items: [
        { name: 'Laptop Stand', quantity: 1, price: 79.99 }
      ],
      total: 79.99,
      status: 'shipped',
      date: '2024-01-13',
      shippingAddress: '789 Pine St, Third Town, ST 11111'
    },
    {
      id: '#ORD-1004',
      customer: {
        name: 'Sarah Wilson',
        email: 'sarah.wilson@example.com'
      },
      items: [
        { name: 'Coffee Mug', quantity: 2, price: 15.99 },
        { name: 'T-Shirt', quantity: 1, price: 29.99 }
      ],
      total: 61.97,
      status: 'delivered',
      date: '2024-01-12',
      shippingAddress: '321 Elm St, Fourth City, ST 22222'
    },
    {
      id: '#ORD-1005',
      customer: {
        name: 'David Brown',
        email: 'david.brown@example.com'
      },
      items: [
        { name: 'Wireless Headphones', quantity: 1, price: 299.99 }
      ],
      total: 299.99,
      status: 'cancelled',
      date: '2024-01-11',
      shippingAddress: '654 Maple Dr, Fifth Town, ST 33333'
    }
  ];

  filteredOrders = signal<Order[]>([]);

  ngOnInit() {
    this.updateFilteredOrders();
  }

  updateFilteredOrders() {
    let filtered = this.orders;

    if (this.searchTerm) {
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        order.customer.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        order.customer.email.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    if (this.selectedStatus) {
      filtered = filtered.filter(order => order.status === this.selectedStatus);
    }

    if (this.selectedDate) {
      filtered = filtered.filter(order => order.date === this.selectedDate);
    }

    this.filteredOrders.set(filtered);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  viewOrder(order: Order) {
    console.log('Viewing order:', order);
    // Implement order detail view
  }

  updateOrderStatus(order: Order, newStatus: Order['status']) {
    const index = this.orders.findIndex(o => o.id === order.id);
    if (index !== -1) {
      this.orders[index].status = newStatus;
      this.updateFilteredOrders();
    }
  }
}
