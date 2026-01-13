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
  deleteField,
} from '@angular/fire/firestore';

import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL,
} from '@angular/fire/storage';

export type ChatMessageType = 'text' | 'image' | 'file' | 'link';

export interface ChatMessage {
  id?: string;

  // ✅ base fields
  type?: ChatMessageType;          // text/image/file/link
  text: string;
  senderId: string;
  receiverId?: string;

  createdAt: any;
  editedAt?: any;

  isDeleted?: boolean;
  deletedAt?: any;

  // ✅ file fields (for image/file)
  fileUrl?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number; // bytes
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  constructor(private firestore: Firestore, private storage: Storage) {}

  // ✅ stable chatId for 2 users
  getChatId(uid1: string, uid2: string): string {
    return [uid1, uid2].sort().join('_');
  }

  // ✅ Create chat if missing + patch old chats
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
        lastMessageAt: serverTimestamp(),

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
    if (!data?.lastMessageAt) patch.lastMessageAt = serverTimestamp();

    if (Object.keys(patch).length > 0) {
      await updateDoc(chatDoc, patch);
    }
  }

  // ✅ realtime messages listener
  listenMessages(chatId: string, callback: (msgs: ChatMessage[]) => void) {
    const refCol = collection(this.firestore, `chats/${chatId}/messages`);
    const q = query(refCol, orderBy('createdAt', 'asc'));

    return onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
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

  // ✅ SEND text message (updates unread + preview)
  async sendMessage(chatId: string, text: string, senderId: string, receiverId: string) {
    const value = (text || '').trim();
    if (!value) return;

    const msgRef = collection(this.firestore, `chats/${chatId}/messages`);

    await addDoc(msgRef, {
      type: this.detectMessageType(value),
      text: value,
      senderId,
      receiverId,
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
      lastMessageAt: serverTimestamp(),

      // ✅ increment unread for receiver
      [`unread.${receiverId}`]: increment(1),
    });
  }

  // ✅ Upload file/photo and send message
  async sendFileMessage(
    chatId: string,
    file: File,
    senderId: string,
    receiverId: string
  ) {
    if (!file) throw new Error('No file selected');

    const isImage = (file.type || '').startsWith('image/');
    const msgType: ChatMessageType = isImage ? 'image' : 'file';

    // ✅ upload path
    const safeName = (file.name || 'file').replace(/[^\w.\-]+/g, '_');
    const path = `chat_uploads/${chatId}/${Date.now()}_${safeName}`;

    const fileRef = ref(this.storage, path);

    // ✅ upload to Firebase Storage
    await uploadBytes(fileRef, file);

    // ✅ get public url
    const url = await getDownloadURL(fileRef);

    const msgRef = collection(this.firestore, `chats/${chatId}/messages`);

    // ✅ firestore msg
    await addDoc(msgRef, {
      type: msgType,
      text: isImage ? '📷 Photo' : `📎 ${file.name}`,
      senderId,
      receiverId,

      createdAt: serverTimestamp(),
      editedAt: null,

      isDeleted: false,
      deletedAt: null,

      fileUrl: url,
      fileName: file.name,
      mimeType: file.type || '',
      fileSize: file.size || 0,
    });

    // ✅ update chat preview
    const chatDoc = doc(this.firestore, `chats/${chatId}`);
    await updateDoc(chatDoc, {
      lastMessage: isImage ? '📷 Photo' : `📎 ${file.name}`,
      lastSenderId: senderId,
      updatedAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),

      [`unread.${receiverId}`]: increment(1),
    });
  }

  // ✅ helper: last message
  private async getLastMessage(chatId: string): Promise<ChatMessage | null> {
    const refCol = collection(this.firestore, `chats/${chatId}/messages`);
    const q = query(refCol, orderBy('createdAt', 'desc'), limit(1));
    const snap = await getDocs(q);

    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...(d.data() as any) } as ChatMessage;
  }

  // ✅ EDIT message (text only)
  async editMessage(chatId: string, messageId: string, newText: string) {
    const value = (newText || '').trim();
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
        lastMessageAt: serverTimestamp(),
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
      type: 'text',
      fileUrl: deleteField(),
      fileName: deleteField(),
      mimeType: deleteField(),
      fileSize: deleteField(),

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
        lastMessageAt: serverTimestamp(),
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
      let chats = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

      // ✅ pinned chats should come first
      chats = chats.sort((a: any, b: any) => {
        const ap = a?.pinned?.[myUid] ? 1 : 0;
        const bp = b?.pinned?.[myUid] ? 1 : 0;
        return bp - ap;
      });

      callback(chats);
    });
  }

  // ✅ detect links inside messages (for profile "Links tab")
  private detectMessageType(text: string): ChatMessageType {
    const hasUrl = /https?:\/\/[^\s]+/i.test(text);
    return hasUrl ? 'link' : 'text';
  }
}
