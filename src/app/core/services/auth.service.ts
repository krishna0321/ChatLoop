import { Injectable } from '@angular/core';

import {
  Auth,
  User,
  UserCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from '@angular/fire/auth';

import {
  Firestore,
  doc,
  setDoc,
  serverTimestamp,
  updateDoc,
} from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private auth: Auth, private firestore: Firestore) {}

  // ✅ current firebase user
  get currentUser(): User | null {
    return this.auth.currentUser;
  }

  // ✅ REGISTER (NO OTP)
  async register(
    email: string,
    password: string,
    phoneDigits10: string
  ): Promise<UserCredential> {
    const cleanEmail = (email || '').trim();
    const cleanPass = (password || '').trim();

    if (!cleanEmail || !cleanPass) {
      throw new Error('Email and password are required');
    }

    if (!phoneDigits10 || phoneDigits10.length !== 10) {
      throw new Error('Phone number must be 10 digits');
    }

    // 1) create firebase auth user
    const cred = await createUserWithEmailAndPassword(
      this.auth,
      cleanEmail,
      cleanPass
    );

    // 2) create user profile in Firestore
    await setDoc(
      doc(this.firestore, `users/${cred.user.uid}`),
      {
        uid: cred.user.uid,
        email: cleanEmail,
        phone: `+91${phoneDigits10}`,

        name: '',
        bio: '',
        photoURL: '',

        blocked: [],

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return cred;
  }

  // ✅ LOGIN
  async login(email: string, password: string): Promise<UserCredential> {
    const cleanEmail = (email || '').trim();
    const cleanPass = (password || '').trim();

    if (!cleanEmail || !cleanPass) {
      throw new Error('Email and password are required');
    }

    // update last login time after successful login
    const cred = await signInWithEmailAndPassword(this.auth, cleanEmail, cleanPass);

    try {
      await updateDoc(doc(this.firestore, `users/${cred.user.uid}`), {
        updatedAt: serverTimestamp(),
      });
    } catch {
      // if document missing / permission issue ignore
    }

    return cred;
  }

  // ✅ LOGOUT
  async logout() {
    return await signOut(this.auth);
  }

  // ✅ RESET PASSWORD (optional but useful)
  async resetPassword(email: string) {
    const cleanEmail = (email || '').trim();
    if (!cleanEmail) throw new Error('Please enter your email');

    return await sendPasswordResetEmail(this.auth, cleanEmail);
  }

  // ✅ Better Firebase error messages
  getErrorMessage(err: any): string {
    const code = err?.code || '';

    if (code.includes('auth/invalid-email')) return 'Invalid email address';
    if (code.includes('auth/user-not-found')) return 'No account found with this email';
    if (code.includes('auth/wrong-password')) return 'Wrong password';
    if (code.includes('auth/invalid-credential')) return 'Invalid login credentials';
    if (code.includes('auth/email-already-in-use')) return 'This email is already registered';
    if (code.includes('auth/weak-password')) return 'Password is too weak (min 6 characters)';
    if (code.includes('auth/too-many-requests')) return 'Too many attempts. Try again later.';
    if (code.includes('auth/network-request-failed')) return 'Network error. Check internet connection.';

    return err?.message || 'Something went wrong';
  }
}
