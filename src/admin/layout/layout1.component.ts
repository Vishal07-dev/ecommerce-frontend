import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet,RouterLink,RouterLinkActive],
  templateUrl: './layout1.component.html',
  styleUrl: './layout1.component.css'
})
export class LayoutComponent1 {
isSidebarOpen = signal(true);
auth = inject(AuthService)
}
