import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, docData, updateDoc } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';

export interface ProfileUser {
  theme: string;
  status: string;
  bio: string;
  username: string;
  uid: string;
  name: string;
  phone?: string;
  email?: string;
  createdAt?: any;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  updateAvatar(file: any) {
    throw new Error('Method not implemented.');
  }
  logout() {
    throw new Error('Method not implemented.');
  }
  constructor(private auth: Auth, private firestore: Firestore) {}

  // ✅ IMPORTANT: Must RETURN observable (not void)
  getMyProfile(): Observable<ProfileUser | null> {
    const uid = this.auth.currentUser?.uid;
    if (!uid) return of(null);

    const ref = doc(this.firestore, `users/${uid}`);
    return docData(ref) as Observable<ProfileUser>;
  }

  async updateMyProfile(data: { name: string; phone: string }) {
    const uid = this.auth.currentUser?.uid;
    if (!uid) throw new Error('Not logged in');

    const ref = doc(this.firestore, `users/${uid}`);
    return updateDoc(ref, {
      name: data.name,
      phone: data.phone,
    });
  }
}
