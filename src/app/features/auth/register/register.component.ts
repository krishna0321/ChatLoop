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
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  email = '';
  phone = '';
  password = '';
  confirmPassword = '';

  loading = false;
  error = '';

  showPass = false;
  showConfirm = false;

  constructor(private auth: AuthService, private router: Router) {}

  // ========================
  // HELPERS
  // ========================
  cleanPhone(v: string): string {
    return (v || '').replace(/\D/g, '');
  }

  // ========================
  // PASSWORD RULES (SAFE)
  // ========================
  get hasMinLength(): boolean {
    return (this.password || '').length >= 6;
  }

  get hasNumber(): boolean {
    return /\d/.test(this.password || '');
  }

  get hasUppercase(): boolean {
    return /[A-Z]/.test(this.password || '');
  }

  get hasLowercase(): boolean {
    return /[a-z]/.test(this.password || '');
  }

  // ========================
  // STRENGTH
  // ========================
  get strength(): number {
    let s = 0;
    if (this.hasMinLength) s++;
    if (this.hasNumber) s++;
    if (this.hasUppercase) s++;
    if (this.hasLowercase) s++;
    return s;
  }

  get strengthLabel(): string {
    switch (this.strength) {
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return '';
    }
  }

  // ========================
  // FORM VALIDATION
  // ========================
  get formValid(): boolean {
    return (
      !!this.email &&
      this.cleanPhone(this.phone).length === 10 &&
      this.password.length >= 6 &&
      this.password === this.confirmPassword
    );
  }

  // ========================
  // REGISTER
  // ========================
  async register() {
    try {
      this.error = '';
      this.loading = true;

      await this.auth.register(
        this.email.trim(),
        this.password,
        this.cleanPhone(this.phone)
      );

      this.router.navigate(['/app']);
    } catch (e: any) {
      this.error = e?.message || 'Registration failed';
    } finally {
      this.loading = false;
    }
  }
}
