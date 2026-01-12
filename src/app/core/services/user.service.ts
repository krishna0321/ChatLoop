import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface AppUser {
  uid: string;
  name: string;
  phone?: string;
  email?: string;

  // optional meta
  createdAt?: any;
  updatedAt?: any;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private firestore: Firestore) {}

  // ✅ READ ALL USERS
  getUsers(): Observable<AppUser[]> {
    const ref = collection(this.firestore, 'users');
    return collectionData(ref, { idField: 'uid' }) as Observable<AppUser[]>;
  }

  // ✅ READ SINGLE USER
  getUser(uid: string): Observable<AppUser> {
    const ref = doc(this.firestore, `users/${uid}`);
    return docData(ref, { idField: 'uid' }) as Observable<AppUser>;
  }

  // ✅ CREATE USER (if you want admin to create new user manually)
  async createUser(user: AppUser) {
    const ref = doc(this.firestore, `users/${user.uid}`);
    return setDoc(ref, {
      ...user,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  // ✅ UPDATE USER
  async updateUser(uid: string, data: Partial<AppUser>) {
    const ref = doc(this.firestore, `users/${uid}`);
    return updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  // ✅ DELETE USER
  async deleteUser(uid: string) {
    const ref = doc(this.firestore, `users/${uid}`);
    return deleteDoc(ref);
  }
}
