import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  email = '';
  phone = '';
  password = '';
  confirmPassword = '';

  loading = false;
  error = '';
  success = '';

  // ✅ field touch tracking (to show errors only after typing)
  touched = {
    email: false,
    phone: false,
    password: false,
    confirmPassword: false
  };

  constructor(private authService: AuthService, private router: Router) {}

  private cleanPhone(p: string) {
    return (p || '').replace(/\D/g, '');
  }

  // ✅ validations
  get emailError(): string {
    const value = this.email.trim();
    if (!this.touched.email) return '';
    if (!value) return 'Email is required';
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    return ok ? '' : 'Enter a valid email address';
  }

  get phoneError(): string {
    const value = this.cleanPhone(this.phone);
    if (!this.touched.phone) return '';
    if (!value) return 'Phone number is required';
    if (value.length !== 10) return 'Phone must be 10 digits';
    return '';
  }

  get passwordError(): string {
    if (!this.touched.password) return '';
    if (!this.password) return 'Password is required';
    if (this.password.length < 6) return 'Password must be at least 6 characters';
    return '';
  }

  get confirmPasswordError(): string {
    if (!this.touched.confirmPassword) return '';
    if (!this.confirmPassword) return 'Confirm password is required';
    if (this.password !== this.confirmPassword) return 'Passwords do not match';
    return '';
  }

  // ✅ overall form validity
  get formValid(): boolean {
    const phoneDigits = this.cleanPhone(this.phone);

    return (
      this.email.trim().length > 0 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim()) &&
      phoneDigits.length === 10 &&
      this.password.length >= 6 &&
      this.password === this.confirmPassword
    );
  }

  async register() {
    try {
      this.error = '';
      this.success = '';

      // ✅ mark all as touched
      this.touched.email = true;
      this.touched.phone = true;
      this.touched.password = true;
      this.touched.confirmPassword = true;

      if (!this.formValid) {
        this.error = 'Please fix errors before submitting ❌';
        return;
      }

      this.loading = true;

      const phoneDigits = this.cleanPhone(this.phone);

      await this.authService.register(
        this.email.trim(),
        this.password,
        phoneDigits
      );

      this.success = 'Account created ✅';
      this.router.navigate(['/app']);
    } catch (err: any) {
      this.error = err?.message || 'Register failed';
    } finally {
      this.loading = false;
    }
  }
}
