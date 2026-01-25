import { Injectable } from '@angular/core';
import {
  Firestore,
  doc,
  docData,
  setDoc,
  updateDoc,
  getDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface UserSettings {
  uid: string;

  // profile
  name: string;
  bio: string;
  phone: string;

  // appearance
  darkMode: boolean;
  themeColor: string; // ✅ NEW

  // notifications
  notifyMessages: boolean;
  notifySound: boolean;

  // privacy
  showOnlineStatus: boolean;
  allowFriendRequests: boolean;

  // meta
  createdAt?: any;
  updatedAt?: any;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly col = 'settings';

  constructor(private firestore: Firestore) {}

  private ref(uid: string) {
    return doc(this.firestore, `${this.col}/${uid}`);
  }

  private defaultSettings(uid: string, email: string): UserSettings {
    return {
      uid,

      name: email?.split('@')?.[0] || 'User',
      bio: '',
      phone: '',

      darkMode: true,
      themeColor: '#3b82f6', // ✅ NEW

      notifyMessages: true,
      notifySound: true,

      showOnlineStatus: true,
      allowFriendRequests: true,

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
  }

  async createDefaultIfMissing(uid: string, email: string) {
    const ref = this.ref(uid);
    const snap = await getDoc(ref);
    if (snap.exists()) return;

    const data = this.defaultSettings(uid, email);
    await setDoc(ref, data, { merge: true });
  }

  getSettings(uid: string): Observable<Partial<UserSettings>> {
    return docData(this.ref(uid)) as Observable<Partial<UserSettings>>;
  }

  async saveSettings(uid: string, settings: UserSettings) {
    const ref = this.ref(uid);

    const payload: Partial<UserSettings> = {
      name: (settings.name || '').trim(),
      bio: (settings.bio || '').trim(),
      phone: (settings.phone || '').trim(),

      darkMode: !!settings.darkMode,
      themeColor: settings.themeColor || '#3b82f6', // ✅ NEW

      notifyMessages: !!settings.notifyMessages,
      notifySound: !!settings.notifySound,

      showOnlineStatus: !!settings.showOnlineStatus,
      allowFriendRequests: !!settings.allowFriendRequests,

      updatedAt: serverTimestamp(),
    };

    await updateDoc(ref, payload);
  }
}
