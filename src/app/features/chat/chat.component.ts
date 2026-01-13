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
  @Input() user!: AppUser; // selected user from chats list

  myUid = '';
  chatId = '';

  text = '';
  messages: ChatMessage[] = [];

  // menus
  showHeaderMenu = false;

  menuMessageId: string | null = null;
  menuX = 0;
  menuY = 0;
  private selectedMessage: ChatMessage | null = null;

  // edit
  editingId: string | null = null;
  editingText = '';

  // states
  isMuted = false;
  isPinned = false;
  isBlocked = false;

  // ✅ Telegram style drawer profile
  showUserProfile = false;
  qrDataUrl = '';
  profileLink = '';
  isContact = false;

  profileTab: ProfileTab = 'media';

  // shared demo items (later: from firestore)
  sharedMedia: string[] = [];
  sharedFiles: { name: string; size: string; url?: string }[] = [];
  sharedLinks: { title: string; url: string }[] = [];

  // file upload UI (optional)
  sendingFile = false;
  fileError = '';

  @ViewChild('messagesBox') messagesBox!: ElementRef<HTMLDivElement>;
  private lastMsgCount = 0;

  private unsubscribeAuth: any;
  private unsubscribeMsgs: any;
  private meSub: any;
  private contactUnsub: any;

  constructor(
    private auth: Auth,
    private chatService: ChatService,
    private userService: UserService,
    private contactService: ContactService
  ) {}

  ngOnInit(): void {
    this.unsubscribeAuth = onAuthStateChanged(this.auth, (firebaseUser) => {
      if (!firebaseUser) return;

      this.myUid = firebaseUser.uid;

      // ✅ realtime blocked state
      this.meSub = this.userService.getUser(this.myUid).subscribe((me) => {
        const blocked = me?.blocked || [];
        this.isBlocked = !!this.user?.uid && blocked.includes(this.user.uid);
      });

      this.loadChat();
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
    if (this.messages.length !== this.lastMsgCount) {
      this.lastMsgCount = this.messages.length;
      setTimeout(() => this.scrollBottom(), 40);
    }
  }

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

  toggleHeaderMenu(event: MouseEvent) {
    event.stopPropagation();
    this.menuMessageId = null;
    this.selectedMessage = null;
    this.showHeaderMenu = !this.showHeaderMenu;
  }

  async loadChat() {
    if (!this.user?.uid || !this.myUid) return;

    this.chatId = this.chatService.getChatId(this.myUid, this.user.uid);

    await this.chatService.ensureChat(this.chatId, [this.myUid, this.user.uid]);

    if ((this.chatService as any).markAsRead) {
      await (this.chatService as any).markAsRead(this.chatId, this.myUid);
    }

    if (this.unsubscribeMsgs) this.unsubscribeMsgs();
    this.unsubscribeMsgs = this.chatService.listenMessages(this.chatId, (msgs) => {
      this.messages = msgs || [];
    });

    // ✅ status from firestore doc (if your service later adds helper)
    this.isMuted = false;
    this.isPinned = false;
  }

  openMsgMenu(event: MouseEvent, m: ChatMessage) {
    event.stopPropagation();
    this.showHeaderMenu = false;

    if (!m.id) return;

    // only my message & not deleted
    if (m.senderId !== this.myUid || m.isDeleted) {
      this.menuMessageId = null;
      return;
    }

    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    this.menuX = rect.right - 210;
    this.menuY = rect.top + rect.height + 8;

    this.menuMessageId = m.id;
    this.selectedMessage = m;
  }

  send() {
    const value = this.text.trim();
    if (!value || !this.chatId) return;
    if (this.isBlocked) return;

    try {
      (this.chatService as any).sendMessage(this.chatId, value, this.myUid, this.user.uid);
    } catch {
      this.chatService.sendMessage(this.chatId, value, this.myUid, this.user.uid);
    }

    this.text = '';
  }

  // ===== edit / delete =====
  clickEdit() {
    if (!this.selectedMessage?.id) return;
    this.editingId = this.selectedMessage.id;
    this.editingText = this.selectedMessage.text;
    this.menuMessageId = null;
  }

  clickDelete() {
    if (!this.selectedMessage?.id) return;
    this.deleteMessage(this.selectedMessage);
  }

  cancelEdit() {
    this.editingId = null;
    this.editingText = '';
  }

  async saveEdit() {
    if (!this.editingId || !this.chatId) return;
    const value = this.editingText.trim();
    if (!value) return;

    await this.chatService.editMessage(this.chatId, this.editingId, value);
    this.cancelEdit();
  }

  async deleteMessage(m: ChatMessage) {
    if (m.senderId !== this.myUid || !m.id || !this.chatId) return;

    this.menuMessageId = null;

    const ok = confirm('Delete this message?');
    if (!ok) return;

    await this.chatService.deleteMessage(this.chatId, m.id);
  }

  // ===== mute / pin / block =====
  async toggleMute() {
    await (this.chatService as any).muteChat?.(this.chatId, this.myUid, !this.isMuted);
    this.isMuted = !this.isMuted;
    this.showHeaderMenu = false;
  }

  async togglePin() {
    await (this.chatService as any).pinChat?.(this.chatId, this.myUid, !this.isPinned);
    this.isPinned = !this.isPinned;
    this.showHeaderMenu = false;
  }

  async toggleBlock() {
    if (!this.user?.uid) return;

    if (!this.isBlocked) {
      const ok = confirm('Block this user?');
      if (!ok) return;
      await this.userService.blockUser(this.myUid, this.user.uid);
      this.isBlocked = true;
    } else {
      await this.userService.unblockUser(this.myUid, this.user.uid);
      this.isBlocked = false;
    }

    this.showHeaderMenu = false;
  }

  // ==========================
  // ✅ TELEGRAM PROFILE DRAWER
  // ==========================
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

    // ✅ realtime contact check
    if (this.contactUnsub) this.contactUnsub();
    this.contactUnsub = this.contactService.listenContacts(this.myUid, (list) => {
      this.isContact = !!(list || []).find((c: any) => c.uid === this.user.uid);
    });

    // demo items
    this.sharedMedia = [];
    this.sharedFiles = [];
    this.sharedLinks = [];
  }

  closeProfileDrawer() {
    this.showUserProfile = false;
  }

  setTab(tab: ProfileTab) {
    this.profileTab = tab;
  }

  copyText(text: string) {
    navigator.clipboard.writeText(text || '');
    alert('✅ Copied');
  }

  async addToContacts() {
    if (!this.user?.uid || !this.myUid) return;

    if (this.isContact) {
      alert('✅ Already in contacts');
      return;
    }

    await this.contactService.addContact(this.myUid, {
      name: this.user.name || 'New Friend',
      phone: this.user.phone || '',
      uid: this.user.uid,
    });

    this.isContact = true;
    alert('✅ Added to contacts');
  }

  // ===== FIX FOR ERROR ✅ (Pipe + ternary) =====
  formatMB(bytes: any): string {
    const n = Number(bytes || 0);
    if (!n) return '0.0';
    return (n / 1024 / 1024).toFixed(1);
  }

  // file upload pick (for later)
  pickFile(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    // later we will upload in Firebase storage
    alert(`Selected file: ${file.name}`);
    input.value = '';
  }

  // UI actions
  callUser() {
    alert('📞 Call feature coming soon');
  }
  videoCallUser() {
    alert('🎥 Video call feature coming soon');
  }
  searchInChat() {
    alert('🔍 Search in chat coming soon');
  }

  ngOnDestroy(): void {
    if (this.unsubscribeAuth) this.unsubscribeAuth();
    if (this.unsubscribeMsgs) this.unsubscribeMsgs();
    if (this.meSub) this.meSub.unsubscribe?.();
    if (this.contactUnsub) this.contactUnsub();
  }
}
