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
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface AppUser {
  uid: string;
  name: string;
  phone?: string;
  email?: string;

  bio?: string;   // ✅ ADD THIS

  blocked?: string[];

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

  // ✅ CREATE USER
  async createUser(user: AppUser) {
    if (!user?.uid) return;

    const ref = doc(this.firestore, `users/${user.uid}`);
    return setDoc(
      ref,
      {
        ...user,
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

    const ref = doc(this.firestore, `users/${uid}`);
    return updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  // ✅ DELETE USER
  async deleteUser(uid: string) {
    if (!uid) return;

    const ref = doc(this.firestore, `users/${uid}`);
    return deleteDoc(ref);
  }

  // ✅ BLOCK USER (BLOCK ONLY THAT ACCOUNT UID)
  async blockUser(myUid: string, targetUid: string) {
    // ✅ validation (important fix)
    if (!myUid || !targetUid) return;
    if (myUid === targetUid) return; // cannot block yourself
    if (targetUid.trim().length < 5) return; // safety

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
}
