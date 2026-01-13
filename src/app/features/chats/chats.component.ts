import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { ActivatedRoute } from '@angular/router';

import { ChatService } from '../../core/services/chat.service';
import { UserService, AppUser } from '../../core/services/user.service';
import { ChatComponent } from '../chat/chat.component';

@Component({
  selector: 'app-chats',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatComponent],
  templateUrl: './chats.component.html',
  styleUrls: ['./chats.component.css'],
})
export class ChatsComponent implements OnInit, OnDestroy {
  myUid = '';
  myUser: AppUser | null = null;
  blockedUids: string[] = [];

  chats: any[] = [];
  filteredChats: any[] = [];

  usersMap = new Map<string, AppUser>();

  searchText = '';
  selectedChatId: string | null = null;
  selectedUser: AppUser | null = null;

  menuChatId: string | null = null;

  // ✅ mobile sidebar open/close
  mobileListOpen = true;

  private unsubAuth: any;
  private unsubChats: any;
  private usersSub: any;
  private meSub: any;
  private qpSub: any;

  constructor(
    private auth: Auth,
    private chatService: ChatService,
    private userService: UserService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.unsubAuth = onAuthStateChanged(this.auth, (u) => {
      if (!u) return;
      this.myUid = u.uid;

      this.meSub = this.userService.getUser(this.myUid).subscribe((me) => {
        this.myUser = me;
        this.blockedUids = me?.blocked || [];
      });

      this.usersSub = this.userService.getUsers().subscribe((users) => {
        this.usersMap.clear();
        (users || []).forEach((us) => this.usersMap.set(us.uid, us));
        this.applyFilter();
      });

      this.unsubChats = this.chatService.listenMyChats(this.myUid, (data) => {
        this.chats = data || [];
        this.applyFilter();
      });

      // ✅ handle query params live (uid=xxx) or (room=xxx)
      this.qpSub = this.route.queryParamMap.subscribe((p) => {
        const uidFromUrl = p.get('uid');
        if (uidFromUrl) this.openChatByUid(uidFromUrl);

        // (optional) if you use room chats
        const roomFromUrl = p.get('room');
        if (roomFromUrl) this.openRoomChat(roomFromUrl);
      });
    });
  }

  ngOnDestroy(): void {
    if (this.unsubAuth) this.unsubAuth();
    if (this.unsubChats) this.unsubChats();
    if (this.usersSub) this.usersSub.unsubscribe?.();
    if (this.meSub) this.meSub.unsubscribe?.();
    if (this.qpSub) this.qpSub.unsubscribe?.();
  }

  // ======================
  // UI
  // ======================
  openMenu(event: MouseEvent, chatDoc: any) {
    event.stopPropagation();
    this.menuChatId = this.menuChatId === chatDoc.id ? null : chatDoc.id;
  }

  closeMenu() {
    this.menuChatId = null;
  }

  closeAll() {
    this.menuChatId = null;
  }

  // ======================
  // Search / Filter / Sort
  // ======================
  applyFilter() {
    const t = this.searchText.trim().toLowerCase();

    let list = [...this.chats];

    // ✅ sort pinned first then updatedAt
    list.sort((a, b) => {
      const ap = this.isPinned(a) ? 1 : 0;
      const bp = this.isPinned(b) ? 1 : 0;
      if (ap !== bp) return bp - ap;

      const at = this.getTimeValue(a.updatedAt);
      const bt = this.getTimeValue(b.updatedAt);
      return bt - at;
    });

    if (!t) {
      this.filteredChats = list;
      return;
    }

    this.filteredChats = list.filter((c) => {
      const name = this.getChatName(c).toLowerCase();
      const last = (c.lastMessage || '').toLowerCase();
      return name.includes(t) || last.includes(t);
    });
  }

  // ======================
  // Helpers
  // ======================
  getOtherUid(chatDoc: any): string {
    return (chatDoc.users || []).find((x: string) => x !== this.myUid) || '';
  }

  getChatName(chatDoc: any): string {
    const otherUid = this.getOtherUid(chatDoc);
    const u = otherUid ? this.usersMap.get(otherUid) : null;
    return u?.name || u?.email || 'Unknown';
  }

  getPreviewText(chatDoc: any): string {
    const msg = chatDoc.lastMessage || '';
    if (!msg) return 'No messages yet...';
    if (chatDoc.lastSenderId === this.myUid) return `You: ${msg}`;
    return msg;
  }

  getUnread(chatDoc: any): number {
    return Number(chatDoc?.unread?.[this.myUid] || 0);
  }

  isMuted(chatDoc: any): boolean {
    return !!chatDoc?.muted?.[this.myUid];
  }

  isPinned(chatDoc: any): boolean {
    return !!chatDoc?.pinned?.[this.myUid];
  }

  isBlockedChat(chatDoc: any): boolean {
    const otherUid = this.getOtherUid(chatDoc);
    return !!otherUid && this.blockedUids.includes(otherUid);
  }

  // ======================
  // Chat open
  // ======================
  openChat(chatDoc: any) {
    this.closeMenu();
    this.selectedChatId = chatDoc.id;

    const otherUid = this.getOtherUid(chatDoc);
    this.selectedUser = otherUid ? this.usersMap.get(otherUid) || null : null;

    // ✅ on mobile: close list after selecting chat
    this.mobileListOpen = false;
  }

  openChatByUid(otherUid: string) {
    if (!otherUid || !this.myUid) return;

    const chatId = this.chatService.getChatId(this.myUid, otherUid);
    const fake = { id: chatId, users: [this.myUid, otherUid] };
    this.openChat(fake);
  }

  // (optional) if you use room chats later
  openRoomChat(roomId: string) {
    // You can implement Rooms later. For now we just show empty.
    console.log('Room chat open:', roomId);
  }

  backToList() {
    this.mobileListOpen = true;
  }

  // ======================
  // Actions
  // ======================
  async toggleMute(chatDoc: any) {
    await (this.chatService as any).muteChat?.(
      chatDoc.id,
      this.myUid,
      !this.isMuted(chatDoc)
    );
    this.closeMenu();
  }

  async togglePin(chatDoc: any) {
    await (this.chatService as any).pinChat?.(
      chatDoc.id,
      this.myUid,
      !this.isPinned(chatDoc)
    );
    this.closeMenu();
  }

  async toggleBlock(chatDoc: any) {
    const otherUid = this.getOtherUid(chatDoc);
    if (!otherUid) return;

    const isBlocked = this.blockedUids.includes(otherUid);

    if (!isBlocked) {
      const ok = confirm('Block this user?');
      if (!ok) return;
      await this.userService.blockUser(this.myUid, otherUid);
    } else {
      await this.userService.unblockUser(this.myUid, otherUid);
    }

    this.closeMenu();
  }

  // ======================
  // Date utils
  // ======================
  getTimeValue(ts: any): number {
    try {
      if (!ts) return 0;
      const d = ts.toDate ? ts.toDate() : new Date(ts);
      return d.getTime();
    } catch {
      return 0;
    }
  }

  formatTime(ts: any): string {
    try {
      if (!ts) return '';
      const d = ts.toDate ? ts.toDate() : new Date(ts);
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
