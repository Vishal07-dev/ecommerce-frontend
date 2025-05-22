import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../service/auth.service';  // Adjust path as needed
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  loginForm: FormGroup;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.authService.login(
        this.loginForm.value.email,
        this.loginForm.value.password
      ).subscribe({
        next: () => {
          
        const role = this.authService.getUserRole();
        if (role === 'user') {
          this.router.navigate(['/']); // redirect to home
        } else if (role === 'admin') {
          this.router.navigate(['/admin']); // redirect to admin
        } else {
          this.router.navigate(['/login']); // fallback
        }
      }, // or redirect as per role
        error: (err) => {
          console.error('Login failed:', err);
          alert('Login failed. Check credentials.');
        }
      });
    }
  }
}
