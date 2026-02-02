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

export type ChatMessageType = 'text' | 'image' | 'file' | 'link';

export interface ChatMessage {
  id?: string;
  type?: ChatMessageType;
  text: string;
  senderId: string;
  receiverId?: string;
  createdAt: any;
  editedAt?: any;
  isDeleted?: boolean;
  deletedAt?: any;

  fileUrl?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
}

@Injectable({ providedIn: 'root' })
export class ChatService {

  // ☁️ Cloudinary config
  private CLOUD_NAME = 'dtjiusnag';
  private UPLOAD_PRESET = 'chatloop';
  private BASE_URL = 'https://api.cloudinary.com/v1_1';

  // ✅ ADD THIS LINE
  constructor(private firestore: Firestore) {}




// =====================
// CLOUDINARY UPLOAD
// =====================
private async uploadToCloudinary(file: File): Promise<string> {

  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', this.UPLOAD_PRESET);

  const url = `${this.BASE_URL}/${this.CLOUD_NAME}/auto/upload`;

  const res = await fetch(url, {
    method: 'POST',
    body: form
  });

  const data = await res.json();

  console.log('Cloudinary response:', data); // debug (optional)

  if (!data?.secure_url) {
    throw new Error(data?.error?.message || 'Upload failed');
  }

  return data.secure_url;
}


  // =====================
  // CHAT ID
  // =====================
  getChatId(uid1: string, uid2: string): string {
    return [uid1, uid2].sort().join('_');
  }

  // =====================
  // ENSURE CHAT
  // =====================
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
        unread: { [uids[0]]: 0, [uids[1]]: 0 },
        muted: {},
        pinned: {},
      });
      return;
    }

    const data: any = snap.data();
    const patch: any = {};

    if (!data?.muted) patch.muted = {};
    if (!data?.pinned) patch.pinned = {};
    if (!data?.unread)
      patch.unread = { [uids[0]]: 0, [uids[1]]: 0 };
    if (!data?.lastMessageAt) patch.lastMessageAt = serverTimestamp();

    if (Object.keys(patch).length) await updateDoc(chatDoc, patch);
  }

  // =====================
  // LISTEN MESSAGES
  // =====================
  listenMessages(chatId: string, cb: (msgs: ChatMessage[]) => void) {
    const refCol = collection(this.firestore, `chats/${chatId}/messages`);
    const q = query(refCol, orderBy('createdAt', 'asc'));

    return onSnapshot(q, snap => {
      cb(
        snap.docs.map(d => ({
          id: d.id,
          ...(d.data() as any),
        }))
      );
    });
  }

  // =====================
  // READ / PIN / MUTE
  // =====================
  async markAsRead(chatId: string, uid: string) {
    await updateDoc(doc(this.firestore, `chats/${chatId}`), {
      [`unread.${uid}`]: 0,
    });
  }

  async muteChat(chatId: string, uid: string, mute: boolean) {
    await updateDoc(doc(this.firestore, `chats/${chatId}`),
      mute ? { [`muted.${uid}`]: true } : { [`muted.${uid}`]: deleteField() }
    );
  }

  async pinChat(chatId: string, uid: string, pin: boolean) {
    await updateDoc(doc(this.firestore, `chats/${chatId}`),
      pin ? { [`pinned.${uid}`]: true } : { [`pinned.${uid}`]: deleteField() }
    );
  }

  // =====================
  // TEXT MESSAGE
  // =====================
  async sendMessage(chatId: string, text: string, senderId: string, receiverId: string) {
    const value = text.trim();
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

    await updateDoc(doc(this.firestore, `chats/${chatId}`), {
      lastMessage: value,
      lastSenderId: senderId,
      updatedAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
      [`unread.${receiverId}`]: increment(1),
    });
  }

  // =====================
  // FILE / IMAGE MESSAGE (CLOUDINARY)
  // =====================
  async sendFileMessage(
    chatId: string,
    file: File,
    senderId: string,
    receiverId: string,
    type: 'image' | 'file',
    caption = ''
  ) {

    if (type === 'image' && !file.type.startsWith('image/'))
      throw new Error('Only images allowed');

    if (type === 'file') {
      const allowed = ['pdf','doc','docx','xls','xlsx','ppt','pptx','zip','rar','txt'];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!allowed.includes(ext)) throw new Error('Invalid file type');
    }

    const url = await this.uploadToCloudinary(file);


    const msgText = type === 'image' ? caption : `📎 ${file.name}`;
    const preview = type === 'image' ? '📷 Photo' : `📎 ${file.name}`;

    const msgRef = collection(this.firestore, `chats/${chatId}/messages`);

    await addDoc(msgRef, {
      type,
      text: msgText,
      senderId,
      receiverId,
      createdAt: serverTimestamp(),
      editedAt: null,
      isDeleted: false,
      deletedAt: null,
      fileUrl: url,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
    });

    await updateDoc(doc(this.firestore, `chats/${chatId}`), {
      lastMessage: preview,
      lastSenderId: senderId,
      updatedAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
      [`unread.${receiverId}`]: increment(1),
    });
  }

  // =====================
  // EDIT / DELETE
  // =====================
  async editMessage(chatId: string, msgId: string, text: string) {
    await updateDoc(
      doc(this.firestore, `chats/${chatId}/messages/${msgId}`),
      { text: text.trim(), editedAt: serverTimestamp() }
    );
  }

  async deleteMessage(chatId: string, msgId: string) {
    await updateDoc(
      doc(this.firestore, `chats/${chatId}/messages/${msgId}`),
      {
        text: 'This message was deleted',
        type: 'text',
        fileUrl: deleteField(),
        fileName: deleteField(),
        mimeType: deleteField(),
        fileSize: deleteField(),
        isDeleted: true,
        deletedAt: serverTimestamp(),
      }
    );
  }

  // =====================
  // CHAT LIST
  // =====================
  listenMyChats(myUid: string, cb: (chats: any[]) => void) {
    const chatsRef = collection(this.firestore, 'chats');

    const q = query(
      chatsRef,
      where('users', 'array-contains', myUid),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, snap => {
      cb(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    });
  }

  // =====================
  // HELPERS
  // =====================
  private detectMessageType(text: string): ChatMessageType {
    return /https?:\/\/\S+/i.test(text) ? 'link' : 'text';
  }
}
