import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService, AppUser } from '../../core/services/user.service';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chat-list">
      <input placeholder="Search" />

      <div
        class="chat"
        *ngFor="let u of users"
        (click)="select(u)"
      >
        <div class="avatar">{{ u.name[0] }}</div>

        <div class="info">
          <div class="name">{{ u.name }}</div>

          <!-- ✅ SHOW PHONE NOT EMAIL -->
          <div class="msg">{{ u.phone || 'No phone' }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-list {
      width: 320px;
      padding: 10px;
      background:#020617;
      color:white;
      border-right: 1px solid rgba(255,255,255,0.06);
    }

    input {
      width:100%;
      padding:10px;
      border-radius:10px;
      border:none;
      margin-bottom:10px;
      background:#1e293b;
      color:white;
      outline:none;
    }

    .chat {
      display:flex;
      gap:12px;
      padding:10px;
      border-radius:12px;
      cursor:pointer;
      transition: 0.2s;
    }

    .chat:hover {
      background:#1e293b;
    }

    .avatar {
      width:44px;
      height:44px;
      border-radius:50%;
      display:grid;
      place-items:center;
      background:#2563eb;
      font-weight:800;
      text-transform: uppercase;
    }

    .info {
      display:flex;
      flex-direction: column;
      justify-content: center;
      min-width: 0;
    }

    .name {
      font-weight:800;
      font-size: 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .msg {
      font-size:12px;
      opacity:.7;
      margin-top:2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `]
})
export class ChatListComponent implements OnInit {
  @Output() userSelected = new EventEmitter<AppUser>();

  users: AppUser[] = [];

  constructor(
    private userService: UserService,
    private auth: Auth
  ) {}

  ngOnInit(): void {
    this.userService.getUsers().subscribe(all => {
      const myUid = this.auth.currentUser?.uid;
      this.users = all.filter(u => u.uid !== myUid);
    });
  }

  select(user: AppUser) {
    this.userSelected.emit(user);
  }
}
