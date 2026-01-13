import { Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  UserCredential
} from '@angular/fire/auth';

import {
  Firestore,
  doc,
  setDoc,
  serverTimestamp
} from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private auth: Auth, private firestore: Firestore) {}

  // ✅ REGISTER (NO OTP)
  async register(email: string, password: string, phoneDigits10: string): Promise<UserCredential> {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);

    await setDoc(
      doc(this.firestore, `users/${cred.user.uid}`),
      {
        uid: cred.user.uid,
        email,
        phone: `+91${phoneDigits10}`, // store phone
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    return cred;
  }

  // ✅ LOGIN
  async login(email: string, password: string): Promise<UserCredential> {
    return await signInWithEmailAndPassword(this.auth, email, password);
  }

  // ✅ LOGOUT
  logout() {
    return signOut(this.auth);
  }
}
