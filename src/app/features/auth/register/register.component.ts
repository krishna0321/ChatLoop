import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; // ✅ add RouterModule
import { AuthService } from '../../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterModule],   // ✅ add RouterModule
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  email: string = '';
  phone: string = '';
  password: string = '';
  confirmPassword: string = '';
  error: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  register(): void {
    if (!this.email || !this.phone || !this.password) {
      this.error = 'Email, phone and password are required';
      return;
    }

    if (this.password.length < 6) {
      this.error = 'Password must be at least 6 characters';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    this.authService.register(this.email, this.password, this.phone)
      .then(() => this.router.navigate(['/app']))
      .catch((err: Error) => this.error = err.message);
  }
}
