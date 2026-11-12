import { Routes } from '@angular/router';
import { LayoutComponent } from '../components/layout/layout.component';
import { HomeComponent } from '../components/home/home.component';
import { adminGuard } from '../guard/admin.guard';

// The storefront shell and the homepage load up front; every other page is
// fetched when it is first visited, so shoppers never download the admin area.
export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'shop', loadComponent: () => import('../components/shop-page/shop-page.component').then(m => m.ShopPageComponent) },
      { path: 'lookbook', loadComponent: () => import('../components/lookbook-page/lookbook-page.component').then(m => m.LookbookPageComponent) },
      { path: 'product/:id', loadComponent: () => import('../components/product-information/product-information.component').then(m => m.ProductInformationComponent) },
      { path: 'cart', loadComponent: () => import('../components/cart-page/cart-page.component').then(m => m.CartPageComponent) },
      { path: 'login', loadComponent: () => import('../components/login/login.component').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('../components/register/register.component').then(m => m.RegisterComponent) },
      { path: 'profile', loadComponent: () => import('../components/userprofile/userprofile.component').then(m => m.UserprofileComponent) },
      { path: 'about', loadComponent: () => import('../components/about-page/about-page.component').then(m => m.AboutPageComponent) },
      { path: 'contact', loadComponent: () => import('../components/contact/contact.component').then(m => m.ContactComponent) },
      { path: 'wish', loadComponent: () => import('../components/wishlist-page/wishlist-page.component').then(m => m.WishlistPageComponent) },
      { path: 'success', loadComponent: () => import('../components/payment-success/payment-success.component').then(m => m.PaymentSuccessComponent) },
      { path: 'cancel', loadComponent: () => import('../components/payment-cancel/payment-cancel.component').then(m => m.PaymentCancelComponent) },
    ]
  },

  {
    path: 'admin',
    loadComponent: () => import('../admin/layout/layout1.component').then(m => m.LayoutComponent1),
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('../admin/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'products', loadComponent: () => import('../admin/product/product.component').then(m => m.ProductComponent) },
      { path: 'orders', loadComponent: () => import('../admin/order/order.component').then(m => m.OrderComponent) },
      { path: 'customers', loadComponent: () => import('../admin/customer/customer.component').then(m => m.CustomerComponent) },
      { path: 'analytics', loadComponent: () => import('../admin/analytics/analytics.component').then(m => m.AnalyticsComponent) },
      { path: 'settings', loadComponent: () => import('../admin/setting/setting.component').then(m => m.SettingComponent) },
      { path: 'category', loadComponent: () => import('../admin/category/category.component').then(m => m.CategoryComponent) },
    ]
  },

  { path: '**', redirectTo: '' }
];
