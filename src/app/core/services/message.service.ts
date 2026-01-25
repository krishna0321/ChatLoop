import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  collectionData,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { RoomService } from './room.service';

export interface RoomMessage {
  id?: string;
  senderId: string;
  text: string;

  createdAt?: any;
  editedAt?: any;
  isDeleted?: boolean;
}

@Injectable({ providedIn: 'root' })
export class MessageService {
  constructor(private fs: Firestore, private rooms: RoomService) {}

  //   =
  // LISTEN ROOM MESSAGES
  //   =
  getRoomMessages(roomId: string): Observable<RoomMessage[]> {
    const ref = collection(this.fs, `rooms/${roomId}/messages`);
    const q = query(ref, orderBy('createdAt', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<RoomMessage[]>;
  }

  //   =
  // ✅ SEND ROOM MESSAGE
  //   =
  async sendRoomMessage(roomId: string, senderId: string, text: string) {
    const value = (text || '').trim();
    if (!value) return;

    const ref = collection(this.fs, `rooms/${roomId}/messages`);

    await addDoc(ref, {
      senderId,
      text: value,
      createdAt: serverTimestamp(),
      isDeleted: false,
    });

    // ✅ update room meta
    await this.rooms.updateRoomMeta(roomId, senderId, value);
  }

  //   =
  // DELETE MESSAGE
  //   =
  async deleteRoomMessage(roomId: string, msgId: string) {
    const msgDoc = doc(this.fs, `rooms/${roomId}/messages/${msgId}`);
    await updateDoc(msgDoc, {
      isDeleted: true,
      text: 'This message was deleted',
      editedAt: serverTimestamp(),
    });
  }
}
