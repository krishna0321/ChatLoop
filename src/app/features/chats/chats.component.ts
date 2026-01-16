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

  // ✅ all users (but we show only when searching)
  allUsers: AppUser[] = [];
  filteredUsers: AppUser[] = [];

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

  private _filterTimer: any = null;

  constructor(
    private auth: Auth,
    private chatService: ChatService,
    private userService: UserService,
    private roomService: RoomService,
    private route: ActivatedRoute
  ) {}

  // ✅ Telegram style: People list only when searching
  shouldShowPeople(): boolean {
    return (this.searchText || '').trim().length > 0;
  }

  // ✅ stable filtering (prevents flicker)
  private scheduleFilter() {
    clearTimeout(this._filterTimer);
    this._filterTimer = setTimeout(() => {
      this.applyFilter();
    }, 50);
  }

  ngOnInit(): void {
    this.checkMobile();

    this.unsubAuth = onAuthStateChanged(this.auth, (u) => {
      if (!u) return;

      this.myUid = u.uid;

      // ✅ my user doc for blocked list
      this.meSub = this.userService.getUser(this.myUid).subscribe((me: any) => {
        this.blockedUids = me?.blocked || [];
        this.scheduleFilter();
      });

      // ✅ users list (ALL USERS)
      this.usersSub = this.userService.getUsers().subscribe((users: AppUser[]) => {
        const safeUsers = users || [];

        this.usersMap.clear();
        safeUsers.forEach((us) => this.usersMap.set(us.uid, us));

        // ✅ store all users except me + blocked
        this.allUsers = safeUsers.filter((u) => {
          if (!u?.uid) return false;
          if (u.uid === this.myUid) return false;
          if ((this.blockedUids || []).includes(u.uid)) return false;
          return true;
        });

        this.scheduleFilter();
      });

      // ✅ DM Chats
      this.unsubDm = this.chatService.listenMyChats(this.myUid, (data: any[]) => {
        this.dmChats = (data || []).map((c) => ({ ...c, type: 'dm' as ListItemType }));
        this.scheduleFilter();
      });

      // ✅ Rooms (Groups / Channels)
      this.unsubRooms = this.roomService.listenMyRooms(this.myUid, (data: any[]) => {
        this.rooms = (data || []).map((r) => ({
          ...r,
          type: (r.type || 'group') as ListItemType,
        }));
        this.scheduleFilter();
      });

      // ✅ open from url (?uid=xxx or ?room=xxx)
      this.qpSub = this.route.queryParamMap.subscribe(async (p) => {
        const uid = p.get('uid');
        const roomId = p.get('room');

        if (uid) await this.openDmByUid(uid);
        if (roomId) this.openRoomById(roomId);
      });
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this._filterTimer);

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
    if (this.menuRoomId) this.menuRoomId = null;
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

    // ✅ chats + rooms list
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

    // ✅ filter chats/rooms
    this.filteredRooms = t
      ? list.filter((x) => {
          const name = this.getRoomTitle(x).toLowerCase();
          const last = (x.lastMessage || '').toLowerCase();
          return name.includes(t) || last.includes(t);
        })
      : list;

    // ✅ People only visible when searching
    const basePeopleUsers = this.shouldShowPeople() ? [...this.allUsers] : [];

    // filter people
    this.filteredUsers = t
      ? basePeopleUsers.filter((u) => {
          const name = (u.name || '').toLowerCase();
          const email = (u.email || '').toLowerCase();
          const phone = (u.phone || '').toLowerCase();
          return name.includes(t) || email.includes(t) || phone.includes(t);
        })
      : basePeopleUsers;
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

    this.selectedUser = null;
    this.selectedRoomId = null;

    if (item?.type === 'group' || item?.type === 'channel') {
      this.selectedRoomId = item.id;
    } else {
      const otherUid = this.getOtherUid(item);
      this.selectedUser = otherUid ? this.usersMap.get(otherUid) || null : null;

      // ✅ ensure chat exists
      if (otherUid) {
        const chatId = this.chatService.getChatId(this.myUid, otherUid);
        this.chatService.ensureChat(chatId, [this.myUid, otherUid]);
      }
    }

    if (this.isMobile) this.mobileListOpen = false;
  }

  // ✅ start DM from People list
  async startDmWithUser(user: AppUser) {
    if (!user?.uid || !this.myUid) return;

    const chatId = this.chatService.getChatId(this.myUid, user.uid);

    await this.chatService.ensureChat(chatId, [this.myUid, user.uid]);

    this.selectedRoomId = null;
    this.selectedUser = user;

    // ✅ clear search to hide people again
    this.searchText = '';
    this.applyFilter();

    if (this.isMobile) this.mobileListOpen = false;
  }

  // ✅ open DM from URL
  private async openDmByUid(uid: string) {
    if (!uid || !this.myUid) return;

    const chatId = this.chatService.getChatId(this.myUid, uid);

    await this.chatService.ensureChat(chatId, [this.myUid, uid]);

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
