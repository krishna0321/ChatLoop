import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Auth } from '@angular/fire/auth';

import { Subscription } from 'rxjs';
import { UserService, AppUser } from '../../../core/services/user.service';
import { RoomService } from '../../../core/services/room.service';

type RoomType = 'group' | 'channel';

@Component({
  selector: 'app-create-group',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './create-group.component.html',
  styleUrls: ['./create-group.component.css'],
})
export class CreateGroupComponent implements OnInit, OnDestroy {
  me = '';
  type: RoomType = 'group';

  name = '';
  description = '';
  search = '';

  users: AppUser[] = [];
  filtered: AppUser[] = [];

  // selected member UIDs
  selected = new Set<string>();

  loading = false;
  err = '';
  msg = '';

  private sub?: Subscription;

  constructor(
    private auth: Auth,
    private usersService: UserService,
    private roomsService: RoomService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const u = this.auth.currentUser;
    if (!u) return;

    this.me = u.uid;

    this.sub = this.usersService.getUsers().subscribe((list) => {
      this.users = (list || []).filter((x) => x.uid !== this.me);
      this.apply();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  selectType(t: RoomType) {
    this.type = t;
    this.msg = '';
    this.err = '';
  }

  // ✅ Angular template safe helper
  getUser(uid: string): AppUser | undefined {
    return (this.users || []).find((x) => x.uid === uid);
  }

  getUserLabel(uid: string): string {
    const u = this.getUser(uid);
    return u?.name || u?.email || u?.phone || 'User';
  }

  getInitial(u: AppUser): string {
    return (u?.name || u?.email || 'U').slice(0, 1).toUpperCase();
  }

  apply() {
    const t = this.search.trim().toLowerCase();

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

  toggleUser(uid: string) {
    if (!uid) return;
    if (this.selected.has(uid)) this.selected.delete(uid);
    else this.selected.add(uid);
  }

  isSelected(uid: string) {
    return this.selected.has(uid);
  }

  remove(uid: string) {
    this.selected.delete(uid);
  }

  validate(): string {
    const n = this.name.trim();
    const d = this.description.trim();

    if (!n) return 'Please enter group/channel name';
    if (n.length < 3) return 'Name must be at least 3 characters';
    if (n.length > 30) return 'Name must be max 30 characters';
    if (d.length > 120) return 'Description must be max 120 characters';
    if (this.selected.size === 0) return 'Select at least 1 member';

    return '';
  }

  async create() {
    this.err = '';
    this.msg = '';

    const v = this.validate();
    if (v) {
      this.err = v;
      return;
    }

    try {
      this.loading = true;

      // include me always
      const members = Array.from(this.selected);
      if (!members.includes(this.me)) members.unshift(this.me);

      const roomId = await this.roomsService.createRoom({
        type: this.type,
        name: this.name.trim(),
        description: this.description.trim(),
        members,
      });

      this.msg = 'Created ✅';

      await this.router.navigate(['/app/chats'], {
        queryParams: { room: roomId },
      });
    } catch (e: any) {
      console.error(e);
      this.err = e?.message || 'Create failed';
    } finally {
      this.loading = false;
    }
  }
}
