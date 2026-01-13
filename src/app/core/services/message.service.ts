import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  collectionData,
  serverTimestamp,
  deleteDoc,
  getDoc,
  increment,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface RoomMessage {
  id?: string;
  text: string;
  senderId: string;
  createdAt?: any;

  editedAt?: any;
  isDeleted?: boolean;
  deletedAt?: any;
}

@Injectable({ providedIn: 'root' })
export class MessageService {
  constructor(private firestore: Firestore) {}

  getRoomMessages(roomId: string): Observable<RoomMessage[]> {
    const ref = collection(this.firestore, `rooms/${roomId}/messages`);
    const q = query(ref, orderBy('createdAt', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<RoomMessage[]>;
  }

  async sendRoomMessage(roomId: string, senderId: string, text: string) {
    const value = text.trim();
    if (!value) return;

    // ✅ check channel rule
    const roomDoc = doc(this.firestore, `rooms/${roomId}`);
    const roomSnap = await getDoc(roomDoc);
    if (!roomSnap.exists()) throw new Error('Room not found');

    const room: any = roomSnap.data();
    if (room?.type === 'channel') {
      const admins: string[] = room?.admins || [];
      if (!admins.includes(senderId)) {
        throw new Error('Only admins can send messages in channel');
      }
    }

    // ✅ add msg
    const msgRef = collection(this.firestore, `rooms/${roomId}/messages`);
    await addDoc(msgRef, {
      text: value,
      senderId,
      createdAt: serverTimestamp(),
      isDeleted: false,
      deletedAt: null,
      editedAt: null,
    });

    // ✅ update preview + unread for other members
    const members: string[] = room?.members || [];
    const unreadPatch: any = {};
    members.forEach((uid) => {
      if (uid !== senderId) unreadPatch[`unread.${uid}`] = increment(1);
    });

    await updateDoc(roomDoc, {
      lastMessage: value,
      lastSenderId: senderId,
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...unreadPatch,
    });
  }

  async editRoomMessage(roomId: string, messageId: string, newText: string) {
    const value = newText.trim();
    if (!value) return;

    const ref = doc(this.firestore, `rooms/${roomId}/messages/${messageId}`);
    return updateDoc(ref, {
      text: value,
      editedAt: serverTimestamp(),
    });
  }

  async deleteRoomMessage(roomId: string, messageId: string) {
    const ref = doc(this.firestore, `rooms/${roomId}/messages/${messageId}`);
    return updateDoc(ref, {
      text: 'This message was deleted',
      isDeleted: true,
      deletedAt: serverTimestamp(),
    });
  }

  async hardDeleteRoomMessage(roomId: string, messageId: string) {
    const ref = doc(this.firestore, `rooms/${roomId}/messages/${messageId}`);
    return deleteDoc(ref);
  }
}
