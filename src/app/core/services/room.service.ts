import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  Firestore,
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from '@angular/fire/firestore';

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

export interface RoomMessage {
  id?: string;
  text: string;
  senderId: string;
  createdAt?: any;
}

@Injectable({ providedIn: 'root' })
export class RoomService {
  constructor(private firestore: Firestore, private auth: Auth) {}

  // ==========================
  // ✅ DM room id
  // ==========================
  getDmRoomId(uid1: string, uid2: string) {
    return [uid1, uid2].sort().join('_');
  }

  // ✅ Ensure DM room exists
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

  // ==========================
  // ✅ CREATE GROUP / CHANNEL
  // ==========================
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

  // ======================================================
  // ✅ LISTEN ONE ROOM DOC
  // ======================================================
  listenRoom(roomId: string, cb: (room: Room | null) => void) {
    const ref = doc(this.firestore, `rooms/${roomId}`);

    return onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) return cb(null);
        cb({ id: snap.id, ...(snap.data() as any) });
      },
      (err) => {
        console.error('🔥 listenRoom error:', err);
        cb(null);
      }
    );
  }

  // ======================================================
  // ✅ LISTEN ROOM MESSAGES
  // ======================================================
  listenRoomMessages(roomId: string, cb: (msgs: RoomMessage[]) => void) {
    const refCol = collection(this.firestore, `rooms/${roomId}/messages`);
    const qSorted = query(refCol, orderBy('createdAt', 'asc'));

    return onSnapshot(
      qSorted,
      (snap) => {
        const msgs = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        })) as RoomMessage[];
        cb(msgs);
      },
      (err) => {
        console.error('🔥 listenRoomMessages error:', err);
        cb([]);
      }
    );
  }

  // ======================================================
  // ✅ SEND ROOM MESSAGE (Group / Channel chat send)
  // ======================================================
  async sendRoomMessage(roomId: string, data: { text: string; senderId: string }) {
    const txt = (data?.text || '').trim();
    if (!txt) return;

    const msgRef = collection(this.firestore, `rooms/${roomId}/messages`);

    await addDoc(msgRef, {
      text: txt,
      senderId: data.senderId,
      createdAt: serverTimestamp(),
    });

    // ✅ Telegram preview meta update + unread
    await this.updateRoomMeta(roomId, data.senderId, txt);
  }

  // ======================================================
  // ✅ ADD MEMBERS
  // ======================================================
  async addMembers(roomId: string, memberUids: string[]) {
    const roomDoc = doc(this.firestore, `rooms/${roomId}`);
    const snap = await getDoc(roomDoc);
    if (!snap.exists()) throw new Error('Room not found');

    const room = snap.data() as any;
    const currentMembers: string[] = room?.members || [];

    const addList = (memberUids || [])
      .filter(Boolean)
      .filter((uid) => !currentMembers.includes(uid));

    if (addList.length === 0) return;

    const unreadPatch: any = {};
    addList.forEach((uid) => {
      unreadPatch[`unread.${uid}`] = 0;
    });

    await updateDoc(roomDoc, {
      members: arrayUnion(...addList),
      updatedAt: serverTimestamp(),
      ...unreadPatch,
    });
  }

  // ======================================================
  // ✅ LEAVE ROOM
  // ======================================================
  async leaveRoom(roomId: string, uid: string) {
    if (!roomId || !uid) return;

    const roomDoc = doc(this.firestore, `rooms/${roomId}`);

    await updateDoc(roomDoc, {
      members: arrayRemove(uid),
      admins: arrayRemove(uid),

      [`unread.${uid}`]: deleteField(),
      [`muted.${uid}`]: deleteField(),
      [`pinned.${uid}`]: deleteField(),

      updatedAt: serverTimestamp(),
    });
  }

  // ======================================================
  // ✅ DELETE ROOM
  // ======================================================
  async deleteRoom(roomId: string) {
    const roomDoc = doc(this.firestore, `rooms/${roomId}`);
    await deleteDoc(roomDoc);
  }

  // ======================================================
  // ✅ LISTEN MY ROOMS (telegram list sidebar)
  // ======================================================
  listenMyRooms(myUid: string, callback: (rooms: Room[]) => void) {
    const roomsRef = collection(this.firestore, 'rooms');

    const qSorted = query(
      roomsRef,
      where('members', 'array-contains', myUid),
      orderBy('updatedAt', 'desc')
    );

    const qFallback = query(roomsRef, where('members', 'array-contains', myUid));

    const unsubSorted = onSnapshot(
      qSorted,
      (snap) => {
        const rooms = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Room[];
        callback(rooms);
      },
      (err: any) => {
        console.error('🔥 listenMyRooms() sorted query failed:', err);
        console.warn('⚠️ Falling back (no orderBy)...');

        const unsubFallback = onSnapshot(
          qFallback,
          (snap2) => {
            let rooms = snap2.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Room[];

            rooms = rooms.sort((a: any, b: any) => {
              const at = this.getTimeValue(a.updatedAt);
              const bt = this.getTimeValue(b.updatedAt);
              return bt - at;
            });

            callback(rooms);
          },
          (err2: any) => {
            console.error('🔥 listenMyRooms() fallback failed:', err2);
            callback([]);
          }
        );

        return () => unsubFallback();
      }
    );

    return unsubSorted;
  }

  myRooms$(): Observable<Room[]> {
    const uid = this.auth.currentUser?.uid;
    if (!uid) return new Observable((sub) => sub.next([]));

    return new Observable((sub) => {
      const unsub = this.listenMyRooms(uid, (rooms: Room[]) => sub.next(rooms));
      return () => unsub?.();
    }) as any;
  }

  // ======================================================
  // ✅ Update room meta: last message + unread
  // ======================================================
  async updateRoomMeta(roomId: string, senderId: string, text: string) {
    const roomDoc = doc(this.firestore, `rooms/${roomId}`);
    const snap = await getDoc(roomDoc);
    if (!snap.exists()) return;

    const room = snap.data() as any;
    const members: string[] = room?.members || [];

    const unreadUpdate: any = {};
    members.forEach((uid) => {
      if (uid === senderId) unreadUpdate[`unread.${uid}`] = 0;
      else unreadUpdate[`unread.${uid}`] = (room?.unread?.[uid] || 0) + 1;
    });

    await updateDoc(roomDoc, {
      lastMessage: text,
      lastSenderId: senderId,
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...unreadUpdate,
    });
  }

  // ======================================================
  // ✅ mark read
  // ======================================================
  async markAsRead(roomId: string, myUid: string) {
    const roomDoc = doc(this.firestore, `rooms/${roomId}`);
    await updateDoc(roomDoc, {
      [`unread.${myUid}`]: 0,
    });
  }

  async muteRoom(roomId: string, myUid: string, mute: boolean) {
    const roomDoc = doc(this.firestore, `rooms/${roomId}`);
    if (mute) await updateDoc(roomDoc, { [`muted.${myUid}`]: true });
    else await updateDoc(roomDoc, { [`muted.${myUid}`]: deleteField() });
  }

  async pinRoom(roomId: string, myUid: string, pin: boolean) {
    const roomDoc = doc(this.firestore, `rooms/${roomId}`);
    if (pin) await updateDoc(roomDoc, { [`pinned.${myUid}`]: true });
    else await updateDoc(roomDoc, { [`pinned.${myUid}`]: deleteField() });
  }

  // ==========================
  // ✅ helper
  // ==========================
  private getTimeValue(ts: any): number {
    try {
      if (!ts) return 0;
      const d = ts?.toDate ? ts.toDate() : new Date(ts);
      return d.getTime();
    } catch {
      return 0;
    }
  }
}
