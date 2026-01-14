import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Auth } from '@angular/fire/auth';

import { UserService, AppUser } from '../../../core/services/user.service';
import { RoomService } from '../../../core/services/room.service';

@Component({
  selector: 'app-create-group',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './create-group.component.html',
  styleUrls: ['./create-group.component.css'],
})
export class CreateGroupComponent implements OnInit, OnDestroy {
  me = '';
  search = '';

  type: 'group' | 'channel' = 'group';
  name = '';
  description = '';

  users: AppUser[] = [];
  filtered: AppUser[] = [];

  selected = new Set<string>();

  loading = false;
  err = '';

  private sub?: Subscription;

  constructor(
    private auth: Auth,
    private userService: UserService,
    private roomService: RoomService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const u = this.auth.currentUser;
    if (!u) return;
    this.me = u.uid;

    this.sub = this.userService.getUsers().subscribe((list) => {
      this.users = (list || []).filter((x) => x.uid !== this.me);
      this.applyFilter();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  setType(t: 'group' | 'channel') {
    this.type = t;
  }

  applyFilter() {
    const t = this.search.trim().toLowerCase();
    if (!t) {
      this.filtered = [...this.users];
      return;
    }
    this.filtered = this.users.filter((u) => {
      const n = (u.name || '').toLowerCase();
      const e = (u.email || '').toLowerCase();
      const p = (u.phone || '').toLowerCase();
      return n.includes(t) || e.includes(t) || p.includes(t);
    });
  }

  toggleUser(uid: string) {
    if (this.selected.has(uid)) this.selected.delete(uid);
    else this.selected.add(uid);
  }

  isSelected(uid: string) {
    return this.selected.has(uid);
  }

  validate(): string {
    const n = this.name.trim();
    if (!n) return 'Please enter group name';
    if (n.length < 3) return 'Name must be at least 3 chars';
    if (n.length > 30) return 'Name must be max 30 chars';

    if (this.type === 'group' && this.selected.size === 0)
      return 'Select at least 1 member';
    return '';
  }

  async create() {
    this.err = '';
    const v = this.validate();
    if (v) {
      this.err = v;
      return;
    }

    try {
      this.loading = true;

      const roomId = await this.roomService.createRoom({
        type: this.type,
        name: this.name.trim(),
        description: this.description.trim(),
        members: Array.from(this.selected),
      });

      // go group chat
      await this.router.navigate(['/app/group', roomId]);
    } catch (e: any) {
      console.error(e);
      this.err = e?.message || 'Create failed';
    } finally {
      this.loading = false;
    }
  }
}
