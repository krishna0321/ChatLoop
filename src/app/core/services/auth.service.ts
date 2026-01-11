import { Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  UserCredential,
} from '@angular/fire/auth';

import { Firestore, doc, setDoc, serverTimestamp } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private auth: Auth, private firestore: Firestore) {}

  // ✅ Register + Save phone in Firestore
  async register(email: string, password: string, phone: string): Promise<UserCredential> {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);

    await this.saveUserToFirestore(cred.user.uid, email, phone);

    return cred;
  }

  // ✅ Login + ensure user exists in Firestore
  async login(email: string, password: string): Promise<UserCredential> {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);

    // phone unknown in login, so don't overwrite it
    await this.saveUserToFirestore(cred.user.uid, email);

    return cred;
  }

  logout() {
    return signOut(this.auth);
  }

  // ✅ Creates/updates user document in Firestore
  private async saveUserToFirestore(uid: string, email: string, phone?: string) {
    const ref = doc(this.firestore, `users/${uid}`);

    return setDoc(
      ref,
      {
        uid,
        email,
        name: email.split('@')[0], // username
        phone: phone ?? '',         // ✅ phone added
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}
