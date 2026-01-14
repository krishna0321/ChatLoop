import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  email = '';
  password = '';

  error = '';
  loading = false;

  showPassword = false;
  remember = true;

  constructor(private authService: AuthService, private router: Router) {}

  private validate(): boolean {
    this.error = '';
    const e = this.email.trim();
    const p = this.password.trim();

    if (!e || !p) {
      this.error = 'Please enter email and password';
      return false;
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
    if (!emailOk) {
      this.error = 'Please enter a valid email address';
      return false;
    }

    if (p.length < 6) {
      this.error = 'Password must be at least 6 characters';
      return false;
    }

    return true;
  }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }

  async login() {
    if (!this.validate()) return;

    this.loading = true;
    this.error = '';

    try {
      await this.authService.login(this.email.trim(), this.password.trim());
      this.router.navigate(['/app']);
    } catch (err: any) {
      this.error =
        (this.authService as any)?.getErrorMessage?.(err) ||
        err?.message ||
        'Login failed';
    } finally {
      this.loading = false;
    }
  }

  forgotPassword() {
    alert('Forgot password feature coming soon ✅');
  }

  loginGoogle() {
    alert('Google login feature coming soon ✅');
  }

  loginGithub() {
    alert('Github login feature coming soon ✅');
  }
}
