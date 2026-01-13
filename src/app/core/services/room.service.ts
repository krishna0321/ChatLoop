import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  collectionData,
  serverTimestamp,
  deleteField,
  increment,
  setDoc,
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable } from 'rxjs';

export type RoomType = 'dm' | 'group' | 'channel';

export interface Room {
  id?: string;
  type: RoomType;

  name?: string;
  description?: string;
  photoURL?: string;

  ownerId: string;
  admins: string[];
  members: string[];

  createdAt?: any;
  updatedAt?: any;

  lastMessage?: string;
  lastSenderId?: string;
  lastMessageAt?: any;

  unread?: Record<string, number>;
  muted?: Record<string, boolean>;
  pinned?: Record<string, boolean>;
}

@Injectable({ providedIn: 'root' })
export class RoomService {
  constructor(private firestore: Firestore, private auth: Auth) {}

  getDmRoomId(uid1: string, uid2: string) {
    return [uid1, uid2].sort().join('_');
  }

  async ensureDmRoom(uid1: string, uid2: string) {
    const roomId = this.getDmRoomId(uid1, uid2);
    const roomDoc = doc(this.firestore, `rooms/${roomId}`);
    const snap = await getDoc(roomDoc);

    if (!snap.exists()) {
      await setDoc(roomDoc, {
        type: 'dm',
        name: '',
        description: '',
        photoURL: '',

        ownerId: uid1,
        admins: [uid1],
        members: [uid1, uid2],

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),

        lastMessage: '',
        lastSenderId: '',
        lastMessageAt: serverTimestamp(),

        unread: { [uid1]: 0, [uid2]: 0 },
        muted: {},
        pinned: {},
      });
    }

    return roomId;
  }

  async createRoom(data: Partial<Room>) {
    const myUid = this.auth.currentUser?.uid;
    if (!myUid) throw new Error('Not logged in');

    const roomsRef = collection(this.firestore, 'rooms');
    const members = Array.from(new Set([myUid, ...(data.members || [])]));

    const payload: Room = {
      type: data.type || 'group',
      name: data.name || (data.type === 'channel' ? 'New Channel' : 'New Group'),
      description: data.description || '',
      photoURL: data.photoURL || '',

      ownerId: myUid,
      admins: [myUid],
      members,

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),

      lastMessage: '',
      lastSenderId: '',
      lastMessageAt: serverTimestamp(),

      unread: members.reduce((acc: any, uid: string) => {
        acc[uid] = 0;
        return acc;
      }, {}),

      muted: {},
      pinned: {},
    };

    const res = await addDoc(roomsRef, payload);
    return res.id;
  }

  myRooms$(): Observable<Room[]> {
    const uid = this.auth.currentUser?.uid;
    if (!uid) return new Observable((sub) => sub.next([]));

    const roomsRef = collection(this.firestore, 'rooms');
    const q1 = query(
      roomsRef,
      where('members', 'array-contains', uid),
      orderBy('updatedAt', 'desc')
    );

    return collectionData(q1, { idField: 'id' }) as Observable<Room[]>;
  }

  async markAsRead(roomId: string, myUid: string) {
    const roomDoc = doc(this.firestore, `rooms/${roomId}`);
    await updateDoc(roomDoc, {
      [`unread.${myUid}`]: 0,
    });
  }

  async muteRoom(roomId: string, myUid: string, mute: boolean) {
    const roomDoc = doc(this.firestore, `rooms/${roomId}`);
    if (mute) {
      await updateDoc(roomDoc, { [`muted.${myUid}`]: true });
    } else {
      await updateDoc(roomDoc, { [`muted.${myUid}`]: deleteField() });
    }
  }

  async pinRoom(roomId: string, myUid: string, pin: boolean) {
    const roomDoc = doc(this.firestore, `rooms/${roomId}`);
    if (pin) {
      await updateDoc(roomDoc, { [`pinned.${myUid}`]: true });
    } else {
      await updateDoc(roomDoc, { [`pinned.${myUid}`]: deleteField() });
    }
  }
}
