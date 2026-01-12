import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';

import { ChatService } from '../../core/services/chat.service';
import { UserService, AppUser } from '../../core/services/user.service';
import { ChatComponent } from '../chat/chat.component';

@Component({
  selector: 'app-chats',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatComponent],
  template: `
    <div class="layout">

      <!-- ✅ LEFT LIST -->
      <div class="sidebar">
        <div class="top">
          <div class="logo">Chatloop</div>

          <input
            class="search"
            [(ngModel)]="searchText"
            (input)="applyFilter()"
            placeholder="Search..."
          />
        </div>

        <div class="list">

          <!-- ✅ RECENT CHATS -->
          <ng-container *ngIf="filteredChats.length > 0; else newChatList">
            <div class="sectionTitle">Recent Chats</div>

            <div
              *ngFor="let c of filteredChats"
              class="item"
              [class.active]="selectedChatId === c.id"
              (click)="openChatFromChatDoc(c)"
            >
              <div class="avatar">{{ getChatNameFromChatDoc(c)[0] || 'U' }}</div>

              <div class="info">
                <div class="row">
                  <div class="name">{{ getChatNameFromChatDoc(c) }}</div>
                  <div class="time">{{ formatTime(c.updatedAt) }}</div>
                </div>

                <div class="preview">
                  {{ c.lastMessage || 'No messages yet...' }}
                </div>
              </div>
            </div>
          </ng-container>

          <!-- ✅ IF NO CHATS -> SHOW ALL USERS -->
          <ng-template #newChatList>
            <div class="sectionTitle">Start New Chat</div>

            <div
              *ngFor="let u of filteredUsers"
              class="item"
              (click)="startNewChat(u)"
            >
              <div class="avatar">{{ (u.name?.[0] || 'U') }}</div>

              <div class="info">
                <div class="row">
                  <div class="name">{{ u.name || u.email }}</div>
                  <div class="time"></div>
                </div>

                <div class="preview">
                  {{ u.phone || 'No phone' }}
                </div>
              </div>
            </div>

            <div *ngIf="filteredUsers.length === 0" class="noUsers">
              No users found
            </div>
          </ng-template>

        </div>
      </div>

      <!-- ✅ RIGHT CHAT PANEL -->
      <div class="content">
        <ng-container *ngIf="selectedUser; else empty">
          <app-chat [user]="selectedUser"></app-chat>
        </ng-container>

        <ng-template #empty>
          <div class="empty">
            <div class="icon">💬</div>
            <div class="t1">Select a chat</div>
            <div class="t2">Choose from left panel</div>
          </div>
        </ng-template>
      </div>

    </div>
  `,
  styles: [`
   :host {
  display: flex;
  flex: 1;
  width: 100%;
  height: 100%;
  min-width: 0;
  overflow: hidden;
}


    .layout{
  width: 100%;
  height: 100%;
  display:flex;
  overflow:hidden;
  background:#020617;
}


    .sidebar{
      width:360px;
      border-right:1px solid rgba(255,255,255,0.07);
      background: rgba(2,6,23,0.95);
      display:flex;
      flex-direction:column;
      overflow:hidden;
      flex-shrink: 0;
    }

    .top{
      padding:14px;
      border-bottom:1px solid rgba(255,255,255,0.07);
      background: rgba(15,23,42,0.65);
      backdrop-filter: blur(10px);
    }

    .logo{
      font-size:18px;
      font-weight:900;
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

    .sectionTitle{
      padding: 10px 12px;
      font-size: 12px;
      font-weight: 900;
      opacity: .65;
      color: white;
    }

    .item{
      display:flex;
      gap:12px;
      padding:12px;
      border-radius:16px;
      cursor:pointer;
      color:white;
      transition:.15s;
      border:1px solid transparent;
    }

    .item:hover{ background: rgba(255,255,255,0.05); }

    .item.active{
      background: rgba(37,99,235,0.18);
      border:1px solid rgba(37,99,235,0.35);
    }

    .avatar{
      width:46px;
      height:46px;
      border-radius:50%;
      background: linear-gradient(135deg,#2563eb,#60a5fa);
      display:grid;
      place-items:center;
      font-weight:900;
      flex-shrink:0;
    }

    .info{ flex:1; min-width:0; }
    .row{ display:flex; justify-content:space-between; align-items:center; gap:10px; }

    .name{
      font-weight:900;
      font-size:14px;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
    }

    .time{ font-size:11px; opacity:.55; flex-shrink:0; }

    .preview{
      margin-top:4px;
      font-size:12px;
      opacity:.7;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
    }

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
    .icon{ font-size:44px; }
    .t1{ margin-top:8px; font-weight:900; font-size:20px; }
    .t2{ margin-top:6px; font-size:13px; opacity:.7; }

    .noUsers{
      margin-top: 14px;
      text-align: center;
      opacity: .6;
      font-size: 13px;
    }
  `]
})
export class ChatsComponent implements OnInit, OnDestroy {
  myUid = '';

