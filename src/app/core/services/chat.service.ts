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
  limit,
  increment,
  deleteField
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

      unread: {
        [uids[0]]: 0,
        [uids[1]]: 0,
      },

      muted: {},
      pinned: {},
    });
    return;
  }

  // ✅ patch old chats WITHOUT touching updatedAt
  const data: any = snap.data();

  const patch: any = {};
  if (!data?.muted) patch.muted = {};
  if (!data?.pinned) patch.pinned = {};
  if (!data?.unread) {
    patch.unread = {
      [uids[0]]: 0,
      [uids[1]]: 0,
    };
  }

  // ✅ update only if required
  if (Object.keys(patch).length > 0) {
    await updateDoc(chatDoc, patch);
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

  // ✅ mark read (when opening chat)
  async markAsRead(chatId: string, myUid: string) {
    const chatDoc = doc(this.firestore, `chats/${chatId}`);
    await updateDoc(chatDoc, {
      [`unread.${myUid}`]: 0,
    });
  }

  // ✅ mute chat (per user)
  async muteChat(chatId: string, myUid: string, mute: boolean) {
    const chatDoc = doc(this.firestore, `chats/${chatId}`);

    if (mute) {
      await updateDoc(chatDoc, { [`muted.${myUid}`]: true });
    } else {
      await updateDoc(chatDoc, { [`muted.${myUid}`]: deleteField() });
    }
  }

  // ✅ pin chat (per user)
  async pinChat(chatId: string, myUid: string, pin: boolean) {
    const chatDoc = doc(this.firestore, `chats/${chatId}`);

    if (pin) {
      await updateDoc(chatDoc, { [`pinned.${myUid}`]: true });
    } else {
      await updateDoc(chatDoc, { [`pinned.${myUid}`]: deleteField() });
    }
  }

  // ✅ SEND message (updates unread + preview)
  async sendMessage(chatId: string, text: string, senderId: string, receiverId: string) {
    const value = text.trim();
    if (!value) return;

    const msgRef = collection(this.firestore, `chats/${chatId}/messages`);

    await addDoc(msgRef, {
      text: value,
      senderId,
      createdAt: serverTimestamp(),

      editedAt: null,
      isDeleted: false,
      deletedAt: null,
    });

    // ✅ update chat preview + unread count
    const chatDoc = doc(this.firestore, `chats/${chatId}`);
    await updateDoc(chatDoc, {
      lastMessage: value,
      lastSenderId: senderId,
      updatedAt: serverTimestamp(),

      // ✅ increment unread for receiver
      [`unread.${receiverId}`]: increment(1),
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

  // ✅ EDIT message
  async editMessage(chatId: string, messageId: string, newText: string) {
    const value = newText.trim();
    if (!value) return;

    const msgDoc = doc(this.firestore, `chats/${chatId}/messages/${messageId}`);
    await updateDoc(msgDoc, {
      text: value,
      editedAt: serverTimestamp(),
    });

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

  // ✅ DELETE message (soft delete telegram style)
  async deleteMessage(chatId: string, messageId: string) {
    const msgDoc = doc(this.firestore, `chats/${chatId}/messages/${messageId}`);

    await updateDoc(msgDoc, {
      text: 'This message was deleted',
      isDeleted: true,
      deletedAt: serverTimestamp(),
    });

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

  // ✅ Recent chats list
  listenMyChats(myUid: string, callback: (chats: any[]) => void) {
    const chatsRef = collection(this.firestore, 'chats');

    const q = query(
      chatsRef,
      where('users', 'array-contains', myUid),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (snap) => {
      let chats = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // ✅ pinned chats should come first
      chats = chats.sort((a: any, b: any) => {
        const ap = a?.pinned?.[myUid] ? 1 : 0;
        const bp = b?.pinned?.[myUid] ? 1 : 0;
        return bp - ap; // pinned first
      });

      callback(chats);
    });
  }
}
