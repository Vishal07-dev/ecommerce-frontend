import { NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
interface Settings {
  store: {
    name: string;
    email: string;
    phone: string;
    address: string;
    currency: string;
    timezone: string;
  };
  payment: {
    methods: {
      cards: boolean;
      paypal: boolean;
      bankTransfer: boolean;
      applePay: boolean;
      googlePay: boolean;
    };
    currencies: string[];
  };
  notifications: {
     [key: string]: boolean;
    newOrders: boolean;
    lowStock: boolean;
    customerMessages: boolean;
    weeklyReports: boolean;
    dailyReports: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    ipWhitelist: string[];
    ipWhitelistString?: string;
  };
}
@Component({
  selector: 'app-setting',
  imports: [FormsModule,NgFor,NgIf],
  templateUrl: './setting.component.html',
  styleUrl: './setting.component.css'
})
export class SettingComponent {
activeTab: string = 'general';


  tabs = [
    { id: 'general', name: 'General' },
    { id: 'payment', name: 'Payment' },
    { id: 'shipping', name: 'Shipping' },
    { id: 'notifications', name: 'Notifications' },
    { id: 'security', name: 'Security' }
  ];
notificationItems = [
  { key: 'newOrders', label: 'New Orders' },
  { key: 'lowStock', label: 'Low Stock Alerts' },
  { key: 'customerMessages', label: 'Customer Messages' },
  { key: 'weeklyReports', label: 'Weekly Summary Reports' },
  { key: 'dailyReports', label: 'Daily Sales Reports' },
];

  settings = {
    storeName: '',
    storeEmail: '',
    storePhone: '',
    currency: 'USD',
    storeAddress: '',

    paymentMethods: {
      cards: false,
      paypal: false,
      bankTransfer: false
    },

    shipping: {
      standard: {
        enabled: false,
        price: 0,
        deliveryTime: ''
      }
    },

    notifications: {
      
      newOrders: false,
      lowStock: false,
      customerMessages: false,
      weeklyReports: false,
      dailyReports: false
    },

    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      ipWhitelistString: ''
    }
  };

}
