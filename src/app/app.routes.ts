import { Routes } from '@angular/router';
import { LayoutComponent } from '../components/layout/layout.component';
import { HomeComponent } from '../components/home/home.component';
import { adminGuard, roleGuard } from '../guard/admin.guard';
import { accountGuard } from '../guard/account.guard';

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
      { path: 'profile', canActivate: [accountGuard], loadComponent: () => import('../components/userprofile/userprofile.component').then(m => m.UserprofileComponent) },
      { path: 'account', redirectTo: 'profile' },
      { path: 'about', loadComponent: () => import('../components/about-page/about-page.component').then(m => m.AboutPageComponent) },
      { path: 'contact', loadComponent: () => import('../components/contact/contact.component').then(m => m.ContactComponent) },
      { path: 'wish', loadComponent: () => import('../components/wishlist-page/wishlist-page.component').then(m => m.WishlistPageComponent) },
      { path: 'join/:token', loadComponent: () => import('../components/join-page/join-page.component').then(m => m.JoinPageComponent) },
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
      { path: 'dashboard', data: { title: 'Overview' }, loadComponent: () => import('../admin/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'orders', data: { title: 'Orders' }, loadComponent: () => import('../admin/order/order.component').then(m => m.OrderComponent) },
      { canActivate: [roleGuard('owner', 'admin')], path: 'products', data: { title: 'Products' }, loadComponent: () => import('../admin/product/product.component').then(m => m.ProductComponent) },
      { canActivate: [roleGuard('owner', 'admin')], path: 'products/new', data: { title: 'New product' }, loadComponent: () => import('../admin/product-editor/product-editor.component').then(m => m.ProductEditorComponent) },
      { canActivate: [roleGuard('owner', 'admin')], path: 'products/:id', data: { title: 'Edit product' }, loadComponent: () => import('../admin/product-editor/product-editor.component').then(m => m.ProductEditorComponent) },
      { canActivate: [roleGuard('owner', 'admin')], path: 'customers', data: { title: 'Customers' }, loadComponent: () => import('../admin/customer/customer.component').then(m => m.CustomerComponent) },
      { canActivate: [roleGuard('owner', 'admin')], path: 'category', data: { title: 'Categories' }, loadComponent: () => import('../admin/category/category.component').then(m => m.CategoryComponent) },
      { path: 'team', canActivate: [roleGuard('owner')], data: { title: 'Team' }, loadComponent: () => import('../admin/team/team.component').then(m => m.TeamComponent) },
      // Analytics and Settings were mock-only screens; the Overview covers analytics.
      { path: 'analytics', redirectTo: 'dashboard' },
      { path: 'settings', redirectTo: 'dashboard' },
    ]
  },

  { path: '**', redirectTo: '' }
];
