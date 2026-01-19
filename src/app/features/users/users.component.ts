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
  editUser: AppUser | null = null;

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
          this.users = (list || []).filter((x) => x.uid !== this.myUid);
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
    this.editUser = null;
  }

  closeDetails() {
    this.selectedUser = null;
  }

  openEdit(u: AppUser) {
    // ✅ clone object (so UI updates only on save)
    this.editUser = { ...u };
    this.selectedUser = null;
  }

  closeEdit() {
    this.editUser = null;
  }

  async saveEdit() {
    if (!this.editUser?.uid) return;

    try {
      await this.userService.updateUser(this.editUser.uid, {
        name: this.editUser.name || '',
        email: this.editUser.email || '',
        phone: this.editUser.phone || '',
      });

      this.editUser = null;
      alert('✅ User updated');
    } catch (err) {
      console.error('Update user error:', err);
      alert('❌ Failed to update user');
    }
  }

  async deleteUser(u: AppUser) {
    if (!u?.uid) return;

    const ok = confirm(`Delete user: ${u.name || u.email || u.uid} ?`);
    if (!ok) return;

    try {
      await this.userService.deleteUser(u.uid);

      // ✅ close panels if needed
      if (this.selectedUser?.uid === u.uid) this.selectedUser = null;
      if (this.editUser?.uid === u.uid) this.editUser = null;

      alert('🗑 User deleted');
    } catch (err) {
      console.error('Delete user error:', err);
      alert('❌ Failed to delete user');
    }
  }

  async startChat(u: AppUser) {
    if (!this.myUid || !u?.uid) return;

    const chatId = this.chatService.getChatId(this.myUid, u.uid);

    await this.chatService.ensureChat(chatId, [this.myUid, u.uid]);

    await this.router.navigate(['/app/chats'], {
      queryParams: { uid: u.uid },
    });
  }
}
