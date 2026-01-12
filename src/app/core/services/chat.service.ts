import { Injectable } from '@angular/core';
import {
  Firestore,
  doc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  onSnapshot,
  getDoc,
  getDocs,
  limit
} from '@angular/fire/firestore';

export interface ChatMessage {
  id?: string;
  text: string;
  senderId: string;
  createdAt: any;

  editedAt?: any;
  isDeleted?: boolean;
  deletedAt?: any;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  constructor(private firestore: Firestore) {}

  // ✅ stable chatId for 2 users
  getChatId(uid1: string, uid2: string): string {
    return [uid1, uid2].sort().join('_');
  }

  // ✅ create chat doc only once
  async ensureChat(chatId: string, uids: string[]) {
    const chatDoc = doc(this.firestore, `chats/${chatId}`);

    const snap = await getDoc(chatDoc);
    if (!snap.exists()) {
      await setDoc(chatDoc, {
        users: uids,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: '',
        lastSenderId: '',
      });
    } else {
      await updateDoc(chatDoc, { updatedAt: serverTimestamp() });
    }
  }

  // ✅ realtime messages listener
  listenMessages(chatId: string, callback: (msgs: ChatMessage[]) => void) {
    const ref = collection(this.firestore, `chats/${chatId}/messages`);
    const q = query(ref, orderBy('createdAt', 'asc'));

    return onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as ChatMessage[];

      callback(data);
    });
  }

  // ✅ SEND
  async sendMessage(chatId: string, text: string, senderId: string) {
    const value = text.trim();
    if (!value) return;

    const msgRef = collection(this.firestore, `chats/${chatId}/messages`);

    await addDoc(msgRef, {
      text: value,
      senderId,
      createdAt: serverTimestamp(),

      // defaults
      editedAt: null,
      isDeleted: false,
      deletedAt: null,
    });

    // update chat preview
    const chatDoc = doc(this.firestore, `chats/${chatId}`);
    await updateDoc(chatDoc, {
      lastMessage: value,
      lastSenderId: senderId,
      updatedAt: serverTimestamp(),
    });
  }

  // ✅ helper: last message
  private async getLastMessage(chatId: string): Promise<ChatMessage | null> {
    const ref = collection(this.firestore, `chats/${chatId}/messages`);
    const q = query(ref, orderBy('createdAt', 'desc'), limit(1));
    const snap = await getDocs(q);

    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as ChatMessage;
  }

  // ✅ EDIT
  async editMessage(chatId: string, messageId: string, newText: string) {
    const value = newText.trim();
    if (!value) return;

    const msgDoc = doc(this.firestore, `chats/${chatId}/messages/${messageId}`);

    await updateDoc(msgDoc, {
      text: value,
      editedAt: serverTimestamp(),
    });

    // update preview if last message edited
    const last = await this.getLastMessage(chatId);
    const chatDoc = doc(this.firestore, `chats/${chatId}`);

    if (last?.id === messageId) {
      await updateDoc(chatDoc, {
        lastMessage: value,
        lastSenderId: last.senderId,
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(chatDoc, { updatedAt: serverTimestamp() });
    }
  }

  // ✅ DELETE (Telegram style soft delete)
  async deleteMessage(chatId: string, messageId: string) {
    const msgDoc = doc(this.firestore, `chats/${chatId}/messages/${messageId}`);

    await updateDoc(msgDoc, {
      text: 'This message was deleted',
      isDeleted: true,
      deletedAt: serverTimestamp(),
    });

    // update preview if last message deleted
    const last = await this.getLastMessage(chatId);
    const chatDoc = doc(this.firestore, `chats/${chatId}`);

    if (last?.id === messageId) {
      await updateDoc(chatDoc, {
        lastMessage: 'This message was deleted',
        lastSenderId: last.senderId,
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(chatDoc, { updatedAt: serverTimestamp() });
    }
  }

  // ✅ Recent chats list (home page)
  listenMyChats(myUid: string, callback: (chats: any[]) => void) {
    const chatsRef = collection(this.firestore, 'chats');

    const q = query(
      chatsRef,
      where('users', 'array-contains', myUid),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (snap) => {
      const chats = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(chats);
    });
  }
}
