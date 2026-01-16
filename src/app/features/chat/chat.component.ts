import {
  AfterViewChecked,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, doc, docData } from '@angular/fire/firestore';

import QRCode from 'qrcode';

import { ChatMessage, ChatService } from '../../core/services/chat.service';
import { AppUser, UserService } from '../../core/services/user.service';
import { ContactService } from '../../core/services/contact.service';

type ProfileTab = 'media' | 'files' | 'links';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent
  implements OnInit, OnChanges, OnDestroy, AfterViewChecked
{
  @Input() user!: AppUser;

  myUid = '';
  chatId = '';

  text = '';
  messages: ChatMessage[] = [];

  // header menu
  showHeaderMenu = false;

  // message menu
  menuMessageId: string | null = null;
  menuX = 0;
  menuY = 0;
  selectedMessage: ChatMessage | null = null;

  // edit
  editingId: string | null = null;
  editingText = '';

  // states
  isMuted = false;
  isPinned = false;
  isBlocked = false;

  // profile drawer
  showUserProfile = false;
  profileTab: ProfileTab = 'media';
  qrDataUrl = '';
  profileLink = '';
  isContact = false;

  sharedMedia: string[] = [];
  sharedFiles: { name: string; size: string; url?: string }[] = [];
  sharedLinks: { title: string; url: string }[] = [];

  // upload
  sendingFile = false;
  fileError = '';

  @ViewChild('messagesBox') messagesBox!: ElementRef<HTMLDivElement>;
  private lastCount = 0;

  private authUnsub?: () => void;
  private msgUnsub?: () => void;

  private chatDocSub?: any;
  private meSub?: any;
  private contactUnsub?: any;

  private loading = false;

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private chatService: ChatService,
    private userService: UserService,
    private contactService: ContactService
  ) {}

  // =====================
  // INIT
  // =====================
  ngOnInit(): void {
    this.authUnsub = onAuthStateChanged(this.auth, async (u) => {
      if (!u) return;

      this.myUid = u.uid;

      // blocked status realtime
      this.meSub = this.userService.getUser(this.myUid).subscribe((me) => {
        const blocked = me?.blocked || [];
        this.isBlocked = !!this.user?.uid && blocked.includes(this.user.uid);
      });

      await this.loadChat();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && this.myUid) {
      this.closeAllMenus();
      this.cancelEdit();
      this.closeProfileDrawer();
      this.loadChat();
    }
  }

  ngAfterViewChecked(): void {
    if (this.messages.length !== this.lastCount) {
      this.lastCount = this.messages.length;
      setTimeout(() => this.scrollBottom(), 50);
    }
  }

  // =====================
  // CHAT LOAD
  // =====================
  private async loadChat() {
    if (!this.user?.uid || !this.myUid) return;

    // prevent double load
    if (this.loading) return;
    this.loading = true;

    try {
      this.chatId = this.chatService.getChatId(this.myUid, this.user.uid);

      // ✅ MAIN FIX: always ensure parent chat exists
      await this.chatService.ensureChat(this.chatId, [this.myUid, this.user.uid]);

      // ✅ chat meta listener (mute/pin)
      this.chatDocSub?.unsubscribe?.();
      this.chatDocSub = docData(doc(this.firestore, `chats/${this.chatId}`)).subscribe(
        (d: any) => {
          this.isMuted = !!d?.muted?.[this.myUid];
          this.isPinned = !!d?.pinned?.[this.myUid];
        }
      );

      // ✅ mark read
      await this.chatService.markAsRead(this.chatId, this.myUid);

      // ✅ realtime messages
      this.msgUnsub?.();
      this.msgUnsub = this.chatService.listenMessages(this.chatId, (msgs) => {
        this.messages = msgs || [];
        this.buildSharedTabs();
      });
    } finally {
      this.loading = false;
    }
  }

  // =====================
  // UI HELPERS
  // =====================
  private scrollBottom() {
    if (!this.messagesBox) return;
    const el = this.messagesBox.nativeElement;
    el.scrollTop = el.scrollHeight;
  }

  closeAllMenus() {
    this.menuMessageId = null;
    this.selectedMessage = null;
    this.showHeaderMenu = false;
  }

  toggleHeaderMenu(e: MouseEvent) {
    e.stopPropagation();
    this.menuMessageId = null;
    this.selectedMessage = null;
    this.showHeaderMenu = !this.showHeaderMenu;
  }

  // =====================
  // MESSAGE MENU
  // =====================
  openMsgMenu(e: MouseEvent, m: ChatMessage) {
    e.stopPropagation();
    this.showHeaderMenu = false;

    if (!m?.id) return;

    // ✅ only my messages + not deleted
    if (m.senderId !== this.myUid || m.isDeleted) {
      this.menuMessageId = null;
      return;
    }

    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    this.menuX = r.right - 210;
    this.menuY = r.bottom + 6;

    this.menuMessageId = m.id;
    this.selectedMessage = m;
  }

  // ✅ MAIN SEND FUNCTION (fixed)
  async send() {
    const v = (this.text || '').trim();
    if (!v || !this.chatId) return;
    if (!this.myUid || !this.user?.uid) return;
    if (this.isBlocked) return;

    try {
      // ✅ ensure chat exists always
      await this.chatService.ensureChat(this.chatId, [this.myUid, this.user.uid]);

      await this.chatService.sendMessage(this.chatId, v, this.myUid, this.user.uid);

      this.text = '';
    } catch (err) {
      console.error('🔥 send() failed:', err);
    }
  }

  clickEdit() {
    if (!this.selectedMessage?.id) return;
    this.editingId = this.selectedMessage.id;
    this.editingText = this.selectedMessage.text;
    this.menuMessageId = null;
  }

  async clickDelete() {
    if (!this.selectedMessage?.id) return;
    if (!confirm('Delete this message?')) return;

    await this.chatService.deleteMessage(this.chatId, this.selectedMessage.id);
    this.menuMessageId = null;
  }

  cancelEdit() {
    this.editingId = null;
    this.editingText = '';
  }

  async saveEdit() {
    if (!this.editingId) return;

    const v = this.editingText.trim();
    if (!v) return;

    await this.chatService.editMessage(this.chatId, this.editingId, v);
    this.cancelEdit();
  }

  // =====================
  // ACTIONS
  // =====================
  async toggleMute() {
    await this.chatService.muteChat(this.chatId, this.myUid, !this.isMuted);
    this.isMuted = !this.isMuted;
    this.showHeaderMenu = false;
  }

  async togglePin() {
    await this.chatService.pinChat(this.chatId, this.myUid, !this.isPinned);
    this.isPinned = !this.isPinned;
    this.showHeaderMenu = false;
  }

  async toggleBlock() {
    if (!this.user?.uid) return;

    if (!this.isBlocked) {
      if (!confirm('Block this user?')) return;
      await this.userService.blockUser(this.myUid, this.user.uid);
      this.isBlocked = true;
    } else {
      await this.userService.unblockUser(this.myUid, this.user.uid);
      this.isBlocked = false;
    }

    this.showHeaderMenu = false;
  }

  // =====================
  // PROFILE DRAWER
  // =====================
  async openProfileDrawer() {
    if (!this.user?.uid) return;

    this.showUserProfile = true;
    this.profileTab = 'media';

    this.profileLink = `chatloop://user/${this.user.uid}`;

    try {
      this.qrDataUrl = await QRCode.toDataURL(this.profileLink, {
        width: 240,
        margin: 1,
      });
    } catch {
      this.qrDataUrl = '';
    }

    // realtime contact check
    this.contactUnsub?.();
    this.contactUnsub = this.contactService.listenContacts(this.myUid, (list) => {
      this.isContact = !!(list || []).find((c: any) => c.uid === this.user.uid);
    });
  }

  closeProfileDrawer() {
    this.showUserProfile = false;
  }

  setTab(t: ProfileTab) {
    this.profileTab = t;
  }

  copyText(t: string) {
    navigator.clipboard.writeText(t || '');
    alert('✅ Copied');
  }

  async addToContacts() {
    if (this.isContact) return;

    await this.contactService.addContact(this.myUid, {
      uid: this.user.uid,
      name: this.user.name || 'Friend',
      phone: this.user.phone || '',
    });

    this.isContact = true;
    alert('✅ Added');
  }

  // =====================
  // FILE UPLOAD
  // =====================
  async pickFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      this.sendingFile = true;
      this.fileError = '';

      // ✅ ensure chat exists first
      await this.chatService.ensureChat(this.chatId, [this.myUid, this.user.uid]);

      // ✅ send file message
      await this.chatService.sendFileMessage(this.chatId, file, this.myUid, this.user.uid);
    } catch (err: any) {
      console.error(err);
      this.fileError = err?.message || 'Upload failed';
    } finally {
      this.sendingFile = false;
      input.value = '';
    }
  }

  // =====================
  // SHARED TABS
  // =====================
  private buildSharedTabs() {
    this.sharedMedia = [];
    this.sharedFiles = [];
    this.sharedLinks = [];

    (this.messages || []).forEach((m: any) => {
      if (m.type === 'image' && m.fileUrl) this.sharedMedia.push(m.fileUrl);

      if (m.type === 'file' && m.fileUrl) {
        this.sharedFiles.push({
          name: m.fileName || 'File',
          size: `${((m.fileSize || 0) / 1024 / 1024).toFixed(1)} MB`,
          url: m.fileUrl,
        });
      }

      const urls = (m.text || '').match(/https?:\/\/\S+/g) || [];
      urls.forEach((u: string) => this.sharedLinks.push({ title: u, url: u }));
    });
  }

  // dummy actions
  callUser() {
    alert('📞 Coming soon');
  }
  videoCallUser() {
    alert('🎥 Coming soon');
  }
  searchInChat() {
    alert('🔍 Coming soon');
  }

  ngOnDestroy(): void {
    this.authUnsub?.();
    this.msgUnsub?.();
    this.chatDocSub?.unsubscribe?.();
    this.meSub?.unsubscribe?.();
    this.contactUnsub?.();
  }
}
