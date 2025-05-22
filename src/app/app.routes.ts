// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LayoutComponent } from '../components/layout/layout.component';
import { HomeComponent } from '../components/home/home.component';
import { LoginComponent } from '../components/login/login.component';
import { RegisterComponent } from '../components/register/register.component';
import { AdminDashboardComponent } from '../components/admin-dashboard/admin-dashboard.component';
// import { loginGuard } from '../guard/login.guard';  // Adjust path if needed
import { UserprofileComponent } from '../components/userprofile/userprofile.component';
import { adminGuard } from '../guard/admin.guard';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'profile', component: UserprofileComponent},
      { path: 'admin', component: AdminDashboardComponent, canActivate: [adminGuard] },
    ],
  },
  { path: '**', redirectTo: '' }, // fallback route
];
