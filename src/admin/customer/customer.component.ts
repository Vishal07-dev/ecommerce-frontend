import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
  status: 'active' | 'inactive';
  joinDate: string;
  lastOrder: string;
}
@Component({
  selector: 'app-customer',
  imports: [CommonModule, FormsModule],
  templateUrl: './customer.component.html',
  styleUrl: './customer.component.css'
})
export class CustomerComponent {
 searchTerm = '';
  selectedStatus = '';
  sortBy = 'name';

  customers: Customer[] = [
    {
      id: 'CUST-001',
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      address: '123 Main St, Anytown, ST 12345',
      totalOrders: 12,
      totalSpent: 1548.99,
      status: 'active',
      joinDate: '2023-03-15',
      lastOrder: '2024-01-15'
    },
    {
      id: 'CUST-002',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+1 (555) 234-5678',
      address: '456 Oak Ave, Another City, ST 67890',
      totalOrders: 8,
      totalSpent: 967.45,
      status: 'active',
      joinDate: '2023-05-22',
      lastOrder: '2024-01-14'
    },
    {
      id: 'CUST-003',
      name: 'Mike Johnson',
      email: 'mike.johnson@example.com',
      phone: '+1 (555) 345-6789',
      address: '789 Pine St, Third Town, ST 11111',
      totalOrders: 15,
      totalSpent: 2134.67,
      status: 'active',
      joinDate: '2023-01-10',
      lastOrder: '2024-01-13'
    },
    {
      id: 'CUST-004',
      name: 'Sarah Wilson',
      email: 'sarah.wilson@example.com',
      phone: '+1 (555) 456-7890',
      address: '321 Elm St, Fourth City, ST 22222',
      totalOrders: 3,
      totalSpent: 245.88,
      status: 'inactive',
      joinDate: '2023-11-05',
      lastOrder: '2023-12-20'
    },
    {
      id: 'CUST-005',
      name: 'David Brown',
      email: 'david.brown@example.com',
      phone: '+1 (555) 567-8901',
      address: '654 Maple Dr, Fifth Town, ST 33333',
      totalOrders: 7,
      totalSpent: 892.34,
      status: 'active',
      joinDate: '2023-08-18',
      lastOrder: '2024-01-10'
    },
    {
      id: 'CUST-006',
      name: 'Lisa Garcia',
      email: 'lisa.garcia@example.com',
      phone: '+1 (555) 678-9012',
      address: '987 Cedar Ln, Sixth City, ST 44444',
      totalOrders: 20,
      totalSpent: 3456.78,
      status: 'active',
      joinDate: '2022-12-03',
      lastOrder: '2024-01-16'
    }
  ];

  filteredCustomers = signal<Customer[]>([]);

  ngOnInit() {
    this.updateFilteredCustomers();
  }

  updateFilteredCustomers() {
    let filtered = [...this.customers];

    // Apply search filter
    if (this.searchTerm) {
      filtered = filtered.filter(customer => 
        customer.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(customer => customer.status === this.selectedStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'totalSpent':
          return b.totalSpent - a.totalSpent;
        case 'totalOrders':
          return b.totalOrders - a.totalOrders;
        case 'joinDate':
          return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
        default:
          return 0;
      }
    });

    this.filteredCustomers.set(filtered);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  viewCustomer(customer: Customer) {
    console.log('Viewing customer:', customer);
    // Implement customer detail view
  }

  editCustomer(customer: Customer) {
    console.log('Editing customer:', customer);
    // Implement customer edit functionality
  }

  deleteCustomer(customer: Customer) {
    if (confirm(`Are you sure you want to delete ${customer.name}?`)) {
      const index = this.customers.findIndex(c => c.id === customer.id);
      if (index !== -1) {
        this.customers.splice(index, 1);
        this.updateFilteredCustomers();
      }
    }
  }
}

