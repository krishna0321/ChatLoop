import { AfterViewChecked,Component,ElementRef,HostListener,Input,OnChanges,OnDestroy,OnInit,SimpleChanges,ViewChild,Output, EventEmitter, } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import QRCode from 'qrcode';
import { ChatMessage, ChatService } from '../../core/services/chat.service';
import { AppUser, UserService } from '../../core/services/user.service';
import { ContactService } from '../../core/services/contact.service';

type ProfileTab = 'media' | 'files' | 'links';
type AttachType = 'image' | 'document';


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
  @Output() back = new EventEmitter<void>(); // ✅ mobile back

  // ✅ MOBILE BACK (used only on small screens)
  goBack() {
  this.back.emit();
}
  isOnline = false;
  lastSeen: any = null;
  isTyping = false;
  fullImage: string | null = null;

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
  uploadPercent = 0;


  // attach menu
  showAttachMenu = false;
  attachType: AttachType | null = null;
  selectedFile: File | null = null;

  // ✅ mobile keyboard helper
  keyboardOpen = false;

  @ViewChild('messagesBox') messagesBox!: ElementRef<HTMLDivElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

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

    openImage(url: string) {
    this.fullImage = url;
    }

    closeImage() {
    this.fullImage = null;
    }

  // ✅ keyboard open/close
  @HostListener('window:focusin', ['$event'])
  onFocusIn(e: any) {
    const tag = (e?.target?.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') {
      this.keyboardOpen = true;
      setTimeout(() => this.scrollBottom(), 120);
    }
  }

  @HostListener('window:focusout')
  onFocusOut() {
    this.keyboardOpen = false;
  }

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

      this.chatService.setOnline(this.myUid, true);

      window.addEventListener('beforeunload', () => {
        this.chatService.setOnline(this.myUid, false);
      });

      await this.loadChat();
      docData(doc(this.firestore, `users/${this.user.uid}`))
      .subscribe((u:any) => {
        this.isOnline = !!u?.online;
        this.lastSeen = u?.lastSeen;
        this.isTyping = u?.typingIn === this.chatId;
      });

    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && this.myUid) {
      this.closeAllMenus();
      this.cancelEdit();
      this.closeProfileDrawer();
      this.clearSelectedFile();
      this.loadChat();
    }
  }

  ngAfterViewChecked(): void {
    if (this.messages.length !== this.lastCount) {
      this.lastCount = this.messages.length;
      setTimeout(() => this.scrollBottom(true), 40);

    }
  }

  // =====================
  // CHAT LOAD
  // =====================
  private async loadChat() {
    if (!this.user?.uid || !this.myUid) return;

    if (this.loading) return;
    this.loading = true;

    try {
      this.chatId = this.chatService.getChatId(this.myUid, this.user.uid);

      // ensure chat exists
      await this.chatService.ensureChat(this.chatId, [this.myUid, this.user.uid]);

      // chat meta listener (mute/pin)
      this.chatDocSub?.unsubscribe?.();
      this.chatDocSub = docData(doc(this.firestore, `chats/${this.chatId}`)).subscribe(
        (d: any) => {
          this.isMuted = !!d?.muted?.[this.myUid];
          this.isPinned = !!d?.pinned?.[this.myUid];
        }
      );

      // mark read
      await this.chatService.markAsRead(this.chatId, this.myUid);

      // realtime messages
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
  private scrollBottom(smooth = false) {
  try {
    const el = this.messagesBox?.nativeElement;
    if (!el) return;

    requestAnimationFrame(() => {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    });
  } catch {}
}


  closeAllMenus() {
    this.menuMessageId = null;
    this.selectedMessage = null;
    this.showHeaderMenu = false;
    this.showAttachMenu = false;
  }

  toggleHeaderMenu(e: MouseEvent) {
    e.stopPropagation();
    this.menuMessageId = null;
    this.selectedMessage = null;
    this.showAttachMenu = false;
    this.showHeaderMenu = !this.showHeaderMenu;
  }

  // =====================
  // ✅ ATTACH MENU
  // =====================
  toggleAttachMenu(e: MouseEvent) {
    e.stopPropagation();
    if (this.isBlocked || this.sendingFile) return;

    this.showHeaderMenu = false;
    this.menuMessageId = null;
    this.selectedMessage = null;

    this.showAttachMenu = !this.showAttachMenu;
  }

  chooseAttachType(type: AttachType) {
    if (this.isBlocked || this.sendingFile) return;

    this.attachType = type;
    this.showAttachMenu = false;

    const input = this.fileInput?.nativeElement;
    if (!input) return;

    input.value = '';

    if (type === 'image') {
      input.accept = 'image/*';
    } else {
      input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt';
    }

    input.click();
  }

  clearSelectedFile() {
    this.selectedFile = null;
    this.attachType = null;
    this.fileError = '';

    const input = this.fileInput?.nativeElement;
    if (input) input.value = '';
  }

  // =====================
  // MESSAGE MENU
  // =====================
  openMsgMenu(e: MouseEvent, m: ChatMessage) {
    e.stopPropagation();
    this.showHeaderMenu = false;
    this.showAttachMenu = false;

    if (!m?.id) return;

    // ✅ only my messages + not deleted
    if (m.senderId !== this.myUid || m.isDeleted) {
      this.menuMessageId = null;
      return;
    }

    const pad = 10;
    const menuW = 200;
    const menuH = 132;

    let x = e.clientX;
    let y = e.clientY;

    x = Math.max(pad, Math.min(x, window.innerWidth - menuW - pad));
    y = Math.max(pad, Math.min(y, window.innerHeight - menuH - pad));

    // ✅ mobile: center-bottom
    if (window.innerWidth <= 900) {
      x = Math.max(pad, (window.innerWidth - menuW) / 2);
      y = window.innerHeight - menuH - 110;
      y = Math.max(pad, y);
    }

    this.menuX = x;
    this.menuY = y;

    this.menuMessageId = m.id;
    this.selectedMessage = m;
  }

  // =====================
  // ✅ SEND (TEXT OR FILE)
  // =====================
  async send() {
    if (!this.myUid || !this.user?.uid) return;
    if (!this.chatId) return;
    if (this.isBlocked) return;

    // ✅ FILE SEND
    if (this.selectedFile) {
      try {
        this.sendingFile = true;
        this.fileError = '';

        await this.chatService.ensureChat(this.chatId, [this.myUid, this.user.uid]);

       await this.chatService.sendFileMessage(
          this.chatId,
          this.selectedFile,
          this.myUid,
          this.user.uid,
          this.attachType === 'image' ? 'image' : 'file',
          p => this.uploadPercent = p,
          (this.text || '').trim()
        );


        this.text = '';
        this.clearSelectedFile();
        setTimeout(() => this.scrollBottom(), 70);
      } catch (err: any) {
        console.error(err);
        this.fileError = err?.message || 'Upload failed';
      } finally {
        this.sendingFile = false;
      }

      return;
    }

    // ✅ NORMAL TEXT SEND
    const v = (this.text || '').trim();
    if (!v) return;

    try {
      await this.chatService.ensureChat(this.chatId, [this.myUid, this.user.uid]);
      await this.chatService.sendMessage(this.chatId, v, this.myUid, this.user.uid);
      this.text = '';
      setTimeout(() => this.scrollBottom(), 30);
    } catch (err) {
      console.error('🔥 send() failed:', err);
    }
  }

  // =====================
  // EDIT / DELETE
  // =====================
  clickEdit() {
    if (!this.selectedMessage?.id) return;
    this.editingId = this.selectedMessage.id;
    this.editingText = this.selectedMessage.text;
    this.menuMessageId = null;
    setTimeout(() => this.scrollBottom(), 80);
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

  // TIME FORMATTER ✅
  // =====================
  formatTime(ts: any): string {
    try {
      if (!ts) return '';
      const d = ts?.toDate ? ts.toDate() : new Date(ts);
      let h = d.getHours();
      const m = d.getMinutes();
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      h = h ? h : 12;
      const mm = m < 10 ? '0' + m : m;
      return `${h}:${mm} ${ampm}`;
    } catch {
      return '';
    }
  }

// PROFILE DRAWER

profileUser: AppUser | null = null;

async openProfileDrawer() {
  if (!this.user?.uid) return;

  this.showUserProfile = true;
  this.profileTab = 'media';

  // 🔥 Load real Firestore profile
  this.userService.getUser(this.user.uid).subscribe(u => {
    this.profileUser = u as AppUser;
  });

  this.profileLink = `chatloop://user/${this.user.uid}`;

  try {
    this.qrDataUrl = await QRCode.toDataURL(this.profileLink, {
      width: 240,
      margin: 1,
    });
  } catch {
    this.qrDataUrl = '';
  }

  this.contactUnsub?.();
  this.contactUnsub = this.contactService.listenContacts(
    this.myUid,
    list => {
      this.isContact = !!(list || []).find(
        (c: any) => c.uid === this.user.uid
      );
    }
  );
}

closeProfileDrawer() {
  this.showUserProfile = false;
  this.profileUser = null;
}


  // =====================
  // FILE PICK
  // =====================
  pickFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (this.attachType === 'image') {
      if (!file.type.startsWith('image/')) {
        this.fileError = '❌ Only image files allowed!';
        input.value = '';
        return;
      }
    }

    if (this.attachType === 'document') {
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
        this.fileError = '❌ Only document files allowed!';
        input.value = '';
        return;
      }
    }

    this.selectedFile = file;

    // ✅ scroll a bit so preview visible
    setTimeout(() => this.scrollBottom(), 80);
  }

    // =====================
    // IMAGE ZOOM
    // =====================
    zoomImage: string | null = null;

    openZoom(url: string) {
      this.zoomImage = url;
    }

    closeZoom() {
      this.zoomImage = null;
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
    this.chatService.setOnline(this.myUid, false);
  }
  typing() {
  if (!this.chatId) return;

  this.chatService.setTyping(this.myUid, this.chatId);

  clearTimeout((this as any)._typingTimer);
  (this as any)._typingTimer = setTimeout(() => {
    this.chatService.setTyping(this.myUid, null);
  }, 1200);
}

}