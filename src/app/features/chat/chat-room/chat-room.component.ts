import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';

import { Room, RoomMessage, RoomService } from '../../../core/services/room.service';
import { UserService } from '../../../core/services/user.service';

type AttachType = 'image' | 'document';

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.css'],
})
export class ChatRoomComponent implements OnInit, OnDestroy {
  @Input() roomId: string = '';

  @ViewChild('messagesBox') messagesBox!: ElementRef<HTMLDivElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  myUid = '';

  room: Room | null = null;
  messages: RoomMessage[] = [];

  // ✅ UI state
  showHeaderMenu = false;
  isMuted = false;
  isPinned = false;
  isOwner = false;

  // ✅ message menu
  menuMessageId: string | null = null;
  menuX = 0;
  menuY = 0;
  menuMsg: any = null;

  // ✅ edit
  editingId: string | null = null;
  editingText = '';

  // composer
  text = '';

  // ✅ upload
  showAttachMenu = false;
  attachType: AttachType = 'image';
  selectedFile: File | null = null;
  sendingFile = false;
  fileError = '';

  // ✅ users map
  usersMap = new Map<string, any>();

  private unsubAuth: any;
  private unsubRoom: any;
  private unsubMsgs: any;
  private usersSub: any;

  constructor(
    private auth: Auth,
    private roomService: RoomService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    // ✅ load users for sender names
    this.usersSub = this.userService.getUsers().subscribe((users: any[]) => {
      this.usersMap.clear();
      (users || []).forEach((u) => this.usersMap.set(u.uid, u));
    });

    this.unsubAuth = onAuthStateChanged(this.auth, (u) => {
      if (!u) return;
      this.myUid = u.uid;

      if (!this.roomId) return;
      this.listenRoom();
      this.listenMessages();
    });
  }

  ngOnDestroy(): void {
    if (this.unsubAuth) this.unsubAuth();
    if (this.unsubRoom) this.unsubRoom();
    if (this.unsubMsgs) this.unsubMsgs();
    if (this.usersSub) this.usersSub.unsubscribe?.();
  }

  // ============================
  // ✅ LISTEN ROOM
  // ============================
  private listenRoom() {
    this.unsubRoom = this.roomService.listenRoom(this.roomId, (r) => {
      this.room = r;

      // permissions
      this.isOwner = r?.ownerId === this.myUid;

      // local states
      this.isMuted = !!r?.muted?.[this.myUid];
      this.isPinned = !!r?.pinned?.[this.myUid];

      // mark read
      if (this.roomId && this.myUid) {
        this.roomService.markAsRead(this.roomId, this.myUid);
      }
    });
  }

  private listenMessages() {
    this.unsubMsgs = this.roomService.listenRoomMessages(this.roomId, (msgs) => {
      this.messages = msgs || [];
      setTimeout(() => this.scrollToBottom(), 30);
    });
  }

  private scrollToBottom() {
    try {
      const el = this.messagesBox?.nativeElement;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    } catch {}
  }

  // ============================
  // ✅ UI
  // ============================
  closeAllMenus() {
    this.showHeaderMenu = false;
    this.showAttachMenu = false;

    this.menuMessageId = null;
    this.menuMsg = null;

    // keep editing only if want, else close it too
    // this.editingId = null;
    // this.editingText = '';
  }

  toggleHeaderMenu(event: MouseEvent) {
    event.stopPropagation();
    this.showHeaderMenu = !this.showHeaderMenu;
    this.menuMessageId = null;
    this.showAttachMenu = false;
  }

  // ============================
  // ✅ Attach Menu
  // ============================
  toggleAttachMenu(e: MouseEvent) {
    e.stopPropagation();
    this.showAttachMenu = !this.showAttachMenu;
    this.showHeaderMenu = false;
    this.menuMessageId = null;
  }

  chooseAttachType(type: AttachType) {
    this.attachType = type;
    this.showAttachMenu = false;

    const input = this.fileInput?.nativeElement;
    if (!input) return;

    if (type === 'image') {
      input.accept = 'image/*';
    } else {
      input.accept =
        '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt,application/pdf';
    }

    input.click();
  }

  async pickFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.fileError = '';

    // ✅ strict validation
    if (this.attachType === 'image' && !(file.type || '').startsWith('image/')) {
      this.fileError = 'Only image allowed';
      input.value = '';
      return;
    }

