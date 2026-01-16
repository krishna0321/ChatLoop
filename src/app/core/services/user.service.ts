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

export interface AppUser {
  uid: string;
  name: string;
  phone?: string;
  email?: string;

  bio?: string;
  blocked?: string[];

  createdAt?: any;
  updatedAt?: any;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private firestore: Firestore) {}

  // ✅ normalize phone (remove spaces + +91 etc)
  normalizePhone(phone: string): string {
    return (phone || '').replace(/\D/g, '').trim();
  }

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

  // ✅ CREATE USER
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

  // ✅ UPDATE USER
  async updateUser(uid: string, data: Partial<AppUser>) {
    if (!uid) return;

    // if updating phone -> normalize it
    const patch: any = { ...data };
    if (patch.phone) patch.phone = this.normalizePhone(patch.phone);

    const ref = doc(this.firestore, `users/${uid}`);
    return updateDoc(ref, {
      ...patch,
      updatedAt: serverTimestamp(),
    });
  }

  // ✅ DELETE USER
  async deleteUser(uid: string) {
    if (!uid) return;

    const ref = doc(this.firestore, `users/${uid}`);
    return deleteDoc(ref);
  }

  // ✅ BLOCK USER
  async blockUser(myUid: string, targetUid: string) {
    if (!myUid || !targetUid) return;
    if (myUid === targetUid) return;
    if (targetUid.trim().length < 5) return;

    const ref = doc(this.firestore, `users/${myUid}`);
    return updateDoc(ref, {
      blocked: arrayUnion(targetUid),
      updatedAt: serverTimestamp(),
    });
  }

  // ✅ UNBLOCK USER
  async unblockUser(myUid: string, targetUid: string) {
    if (!myUid || !targetUid) return;
    if (myUid === targetUid) return;

    const ref = doc(this.firestore, `users/${myUid}`);
    return updateDoc(ref, {
      blocked: arrayRemove(targetUid),
      updatedAt: serverTimestamp(),
    });
  }

  // ======================================================
  // ✅✅ PHONE UNIQUE SYSTEM (NEW)
  // phone_index/{phone} -> { uid, createdAt }
  // ======================================================

  // ✅ check phone already taken
  async isPhoneTaken(phone: string): Promise<boolean> {
    const clean = this.normalizePhone(phone);
    if (!clean) return false;

    const indexRef = doc(this.firestore, `phone_index/${clean}`);
    const snap = await getDoc(indexRef);

    return snap.exists();
  }

  // ✅ reserve phone number before creating user profile
  async reservePhone(uid: string, phone: string) {
    const clean = this.normalizePhone(phone);
    if (!uid) throw new Error('Missing uid');
    if (!clean) throw new Error('Phone number required');

    const indexRef = doc(this.firestore, `phone_index/${clean}`);
    const snap = await getDoc(indexRef);

    // ✅ already exists
    if (snap.exists()) {
      throw new Error('Phone number already registered');
    }

    // ✅ create index document
    await setDoc(indexRef, {
      uid,
      phone: clean,
      createdAt: serverTimestamp(),
    });
  }
}
