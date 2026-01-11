import { Injectable } from '@angular/core';
import { onSnapshot } from '@angular/fire/firestore';
import {
  Firestore,
  doc,
  setDoc,
  collection,
  addDoc,
  collectionData,
  query,
  orderBy,
  serverTimestamp
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface ChatMessage {
  id?: string;
  text: string;
  senderId: string;
  createdAt: any;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  listenMyChats(myUid: string, arg1: (chats: any) => Promise<void>): any {
    throw new Error('Method not implemented.');
  }
  constructor(private firestore: Firestore) {}

  // ✅ stable chatId for 2 people
  getChatId(uid1: string, uid2: string): string {
    return [uid1, uid2].sort().join('_');
  }

  // create chat doc if not exists
  async ensureChat(chatId: string, uids: string[]) {
    const chatDoc = doc(this.firestore, `chats/${chatId}`);
    await setDoc(
      chatDoc,
      { users: uids, updatedAt: serverTimestamp() },
      { merge: true }
    );
  }

  getMessages(chatId: string): Observable<ChatMessage[]> {
    const ref = collection(this.firestore, `chats/${chatId}/messages`);
    const q = query(ref, orderBy('createdAt', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<ChatMessage[]>;
  }

  sendMessage(chatId: string, text: string, senderId: string) {
    const ref = collection(this.firestore, `chats/${chatId}/messages`);
    return addDoc(ref, {
      text,
      senderId,
      createdAt: serverTimestamp()
    });
  }
  // ✅ listen messages (real-time)
listenMessages(chatId: string, callback: (msgs: any[]) => void) {
  const ref = collection(this.firestore, `chats/${chatId}/messages`);
  const q = query(ref, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(data as any[]);
  });
}
}
