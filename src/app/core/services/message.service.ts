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
  deleteDoc
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface ChatMessage {
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

  // ✅ READ messages realtime
  getChatMessages(chatId: string): Observable<ChatMessage[]> {
    const ref = collection(this.firestore, `messages/${chatId}/messages`);
    const q = query(ref, orderBy('createdAt', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<ChatMessage[]>;
  }

  // ✅ SEND
  async sendMessage(chatId: string, senderId: string, text: string) {
    const ref = collection(this.firestore, `messages/${chatId}/messages`);
    return addDoc(ref, {
      text: text.trim(),
      senderId,
      createdAt: serverTimestamp(),
      isDeleted: false,
      deletedAt: null,
      editedAt: null
    });
  }

  // ✅ EDIT
  async editMessage(chatId: string, messageId: string, newText: string) {
    const ref = doc(this.firestore, `messages/${chatId}/messages/${messageId}`);
    return updateDoc(ref, {
      text: newText.trim(),
      editedAt: serverTimestamp()
    });
  }

  // ✅ DELETE (Telegram style = soft delete)
  async deleteMessage(chatId: string, messageId: string) {
    const ref = doc(this.firestore, `messages/${chatId}/messages/${messageId}`);
    return updateDoc(ref, {
      text: 'This message was deleted',
      isDeleted: true,
      deletedAt: serverTimestamp()
    });
  }

  // ❌ HARD DELETE (optional)
  async hardDeleteMessage(chatId: string, messageId: string) {
    const ref = doc(this.firestore, `messages/${chatId}/messages/${messageId}`);
    return deleteDoc(ref);
  }
}