    if (this.attachType === 'document') {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const allowed = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar', 'txt'];

      if (!allowed.includes(ext)) {
        this.fileError = 'Only document allowed';
        input.value = '';
        return;
      }
    }

    this.selectedFile = file;
    input.value = '';
  }

  clearSelectedFile() {
    this.selectedFile = null;
    this.fileError = '';
  }

  // ============================
  // ✅ MENU actions (Mute / Pin)
  // ============================
  async toggleMute() {
    if (!this.roomId || !this.myUid) return;
    await this.roomService.muteRoom(this.roomId, this.myUid, !this.isMuted);
    this.showHeaderMenu = false;
  }

  async togglePin() {
    if (!this.roomId || !this.myUid) return;
    await this.roomService.pinRoom(this.roomId, this.myUid, !this.isPinned);
    this.showHeaderMenu = false;
  }

  // ============================
  // ✅ GROUP actions
  // ============================
  async leaveGroup() {
    if (!this.roomId || !this.myUid) return;
    const ok = confirm('Leave this group?');
    if (!ok) return;

    await this.roomService.leaveRoom(this.roomId, this.myUid);
    this.showHeaderMenu = false;
  }

  async deleteGroupForever() {
    if (!this.roomId) return;
    if (!this.isOwner) {
      alert('Only owner can delete group forever.');
      return;
    }

    const ok = confirm('Delete group forever? This deletes chat for everyone!');
    if (!ok) return;

    await this.roomService.deleteRoomWithMessages(this.roomId);
    this.showHeaderMenu = false;
  }

  // ============================
  // ✅ message menu
  // ============================
  openMsgMenu(event: MouseEvent, msg: any) {
    event.stopPropagation();

    this.menuMessageId = msg?.id || null;
    this.menuMsg = msg;

    const pad = 10;
    const menuW = 190;
    const menuH = 130;

    let x = event.clientX;
    let y = event.clientY;

    x = Math.max(pad, Math.min(x, window.innerWidth - menuW - pad));
    y = Math.max(pad, Math.min(y, window.innerHeight - menuH - pad));

    this.menuX = x;
    this.menuY = y;

    this.showHeaderMenu = false;
    this.showAttachMenu = false;
  }

  clickEdit() {
    if (!this.menuMsg?.id) return;
    if (this.menuMsg.senderId !== this.myUid) {
      alert('You can only edit your message.');
      return;
    }

    this.editingId = this.menuMsg.id;
    this.editingText = this.menuMsg.text || '';
    this.menuMessageId = null;
  }

  async clickDelete() {
    if (!this.menuMsg?.id) return;
    if (this.menuMsg.senderId !== this.myUid) {
      alert('You can only delete your message.');
      return;
    }

    const ok = confirm('Delete this message?');
    if (!ok) return;

    await this.roomService.deleteRoomMessage(this.roomId, this.menuMsg.id);

    this.menuMessageId = null;
  }

  cancelEdit() {
    this.editingId = null;
    this.editingText = '';
  }

  async saveEdit() {
    if (!this.editingId) return;

    const v = (this.editingText || '').trim();
    if (!v) return;

    await this.roomService.editRoomMessage(this.roomId, this.editingId, v);

    this.cancelEdit();
  }

  // ============================
  // ✅ send message
  // ============================
  async send() {
    if (!this.roomId || !this.myUid) return;

    // ✅ if file selected: upload and send file message
    if (this.selectedFile) {
      try {
        this.sendingFile = true;
        this.fileError = '';

        const type = this.attachType === 'image' ? 'image' : 'file';
        const caption = (this.text || '').trim(); // caption for image

        await this.roomService.sendRoomFileMessage(
          this.roomId,
          this.selectedFile,
          this.myUid,
          type,
          caption
        );

        this.selectedFile = null;
        this.text = '';
        setTimeout(() => this.scrollToBottom(), 50);
      } catch (err: any) {
        console.error(err);
        this.fileError = err?.message || 'Upload failed';
      } finally {
        this.sendingFile = false;
      }
      return;
    }

    // ✅ normal text message
    const t = (this.text || '').trim();
    if (!t) return;

    await this.roomService.sendRoomMessage(this.roomId, {
      text: t,
      senderId: this.myUid,
    });

    this.text = '';
    setTimeout(() => this.scrollToBottom(), 30);
  }

  // ============================
  // ✅ helpers
  // ============================
  getSenderName(uid: string) {
    const u = this.usersMap.get(uid);
    return u?.name || u?.email || 'User';
  }

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
}
