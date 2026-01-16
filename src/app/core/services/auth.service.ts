import { Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  UserCredential,
} from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private auth: Auth) {}

  // ✅ LOGIN
  async login(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  // ✅ REGISTER (FINAL FIX ✅ phoneDigits10 OPTIONAL)
  async register(
    email: string,
    password: string,
    phoneDigits10: string = '' // ✅ important fix
  ): Promise<UserCredential> {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();
    const cleanPhone = (phoneDigits10 || '').replace(/\D/g, '').slice(-10);

    if (!cleanEmail || !cleanPass) {
      throw new Error('Email and password required');
    }

    if (cleanPass.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // ✅ phone is optional
    if (cleanPhone && cleanPhone.length !== 10) {
      throw new Error('Phone number must be 10 digits');
    }

    // ✅ Create firebase auth account
    const cred = await createUserWithEmailAndPassword(this.auth, cleanEmail, cleanPass);

    // ✅ return credential (phone handled in register.component.ts)
    return cred;
  }

  // ✅ LOGOUT
  async logout() {
    return signOut(this.auth);
  }

  // ✅ OPTIONAL: Error message helper
  getErrorMessage(err: any): string {
    const code = err?.code || '';

    if (code.includes('auth/email-already-in-use')) return 'Email already registered';
    if (code.includes('auth/invalid-email')) return 'Invalid email';
    if (code.includes('auth/wrong-password')) return 'Wrong password';
    if (code.includes('auth/user-not-found')) return 'Account not found';
    if (code.includes('auth/weak-password')) return 'Weak password (min 6 chars)';

    return err?.message || 'Something went wrong';
  }
}
