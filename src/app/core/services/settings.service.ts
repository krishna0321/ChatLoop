import { Injectable } from '@angular/core';
import {
  Firestore,
  doc,
  docData,
  setDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface UserSettings {
  uid: string;

  // Profile
  name: string;
  bio: string;
  phone: string;

  // Appearance
  darkMode: boolean;

  // Notifications
  notifyMessages: boolean;
  notifySound: boolean;

  // Privacy
  showOnlineStatus: boolean;
  allowFriendRequests: boolean;

  createdAt?: any;
  updatedAt?: any;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  constructor(private firestore: Firestore) {}

  getSettings(uid: string): Observable<UserSettings> {
    const ref = doc(this.firestore, `user_settings/${uid}`);
    return docData(ref) as Observable<UserSettings>;
  }

  async createDefaultIfMissing(uid: string, email?: string | null) {
    const ref = doc(this.firestore, `user_settings/${uid}`);

    const defaultSettings: UserSettings = {
      uid,

      name: email ? email.split('@')[0] : 'User',
      bio: '',
      phone: '',

      darkMode: true,

      notifyMessages: true,
      notifySound: true,

      showOnlineStatus: true,
      allowFriendRequests: true,

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // ✅ merge true means: if document exists, don't delete old fields
    await setDoc(ref, defaultSettings, { merge: true });
  }

  async saveSettings(uid: string, payload: Partial<UserSettings>) {
    const ref = doc(this.firestore, `user_settings/${uid}`);

    await setDoc(
      ref,
      {
        ...payload,
        uid,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}
