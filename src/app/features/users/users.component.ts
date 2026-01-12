import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, AppUser } from '../../core/services/user.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent implements OnInit {
  users: AppUser[] = [];
  filtered: AppUser[] = [];

  searchText = '';

  selectedUser: AppUser | null = null;

  // edit model
  editUser: AppUser | null = null;

  loading = true;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.userService.getUsers().subscribe((data) => {
      this.users = data || [];
      this.filtered = [...this.users];
      this.loading = false;
    });
  }

  // ✅ SEARCH
  onSearch() {
    const t = this.searchText.toLowerCase().trim();
    if (!t) {
      this.filtered = [...this.users];
      return;
    }

    this.filtered = this.users.filter((u) => {
      return (
        (u.name || '').toLowerCase().includes(t) ||
        (u.email || '').toLowerCase().includes(t) ||
        (u.phone || '').toLowerCase().includes(t)
      );
    });
  }

  // ✅ DETAILS VIEW
  openDetails(user: AppUser) {
    this.selectedUser = user;
  }

  closeDetails() {
    this.selectedUser = null;
  }

  // ✅ EDIT
  openEdit(user: AppUser) {
    this.editUser = { ...user };
  }

  closeEdit() {
    this.editUser = null;
  }

  async saveEdit() {
    if (!this.editUser) return;

    const { uid, name, email, phone } = this.editUser;
    await this.userService.updateUser(uid, { name, email, phone });

    alert('✅ User updated successfully!');
    this.editUser = null;
  }

  // ✅ DELETE
  async deleteUser(user: AppUser) {
    if (!confirm(`Delete user: ${user.name}?`)) return;

    await this.userService.deleteUser(user.uid);
    alert('🗑️ User deleted successfully!');

    // close panels if deleted user was open
    if (this.selectedUser?.uid === user.uid) this.selectedUser = null;
    if (this.editUser?.uid === user.uid) this.editUser = null;
  }
}
