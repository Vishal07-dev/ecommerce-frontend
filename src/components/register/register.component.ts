import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';  // For *ngIf and *ngFor
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule,CommonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
productForm: FormGroup
 constructor(private fb: FormBuilder, private http: HttpClient  ,private router: Router) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', Validators.required],
      // category: ['', Validators.required],
      password: ['', Validators.required],
      address: ['', Validators.required],
      // image: [''],
    });
  }

onSubmit() {
    
    if (this.productForm.valid) {
      const productData = this.productForm.value;
      console.log('Submitting product:', productData);

      this.http.post('https://ecommerce-backend-n4tk.onrender.com/api/user/create', productData)
.subscribe({
        next: () => {
          alert('user created successfully!');
          this.productForm.reset();
          this.router.navigate(['/admin']); // redirect to admin

        },
        error: (err) => {
          console.error('Error creating user:', err);
          alert('Failed to create user. Check console.');
        },
      });
    }
  }

}
