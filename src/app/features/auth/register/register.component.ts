import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';

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

  constructor(
    private auth: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  // ========================
  // ✅ HELPERS
  // ========================
  cleanPhone(v: string): string {
    return (v || '').replace(/\D/g, '').slice(-10);
  }

  // ========================
  // ✅ PASSWORD RULES (FOR HTML)
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
  // ✅ STRENGTH BAR
  // ========================
  get strength(): number {
    let s = 0;
    if (this.hasMinLength) s++;
    if (this.hasNumber) s++;
    if (this.hasUppercase) s++;
    if (this.hasLowercase) s++;
    return s; // 0..4
  }

  get strengthLabel(): string {
    switch (this.strength) {
      case 1:
        return 'Weak';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Strong';
      default:
        return '';
    }
  }

  // ========================
  // ✅ VALIDATION
  // ========================
  get formValid(): boolean {
    return (
      !!this.email.trim() &&
      this.cleanPhone(this.phone).length === 10 &&
      this.hasMinLength &&
      this.password === this.confirmPassword
    );
  }

  // ========================
  // ✅ REGISTER
  // ========================
  async register() {
    if (!this.formValid) {
      this.error = 'Please fill all fields correctly';
      return;
    }

    try {
      this.error = '';
      this.loading = true;

      const email = this.email.trim().toLowerCase();
      const phoneDigits10 = this.cleanPhone(this.phone);
      const pass = this.password.trim();

      // ✅ 1) check phone unique
      const taken = await this.userService.isPhoneTaken(phoneDigits10);
      if (taken) {
        this.error = '❌ Phone number already registered';
        return;
      }

      // ✅ 2) Create Firebase Auth user
      const cred = await this.auth.register(email, pass, phoneDigits10);
      const uid = cred?.user?.uid;

      if (!uid) throw new Error('Register failed');

      // ✅ 3) Reserve phone index (blocks duplicates)
      await this.userService.reservePhone(uid, phoneDigits10);

      // ✅ 4) Create user profile
      await this.userService.createUser({
        uid,
        name: email.split('@')[0],
        email,
        phone: phoneDigits10,
        bio: '',
        blocked: [],
      });

      // ✅ done
      this.router.navigate(['/app']);
    } catch (e: any) {
      this.error = this.auth.getErrorMessage(e);
    } finally {
      this.loading = false;
    }
  }
}
