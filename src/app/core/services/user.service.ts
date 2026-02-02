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
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  getDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

/* ===============================
   USER MODEL
================================ */

export interface AppUser {
  uid: string;
  name: string;
  phone?: string;
  email?: string;

  bio?: string;
  blocked?: string[];
  photoURL?: string;
  online?: boolean;
  lastSeen?: any;

  createdAt?: any;
  updatedAt?: any;
}

@Injectable({ providedIn: 'root' })
export class UserService {

  constructor(private firestore: Firestore) {}

  /* ===============================
     HELPERS
  ================================ */

  // normalize phone number
  normalizePhone(phone: string): string {
    return (phone || '').replace(/\D/g, '').trim();
  }

  /* ===============================
     READ USERS
  ================================ */

  // 🔥 ALL USERS (list / search)
  getUsers(): Observable<AppUser[]> {
    const ref = collection(this.firestore, 'users');
    return collectionData(ref, { idField: 'uid' }) as Observable<AppUser[]>;
  }

  // 🔥 CURRENT USER (or any user realtime)
  getUser(uid: string): Observable<AppUser> {
    const ref = doc(this.firestore, `users/${uid}`);
    return docData(ref, { idField: 'uid' }) as Observable<AppUser>;
  }

  // 🔥 OTHER USER PROFILE (CHAT DRAWER FIX)
  getUserById(uid: string): Observable<AppUser> {
    const ref = doc(this.firestore, `users/${uid}`);
    return docData(ref, { idField: 'uid' }) as Observable<AppUser>;
  }

  /* ===============================
     CREATE / UPDATE
  ================================ */

  // create user profile
  async createUser(user: AppUser) {
    if (!user?.uid) return;

    const ref = doc(this.firestore, `users/${user.uid}`);

    return setDoc(
      ref,
      {
        ...user,
        phone: user.phone ? this.normalizePhone(user.phone) : '',
        blocked: user.blocked ?? [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  // update profile
  async updateUser(uid: string, data: Partial<AppUser>) {
    if (!uid) return;

    const patch: any = { ...data };
    if (patch.phone) patch.phone = this.normalizePhone(patch.phone);

    const ref = doc(this.firestore, `users/${uid}`);

    return updateDoc(ref, {
      ...patch,
      updatedAt: serverTimestamp(),
    });
  }

  // delete account
  async deleteUser(uid: string) {
    if (!uid) return;

    const ref = doc(this.firestore, `users/${uid}`);
    return deleteDoc(ref);
  }

  /* ===============================
     BLOCK SYSTEM
  ================================ */

  async blockUser(myUid: string, targetUid: string) {
    if (!myUid || !targetUid || myUid === targetUid) return;

    const ref = doc(this.firestore, `users/${myUid}`);
    return updateDoc(ref, {
      blocked: arrayUnion(targetUid),
      updatedAt: serverTimestamp(),
    });
  }

  async unblockUser(myUid: string, targetUid: string) {
    if (!myUid || !targetUid || myUid === targetUid) return;

    const ref = doc(this.firestore, `users/${myUid}`);
    return updateDoc(ref, {
      blocked: arrayRemove(targetUid),
      updatedAt: serverTimestamp(),
    });
  }

  /* ===============================
     PHONE UNIQUE SYSTEM
  ================================ */

  // 🔎 check if phone already exists
  async isPhoneTaken(phone: string): Promise<boolean> {
    const clean = this.normalizePhone(phone);
    if (!clean) return false;

    const indexRef = doc(this.firestore, `phone_index/${clean}`);
    const snap = await getDoc(indexRef);

    return snap.exists();
  }

  // 🔐 reserve phone number
  async reservePhone(uid: string, phone: string) {
    const clean = this.normalizePhone(phone);

    if (!uid) throw new Error('Missing uid');
    if (!clean) throw new Error('Phone number required');

    const indexRef = doc(this.firestore, `phone_index/${clean}`);
    const snap = await getDoc(indexRef);

    if (snap.exists()) {
      throw new Error('Phone number already registered');
    }

    await setDoc(indexRef, {
      uid,
      phone: clean,
      createdAt: serverTimestamp(),
    });
  }
}
