import { Routes } from '@angular/router';

import { LayoutComponent } from '../components/layout/layout.component';
import { HomeComponent } from '../components/home/home.component';
import { LoginComponent } from '../components/login/login.component';
import { RegisterComponent } from '../components/register/register.component';
import { UserprofileComponent } from '../components/userprofile/userprofile.component';

import { DashboardComponent } from '../admin/dashboard/dashboard.component';
import { ProductComponent } from '../admin/product/product.component';
import { OrderComponent } from '../admin/order/order.component';
import { CustomerComponent } from '../admin/customer/customer.component';
import { AnalyticsComponent } from '../admin/analytics/analytics.component';
import { SettingComponent } from '../admin/setting/setting.component';
import { LayoutComponent1 } from '../admin/layout/layout1.component';
import { adminGuard } from '../guard/admin.guard';

export const routes: Routes = [
  // Public routes
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'profile', component: UserprofileComponent }
    ]
  },

  // Admin routes
  {
    path: 'admin',
    component: LayoutComponent1,
    canActivate: [adminGuard], 
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'products', component: ProductComponent },
      { path: 'orders', component: OrderComponent },
      { path: 'customers', component: CustomerComponent },
      { path: 'analytics', component: AnalyticsComponent },
      { path: 'settings', component: SettingComponent }
    ]
  },

  // Fallback route
  { path: '**', redirectTo: '' }
];
