import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Router } from '@angular/router';

import { UserService, AppUser } from '../../core/services/user.service';
import { ChatService } from '../../core/services/chat.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">

      <div class="topbar">
        <div>
          <div class="title">Users</div>
          <div class="sub">Start a new chat with any user</div>
        </div>

        <input
          class="search"
          [(ngModel)]="searchText"
          (input)="applyFilter()"
          placeholder="Search users..."
        />
      </div>

      <div class="list">
        <div
          class="user"
          *ngFor="let u of filteredUsers"
          (click)="startChat(u)"
        >
          <div class="avatar">{{ (u.name || u.email || 'U')[0] }}</div>

          <div class="info">
            <div class="name">{{ u.name || u.email }}</div>
            <div class="meta">
              <span>{{ u.phone || 'No phone' }}</span>
              <span class="dot">•</span>
              <span>{{ u.email }}</span>
            </div>
          </div>

          <button class="btn" (click)="startChat(u); $event.stopPropagation()">
            Message
          </button>
        </div>

        <div *ngIf="filteredUsers.length === 0" class="empty">
          No users found 😢
        </div>
      </div>

    </div>
  `,
  styles: [`
  :host{
    display:flex;
    flex:1;
    width:100%;
    height:100%;
    min-width:0;
    overflow:hidden;
  }

  .page{
    width:100%;
    height:100%;
    padding:18px;
    display:flex;
    flex-direction:column;
    gap:14px;
    overflow:hidden;
    min-width:0;
  }

  .topbar{
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:14px;
    padding:14px 16px;
    border-radius:18px;
    background: rgba(15,23,42,0.65);
    border: 1px solid rgba(255,255,255,0.07);
    backdrop-filter: blur(10px);
    min-width:0;
  }

  .title{
    font-size:18px;
    font-weight:900;
    color:white;
  }

  .sub{
    font-size:12px;
    opacity:.7;
    color:white;
    margin-top:2px;
  }

  .search{
    width: 320px;
    max-width: 45vw;
    height: 44px;
    border-radius: 14px;
    padding: 0 14px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(2,6,23,0.6);
    color:white;
    outline:none;
  }

  .list{
    flex:1;
    overflow:auto;
    padding:10px;
    border-radius:18px;
    background: rgba(2,6,23,0.35);
    border: 1px solid rgba(255,255,255,0.06);
    min-height:0;
    -webkit-overflow-scrolling: touch;
  }

  .user{
    display:flex;
    gap:12px;
    align-items:center;
    padding:12px;
    border-radius:16px;
    cursor:pointer;
    transition:.15s;
    border: 1px solid transparent;
    color:white;
    min-width:0;
  }

  .user:hover{
    background: rgba(255,255,255,0.05);
    border-color: rgba(255,255,255,0.06);
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
    text-transform: uppercase;
  }

  .info{
    flex:1;
    min-width:0;
  }

  .name{
    font-weight:900;
    font-size:14px;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
  }

  .meta{
    margin-top:4px;
    font-size:12px;
    opacity:.75;
    display:flex;
    gap:8px;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
    min-width:0;
  }

  .dot{ opacity:.55; }

  .btn{
    height:38px;
    padding: 0 14px;
    border:none;
    border-radius: 12px;
    font-weight:900;
    cursor:pointer;
    color:white;
    background: rgba(37,99,235,0.9);
    flex-shrink:0;
  }

  .btn:hover{ opacity:0.95; }

  .empty{
    margin-top: 18px;
    text-align:center;
    opacity:.7;
    font-size:14px;
    padding: 20px 0;
  }

  /* ✅ RESPONSIVE */
  @media (max-width: 900px){
    .page{
      padding: 14px;
    }

    .topbar{
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
    }

    .search{
      width: 100%;
      max-width: 100%;
    }

    /* ✅ Important: space for bottom leftbar */
    .list{
      padding-bottom: 90px;
    }
  }

  @media (max-width: 520px){
    .user{
      padding: 11px;
      gap: 10px;
    }

    .avatar{
      width: 42px;
      height: 42px;
    }

    /* ✅ hide long meta text on very small devices */
    .meta{
      display:block;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
    }

    .btn{
      padding: 0 12px;
      height: 36px;
      border-radius: 12px;
    }
  }
`]

})
export class UsersComponent implements OnInit, OnDestroy {
  myUid = '';
  searchText = '';

  users: AppUser[] = [];
  filteredUsers: AppUser[] = [];

  private unsubAuth: any;
  private usersSub: any;

  constructor(
    private auth: Auth,
    private router: Router,
    private userService: UserService,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    this.unsubAuth = onAuthStateChanged(this.auth, (u) => {
      if (!u) return;
      this.myUid = u.uid;

      this.usersSub = this.userService.getUsers().subscribe((list) => {
        // show everyone except me
        this.users = (list || []).filter(x => x.uid !== this.myUid);
        this.filteredUsers = [...this.users];
        this.applyFilter();
      });
    });
  }

  ngOnDestroy(): void {
    if (this.unsubAuth) this.unsubAuth();
    if (this.usersSub) this.usersSub.unsubscribe?.();
  }

  applyFilter() {
    const t = this.searchText.trim().toLowerCase();
    if (!t) {
      this.filteredUsers = [...this.users];
      return;
    }

    this.filteredUsers = this.users.filter(u => {
      const name = (u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const phone = (u.phone || '').toLowerCase();
      return name.includes(t) || email.includes(t) || phone.includes(t);
    });
  }

async startChat(user: AppUser) {
  if (!this.myUid || !user?.uid) return;

  const chatId = this.chatService.getChatId(this.myUid, user.uid);

  // ✅ ensure chat exists
  await this.chatService.ensureChat(chatId, [this.myUid, user.uid]);

  // ✅ open chats page AND auto-select this user
  await this.router.navigate(['/app/chats'], {
    queryParams: { uid: user.uid }
  });
}

}
