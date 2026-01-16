import { Injectable } from '@angular/core';
import { Auth, signOut } from '@angular/fire/auth';
import {
  Firestore,
  doc,
  docData,
  updateDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL,
} from '@angular/fire/storage';
import { Observable, of } from 'rxjs';

export interface ProfileUser {
  uid: string;
  name: string;
  phone?: string;
  email?: string;

  username?: string;
  bio?: string;
  status?: string;

  theme?: string;
  photoURL?: string;

  createdAt?: any;
  updatedAt?: any;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private storage: Storage
  ) {}

  // ✅ get logged in user profile
  getMyProfile(): Observable<ProfileUser | null> {
    const uid = this.auth.currentUser?.uid;
    if (!uid) return of(null);

    const refDoc = doc(this.firestore, `users/${uid}`);
    return docData(refDoc, { idField: 'uid' }) as Observable<ProfileUser>;
  }

  // ✅ update profile
  async updateMyProfile(data: Partial<ProfileUser>) {
    const uid = this.auth.currentUser?.uid;
    if (!uid) throw new Error('Not logged in');

    const refDoc = doc(this.firestore, `users/${uid}`);
    return updateDoc(refDoc, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  // ✅ upload avatar
  async updateAvatar(file: File) {
    const uid = this.auth.currentUser?.uid;
    if (!uid) throw new Error('Not logged in');
    if (!file) throw new Error('No file');

    const safeName = file.name.replace(/[^\w.\-]+/g, '_');
    const path = `avatars/${uid}/${Date.now()}_${safeName}`;

    const fileRef = ref(this.storage, path);
    await uploadBytes(fileRef, file);

    const url = await getDownloadURL(fileRef);

    const refDoc = doc(this.firestore, `users/${uid}`);
    await updateDoc(refDoc, {
      photoURL: url,
      updatedAt: serverTimestamp(),
    });

    return url;
  }

  // ✅ logout
  async logout() {
    await signOut(this.auth);
  }
}
