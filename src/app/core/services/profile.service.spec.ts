import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, docData, updateDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface ProfileUser {
  uid: string;
  name: string;
  phone?: string;
  email?: string;
  createdAt?: any;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  constructor(private auth: Auth, private firestore: Firestore) {}

  getMyProfile(): Observable<ProfileUser | undefined> {
    const uid = this.auth.currentUser?.uid;
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
