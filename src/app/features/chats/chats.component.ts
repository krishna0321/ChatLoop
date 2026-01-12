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
  template: `
    <div class="layout" (click)="closeMenu()">

      <!-- LEFT -->
      <aside class="sidebar" (click)="$event.stopPropagation()">
        <div class="top">
          <div class="logoRow">
            <div class="logo">Chatloop</div>
            <div class="tag">Telegram UI</div>
          </div>

          <input
            class="search"
            [(ngModel)]="searchText"
            (input)="applyFilter()"
            placeholder="Search chats..."
          />
        </div>

        <div class="list">
          <div
            *ngFor="let c of filteredChats"
            class="item"
            [class.active]="selectedChatId === c.id"
            (click)="openChat(c)"
          >
            <div class="avatar">{{ getChatName(c)[0] || 'U' }}</div>

            <div class="info">
              <div class="row">
                <div class="name">{{ getChatName(c) }}</div>
                <div class="time">{{ formatTime(c.updatedAt) }}</div>
              </div>

              <div class="row2">
                <div class="preview">{{ getPreviewText(c) }}</div>

                <div class="right">
                  <span *ngIf="isPinned(c)" class="icon">📌</span>
                  <span *ngIf="isMuted(c)" class="icon">🔕</span>

                  <div *ngIf="getUnread(c) > 0" class="badge">
                    {{ getUnread(c) }}
                  </div>
                </div>
              </div>
            </div>

            <button class="more" (click)="openMenu($event, c)">⋮</button>

            <div class="dropdown" *ngIf="menuChatId === c.id" (click)="$event.stopPropagation()">
              <button (click)="toggleMute(c)">
                {{ isMuted(c) ? 'Unmute' : 'Mute' }}
              </button>

              <button (click)="togglePin(c)">
                {{ isPinned(c) ? 'Unpin' : 'Pin' }}
              </button>

              <button class="danger" (click)="toggleBlock(c)">
                {{ isBlockedChat(c) ? 'Unblock' : 'Block' }}
              </button>
            </div>
          </div>

          <div *ngIf="filteredChats.length === 0" class="emptyLeft">
            No chats found
          </div>
        </div>
      </aside>

      <!-- RIGHT -->
      <main class="content">
        <ng-container *ngIf="selectedUser; else empty">
          <app-chat [user]="selectedUser"></app-chat>
        </ng-container>

        <ng-template #empty>
          <div class="empty">
            <div class="iconBig">💬</div>
            <div class="t1">Select a chat</div>
            <div class="t2">Choose from the left panel</div>
          </div>
        </ng-template>
      </main>

    </div>
  `,
  styles: [`
    :host{ display:flex; flex:1; width:100%; height:100%; min-width:0; overflow:hidden; }

    .layout{
      width:100%;
      height:100%;
      display:flex;
      overflow:hidden;
      background:#020617;
    }

    /* left */
    .sidebar{
      width:340px;
      flex-shrink:0;
      border-right:1px solid rgba(255,255,255,0.06);
      background: rgba(2,6,23,0.95);
      display:flex;
      flex-direction:column;
      overflow:hidden;
    }

    .top{
      padding:14px;
      border-bottom:1px solid rgba(255,255,255,0.06);
      background: rgba(15,23,42,0.65);
      backdrop-filter: blur(10px);
    }

    .logoRow{ display:flex; align-items:center; gap:10px; }
    .logo{ font-size:18px; font-weight:900; color:#fff; }
    .tag{
      font-size:11px;
      opacity:.7;
      padding:2px 8px;
      border-radius:999px;
      border:1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.06);
      color:#fff;
    }

    .search{
      margin-top:12px;
      width:100%;
      height:42px;
      border-radius:14px;
      padding:0 14px;
      border:1px solid rgba(255,255,255,0.12);
      background: rgba(2,6,23,0.6);
      color:white;
      outline:none;
    }

    .list{
      flex:1;
      overflow:auto;
      padding:8px;
    }

    .item{
      position:relative;
      display:flex;
      gap:12px;
      padding:10px;
      border-radius:16px;
      cursor:pointer;
      color:white;
      border:1px solid transparent;
      transition:.15s;
      align-items:center;
    }

    .item:hover{ background: rgba(255,255,255,0.05); }
    .item.active{
      background: rgba(37,99,235,0.16);
      border:1px solid rgba(37,99,235,0.30);
    }

    .avatar{
      width:44px; height:44px;
      border-radius:50%;
      background: linear-gradient(135deg,#2563eb,#60a5fa);
      display:grid; place-items:center;
      font-weight:900;
      flex-shrink:0;
      text-transform:uppercase;
    }

    .info{ flex:1; min-width:0; }
    .row{ display:flex; justify-content:space-between; align-items:center; gap:10px; }
    .row2{ margin-top:4px; display:flex; justify-content:space-between; align-items:center; gap:10px; }

    .name{
      font-weight:900;
      font-size:14px;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
    }

    .time{ font-size:11px; opacity:.55; flex-shrink:0; }

    .preview{
      font-size:12px;
      opacity:.70;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
      max-width: 160px;
    }

    .right{ display:flex; align-items:center; gap:8px; flex-shrink:0; }
    .icon{ font-size:12px; opacity:.85; }

    .badge{
      min-width:22px;
      height:22px;
      border-radius:999px;
      display:grid;
      place-items:center;
      font-size:12px;
      font-weight:900;
      background: rgba(37,99,235,0.95);
      color:white;
      padding:0 7px;
    }

    .more{
      width:30px;
      height:30px;
      border-radius:12px;
      border:1px solid rgba(255,255,255,0.10);
      background: rgba(255,255,255,0.06);
      color:white;
      cursor:pointer;
      font-weight:900;
      flex-shrink:0;
      opacity:.85;
    }
    .more:hover{ opacity:1; }

    .dropdown{
      position:absolute;
      right: 10px;
      top: 48px;
      z-index: 50;
      width: 160px;
      display:flex;
      flex-direction:column;
      gap:6px;
      padding:8px;
      border-radius:14px;
      background: rgba(2,6,23,0.95);
      border:1px solid rgba(255,255,255,0.12);
      box-shadow: 0 20px 50px rgba(0,0,0,.6);
    }

    .dropdown button{
      height:34px;
      border:none;
      border-radius:12px;
      background: rgba(255,255,255,0.10);
      color:white;
      font-weight:900;
      cursor:pointer;
      text-align:left;
      padding:0 12px;
    }
    .dropdown button.danger{
      background: rgba(255,0,0,0.18);
      border:1px solid rgba(255,0,0,0.20);
    }

    /* right */
    .content{
      flex:1;
      min-width:0;
      display:flex;
      overflow:hidden;
      background: rgba(2,6,23,0.7);
    }

    .empty{
      margin:auto;
      text-align:center;
      color:white;
      opacity:.85;
    }
    .iconBig{ font-size:44px; }
    .t1{ margin-top:8px; font-weight:900; font-size:20px; }
    .t2{ margin-top:6px; font-size:13px; opacity:.7; }

    .emptyLeft{
      text-align:center;
      opacity:.6;
      padding: 20px 0;
    }
  `]
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

  private unsubAuth: any;
  private unsubChats: any;
  private usersSub: any;
  private meSub: any;

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
        users.forEach(us => this.usersMap.set(us.uid, us));
      });

      this.unsubChats = this.chatService.listenMyChats(this.myUid, (data) => {
        this.chats = data || [];
        this.applyFilter();

        // open chat from url
        const uidFromUrl = this.route.snapshot.queryParamMap.get('uid');
        if (uidFromUrl) {
          const chatId = this.chatService.getChatId(this.myUid, uidFromUrl);
          const fake = { id: chatId, users: [this.myUid, uidFromUrl] };
          this.openChat(fake);
        }
      });
    });
  }

  ngOnDestroy(): void {
    if (this.unsubAuth) this.unsubAuth();
    if (this.unsubChats) this.unsubChats();
    if (this.usersSub) this.usersSub.unsubscribe?.();
    if (this.meSub) this.meSub.unsubscribe?.();
  }

  openMenu(event: MouseEvent, chatDoc: any) {
    event.stopPropagation();
    this.menuChatId = this.menuChatId === chatDoc.id ? null : chatDoc.id;
  }

  closeMenu() {
    this.menuChatId = null;
  }

  applyFilter() {
    const t = this.searchText.trim().toLowerCase();
    if (!t) this.filteredChats = [...this.chats];
    else {
      this.filteredChats = this.chats.filter(c => {
        const name = this.getChatName(c).toLowerCase();
        const last = (c.lastMessage || '').toLowerCase();
        return name.includes(t) || last.includes(t);
      });
    }
  }

  getOtherUid(chatDoc: any): string {
    return (chatDoc.users || []).find((x: string) => x !== this.myUid) || '';
  }

  openChat(chatDoc: any) {
    this.closeMenu();
    this.selectedChatId = chatDoc.id;

    const otherUid = this.getOtherUid(chatDoc);
    this.selectedUser = otherUid ? (this.usersMap.get(otherUid) || null) : null;
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

  async toggleMute(chatDoc: any) {
    await (this.chatService as any).muteChat?.(chatDoc.id, this.myUid, !this.isMuted(chatDoc));
    this.closeMenu();
  }

  async togglePin(chatDoc: any) {
    await (this.chatService as any).pinChat?.(chatDoc.id, this.myUid, !this.isPinned(chatDoc));
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

  formatTime(ts: any): string {
    try {
      if (!ts) return '';
      const d = ts.toDate ? ts.toDate() : new Date(ts);
      let h = d.getHours();
      const m = d.getMinutes();
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12; h = h ? h : 12;
      const mm = m < 10 ? '0' + m : m;
      return `${h}:${mm} ${ampm}`;
    } catch {
      return '';
    }
  }
}
