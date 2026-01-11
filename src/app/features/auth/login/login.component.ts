import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  error: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  login(): void {
  if (!this.email || !this.password) {
    this.error = 'Email and password are required';
    return;
  }

  this.authService
    .login(this.email, this.password)
    .then(() => {
      // ✅ REDIRECT AFTER LOGIN
      this.router.navigate(['/app']);
    })
    .catch((err: Error) => {
      this.error = err.message;
    });
}
}