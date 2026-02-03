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
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent implements OnInit, OnDestroy {
  loading = true;

  myUid = '';
  searchText = '';

  users: AppUser[] = [];
  filtered: AppUser[] = [];

  selectedUser: AppUser | null = null;

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
      if (!u) {
        this.router.navigate(['/login']);
        return;
      }

      this.myUid = u.uid;

      this.usersSub = this.userService.getUsers().subscribe({
        next: (list) => {
          // ✅ show everyone except me
          this.users = (list || []).filter(u => {
          if (u.uid === this.myUid) return false;
          if (u.blocked?.includes(this.myUid)) return false;
          return true;
        });


          // ✅ default filtered list
          this.onSearch();

          this.loading = false;
        },
        error: (err) => {
          console.error('Users load error:', err);
          this.loading = false;
        },
      });
    });
  }

  ngOnDestroy(): void {
    if (this.unsubAuth) this.unsubAuth();
    if (this.usersSub) this.usersSub.unsubscribe?.();
  }

  onSearch() {
    const t = (this.searchText || '').trim().toLowerCase();

    if (!t) {
      this.filtered = [...this.users];
      return;
    }

    this.filtered = this.users.filter((u) => {
      const name = (u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const phone = (u.phone || '').toLowerCase();
      return name.includes(t) || email.includes(t) || phone.includes(t);
    });
  }

  openDetails(u: AppUser) {
    this.selectedUser = u;
  }

  closeDetails() {
    this.selectedUser = null;
  }

  async startChat(u: AppUser) {
    if (!this.myUid || !u?.uid) return;

    try {
      const chatId = this.chatService.getChatId(this.myUid, u.uid);

      await this.chatService.ensureChat(chatId, [this.myUid, u.uid]);

      await this.router.navigate(['/app/chats'], {
        queryParams: { uid: u.uid },
      });
    } catch (err) {
      console.error('Start chat error:', err);
      alert('❌ Failed to start chat');
    }
  }
}
