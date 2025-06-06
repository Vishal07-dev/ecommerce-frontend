import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../service/auth.service';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-userprofile',
  imports: [NgIf,FormsModule,NgFor],
  templateUrl: './userprofile.component.html',
  styleUrl: './userprofile.component.css'
})
export class UserprofileComponent implements OnInit{
recentOrders: any;
order: any;
toggleEdit() {
throw new Error('Method not implemented.');
}
cancelEdit() {
throw new Error('Method not implemented.');
}
auth = inject(AuthService)
user:any;
isEditing: any;
ngOnInit(): void {
  console.log(this.auth.getprofile());
  
   this.auth.getprofile().subscribe((res:any)=>{
    this.user=res
   })
}
onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      console.log('Selected file:', file);
      // You can save this to send later with the update request
    }
  }

  updateProfile() {
    if (!this.user || !this.user.user) return;
    
    this.auth.updateuser(this.user.user).subscribe({
      next: (updatedData: any) => {
            console.log(this.user.user);

        alert('Profile updated successfully');
        this.user.user = updatedData;
      },
      error: (err) => {
        console.error('Update failed:', err);
        alert('Failed to update profile');
      }
    });
  }
}
