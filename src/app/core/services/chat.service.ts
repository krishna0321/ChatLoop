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

import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';

export type ChatMessageType = 'text' | 'image' | 'file' | 'link';

export interface ChatMessage {
  id?: string;

  // ✅ base fields
  type?: ChatMessageType;
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
  fileSize?: number;
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

    return onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        })) as ChatMessage[];

        callback(data);
      },
      (err) => {
        console.error('🔥 listenMessages() error:', err);
        callback([]);
      }
    );
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
  async sendMessage(
    chatId: string,
    text: string,
    senderId: string,
    receiverId: string
  ) {
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
      [`unread.${receiverId}`]: increment(1),
    });
  }

  // ✅ Upload file/photo and send message
  async sendFileMessage(
    chatId: string,
    file: File,
    senderId: string,
    receiverId: string,
    type: 'image' | 'file',
    caption: string = ''
  ) {
    if (!file) throw new Error('No file selected');

    // ✅ strict validation
    if (type === 'image') {
      if (!(file.type || '').startsWith('image/')) {
        throw new Error('Only image files allowed');
      }
    } else {
      const allowedExt = [
        'pdf',
        'doc',
        'docx',
        'xls',
        'xlsx',
        'ppt',
        'pptx',
        'zip',
        'rar',
        'txt',
      ];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!allowedExt.includes(ext)) {
        throw new Error('Only document files allowed');
      }
    }

    const msgType: ChatMessageType = type; // 'image' | 'file'

    // ✅ upload path
    const safeName = (file.name || 'file').replace(/[^\w.\-]+/g, '_');
    const path = `chat_uploads/${chatId}/${Date.now()}_${safeName}`;
    const fileRef = ref(this.storage, path);

    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);

    // ✅ message text
    const cleanCaption = (caption || '').trim();

    // for image: caption can be shown
    // for document: show filename (caption optional not needed)
    const msgText =
      msgType === 'image'
        ? cleanCaption
        : `📎 ${file.name}`;

    const previewText =
      msgType === 'image'
        ? '📷 Photo'
        : `📎 ${file.name}`;

    const msgRef = collection(this.firestore, `chats/${chatId}/messages`);

    await addDoc(msgRef, {
      type: msgType,
      text: msgText,
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

    // ✅ update chat preview + unread
    const chatDoc = doc(this.firestore, `chats/${chatId}`);
    await updateDoc(chatDoc, {
      lastMessage: previewText,
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

  // ✅ EDIT message
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

  // ✅ DELETE message (soft delete)
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

  // ✅ recent chats list
  listenMyChats(myUid: string, callback: (chats: any[]) => void) {
    const chatsRef = collection(this.firestore, 'chats');

    const qSorted = query(
      chatsRef,
      where('users', 'array-contains', myUid),
      orderBy('updatedAt', 'desc')
    );

    const qFallback = query(chatsRef, where('users', 'array-contains', myUid));

    const applyPinnedSorting = (chats: any[]) => {
      chats = chats.sort((a: any, b: any) => {
        const ap = a?.pinned?.[myUid] ? 1 : 0;
        const bp = b?.pinned?.[myUid] ? 1 : 0;
        return bp - ap;
      });

      chats = chats.sort((a: any, b: any) => {
        const ap = a?.pinned?.[myUid] ? 1 : 0;
        const bp = b?.pinned?.[myUid] ? 1 : 0;

        if (ap !== bp) return bp - ap;

        const at = this.getTimeValue(a?.updatedAt);
        const bt = this.getTimeValue(b?.updatedAt);
        return bt - at;
      });

      return chats;
    };

    const unsubSorted = onSnapshot(
      qSorted,
      (snap) => {
        let chats = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        chats = applyPinnedSorting(chats);
        callback(chats);
      },
      (err: any) => {
        console.error('🔥 listenMyChats() sorted query failed:', err);
        console.warn('⚠️ Falling back to chats query without orderBy(updatedAt)...');

        const unsubFallback = onSnapshot(
          qFallback,
          (snap2) => {
            let chats = snap2.docs.map((d) => ({
              id: d.id,
              ...(d.data() as any),
            }));

            chats = applyPinnedSorting(chats);
            callback(chats);
          },
          (err2: any) => {
            console.error('🔥 listenMyChats() fallback query also failed:', err2);
            callback([]);
          }
        );

        return () => unsubFallback();
      }
    );

    return unsubSorted;
  }

  // ✅ detect links inside messages
  private detectMessageType(text: string): ChatMessageType {
    const hasUrl = /https?:\/\/[^\s]+/i.test(text);
    return hasUrl ? 'link' : 'text';
  }

  // ✅ helper timestamp
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
