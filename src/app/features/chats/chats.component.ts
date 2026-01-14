import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';

import { ChatService } from '../../core/services/chat.service';
import { AppUser, UserService } from '../../core/services/user.service';
import { RoomService } from '../../core/services/room.service';

import { ChatComponent } from '../chat/chat.component';
import { ChatRoomComponent } from '../chat/chat-room/chat-room.component';

type ListItemType = 'dm' | 'group' | 'channel';

@Component({
  selector: 'app-chats',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ChatComponent, ChatRoomComponent],
  templateUrl: './chats.component.html',
  styleUrls: ['./chats.component.css'],
})
export class ChatsComponent implements OnInit, OnDestroy {
  myUid = '';
  blockedUids: string[] = [];

  // ✅ USERS MAP
  usersMap = new Map<string, AppUser>();

  // ✅ chats list
  dmChats: any[] = [];
  rooms: any[] = [];

  filteredRooms: any[] = [];

  searchText = '';

  // selected
  selectedUser: AppUser | null = null;
  selectedRoomId: string | null = null;

  // menu dropdown
  menuRoomId: string | null = null;

  // mobile
  isMobile = false;
  mobileListOpen = true;

  private unsubAuth: any;
  private unsubDm: any;
  private unsubRooms: any;

  private meSub: any;
  private usersSub: any;
  private qpSub: any;

  constructor(
    private auth: Auth,
    private chatService: ChatService,
    private userService: UserService,
    private roomService: RoomService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.checkMobile();

    this.unsubAuth = onAuthStateChanged(this.auth, (u) => {
      if (!u) return;

      this.myUid = u.uid;

      // ✅ my user doc for blocked list
      this.meSub = this.userService.getUser(this.myUid).subscribe((me: any) => {
        this.blockedUids = me?.blocked || [];
      });

      // ✅ users list
      this.usersSub = this.userService.getUsers().subscribe((users: AppUser[]) => {
        this.usersMap.clear();
        (users || []).forEach((us) => this.usersMap.set(us.uid, us));
        this.applyFilter();
      });

      // ✅ DM Chats
      this.unsubDm = this.chatService.listenMyChats(this.myUid, (data: any[]) => {
        this.dmChats = (data || []).map((c) => ({ ...c, type: 'dm' as ListItemType }));
        this.applyFilter();
      });

      // ✅ Rooms (Groups / Channels)
      this.unsubRooms = this.roomService.listenMyRooms(this.myUid, (data: any[]) => {
        this.rooms = (data || []).map((r) => ({
          ...r,
          type: (r.type || 'group') as ListItemType,
        }));
        this.applyFilter();
      });

      // ✅ open from url
      this.qpSub = this.route.queryParamMap.subscribe((p) => {
        const uid = p.get('uid');
        if (uid) this.openDmByUid(uid);

        const roomId = p.get('room');
        if (roomId) this.openRoomById(roomId);
      });
    });
  }

  ngOnDestroy(): void {
    if (this.unsubAuth) this.unsubAuth();
    if (this.unsubDm) this.unsubDm();
    if (this.unsubRooms) this.unsubRooms();
    if (this.meSub) this.meSub.unsubscribe?.();
    if (this.usersSub) this.usersSub.unsubscribe?.();
    if (this.qpSub) this.qpSub.unsubscribe?.();
  }

  // ======================
  // ✅ Mobile
  // ======================
  @HostListener('window:resize')
  checkMobile() {
    this.isMobile = window.innerWidth <= 900;
    if (!this.isMobile) this.mobileListOpen = true;
  }

  backToList() {
    this.mobileListOpen = true;
  }

  // ======================
  // ✅ UI functions for HTML
  // ======================
  closeAll() {
    this.menuRoomId = null;
  }

  openMenu(event: MouseEvent, item: any) {
    event.stopPropagation();
    this.menuRoomId = this.menuRoomId === item.id ? null : item.id;
  }

  // ======================
  // ✅ Filtering
  // ======================
  applyFilter() {
    const t = (this.searchText || '').trim().toLowerCase();

    let list = [...this.rooms, ...this.dmChats];

    // pinned first, then updated
    list.sort((a, b) => {
      const ap = this.isPinned(a) ? 1 : 0;
      const bp = this.isPinned(b) ? 1 : 0;
      if (ap !== bp) return bp - ap;

      const at = this.getTimeValue(a.updatedAt);
      const bt = this.getTimeValue(b.updatedAt);
      return bt - at;
    });

    if (!t) {
      this.filteredRooms = list;
      return;
    }

    this.filteredRooms = list.filter((x) => {
      const name = this.getRoomTitle(x).toLowerCase();
      const last = (x.lastMessage || '').toLowerCase();
      return name.includes(t) || last.includes(t);
    });
  }

  // ======================
  // ✅ Template helpers
  // ======================
  getOtherUid(dm: any): string {
    return (dm?.users || []).find((x: string) => x !== this.myUid) || '';
  }

  getRoomTitle(item: any): string {
    if (item?.type === 'group') return item?.name || 'Group';
    if (item?.type === 'channel') return item?.name || 'Channel';

    // dm
    const otherUid = this.getOtherUid(item);
    const u = otherUid ? this.usersMap.get(otherUid) : null;
    return u?.name || u?.email || 'Unknown';
  }

  // ✅ IMPORTANT: your HTML calls getPreviewText()
  getPreviewText(item: any): string {
    const msg = item?.lastMessage || '';
    if (!msg) return 'No messages yet...';
    if (item?.lastSenderId === this.myUid) return `You: ${msg}`;
    return msg;
  }

  getUnread(item: any): number {
    return Number(item?.unread?.[this.myUid] || 0);
  }

  isMuted(item: any): boolean {
    return !!item?.muted?.[this.myUid];
  }

  isPinned(item: any): boolean {
    return !!item?.pinned?.[this.myUid];
  }

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

  // ======================
  // ✅ Open DM / Room
  // ======================
  openRoom(item: any) {
    this.closeAll();

    // reset
    this.selectedUser = null;
    this.selectedRoomId = null;

    if (item?.type === 'group' || item?.type === 'channel') {
      this.selectedRoomId = item.id;
    } else {
      const otherUid = this.getOtherUid(item);
      this.selectedUser = otherUid ? this.usersMap.get(otherUid) || null : null;
    }

    if (this.isMobile) this.mobileListOpen = false;
  }

  private openDmByUid(uid: string) {
    if (!uid || !this.myUid) return;
    const chatId = this.chatService.getChatId(this.myUid, uid);
    this.openRoom({ id: chatId, users: [this.myUid, uid], type: 'dm' });
  }

  private openRoomById(roomId: string) {
    if (!roomId) return;
    this.openRoom({ id: roomId, type: 'group' });
  }

  // ======================
  // ✅ actions
  // ======================
  async toggleMute(item: any) {
    if (item?.type === 'group' || item?.type === 'channel') {
      await this.roomService.muteRoom(item.id, this.myUid, !this.isMuted(item));
    } else {
      await this.chatService.muteChat(item.id, this.myUid, !this.isMuted(item));
    }
    this.closeAll();
  }

  async togglePin(item: any) {
    if (item?.type === 'group' || item?.type === 'channel') {
      await this.roomService.pinRoom(item.id, this.myUid, !this.isPinned(item));
    } else {
      await this.chatService.pinChat(item.id, this.myUid, !this.isPinned(item));
    }
    this.closeAll();
  }
}