  // chats list
  chats: any[] = [];
  filteredChats: any[] = [];

  // users list (start new chat)
  allUsers: AppUser[] = [];
  filteredUsers: AppUser[] = [];

  // search
  searchText = '';

  // selection
  selectedChatId: string | null = null;
  selectedUser: AppUser | null = null;

  usersMap = new Map<string, AppUser>();

  private unsubAuth: any;
  private unsubChats: any;
  private usersSub: any;

  constructor(
    private auth: Auth,
    private chatService: ChatService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.unsubAuth = onAuthStateChanged(this.auth, (u) => {
      if (!u) return;

      this.myUid = u.uid;

      // ✅ load all users from firestore
      this.usersSub = this.userService.getUsers().subscribe((users) => {
        this.usersMap.clear();
        users.forEach(us => this.usersMap.set(us.uid, us));

        // show all users except me for "Start New Chat"
        this.allUsers = users.filter(x => x.uid !== this.myUid);
        this.filteredUsers = [...this.allUsers];

        this.applyFilter();
      });

      // ✅ listen my chats (recent chats)
      this.unsubChats = this.chatService.listenMyChats(this.myUid, (data) => {
        this.chats = data || [];
        this.applyFilter();

        // auto-open first recent chat
        if (!this.selectedChatId && this.filteredChats.length > 0) {
          this.openChatFromChatDoc(this.filteredChats[0]);
        }
      });
    });
  }

  ngOnDestroy(): void {
    if (this.unsubAuth) this.unsubAuth();
    if (this.unsubChats) this.unsubChats();
    if (this.usersSub) this.usersSub.unsubscribe?.();
  }

  applyFilter() {
    const t = this.searchText.trim().toLowerCase();

    // filter chats
    if (!t) {
      this.filteredChats = [...this.chats];
    } else {
      this.filteredChats = this.chats.filter(c => {
        const name = (this.getChatNameFromChatDoc(c) || '').toLowerCase();
        const last = (c.lastMessage || '').toLowerCase();
        return name.includes(t) || last.includes(t);
      });
    }

    // filter users
    if (!t) {
      this.filteredUsers = [...this.allUsers];
    } else {
      this.filteredUsers = this.allUsers.filter(u => {
        const name = (u.name || '').toLowerCase();
        const phone = (u.phone || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        return name.includes(t) || phone.includes(t) || email.includes(t);
      });
    }
  }

  // ✅ click from recent chats list
  openChatFromChatDoc(chatDoc: any) {
    this.selectedChatId = chatDoc.id;

    const otherUid = (chatDoc.users || []).find((x: string) => x !== this.myUid);
    this.selectedUser = otherUid ? (this.usersMap.get(otherUid) || null) : null;
  }

  // ✅ click from all users list (Start New Chat)
  async startNewChat(user: AppUser) {
    const chatId = this.chatService.getChatId(this.myUid, user.uid);

    // create chat doc if not exists
    await this.chatService.ensureChat(chatId, [this.myUid, user.uid]);

    // open chat
    this.selectedChatId = chatId;
    this.selectedUser = user;
  }

  getChatNameFromChatDoc(chatDoc: any): string {
    const otherUid = (chatDoc.users || []).find((x: string) => x !== this.myUid);
    const u = otherUid ? this.usersMap.get(otherUid) : null;
    return u?.name || u?.email || 'Unknown';
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
