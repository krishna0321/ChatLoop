import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';

import { UserService, AppUser } from '../../../core/services/user.service';
import { RoomService } from '../../../core/services/room.service';

@Component({
  selector: 'app-add-members',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './add-members.component.html',
  styleUrls: ['./add-members.component.css'],
})
export class AddMembersComponent implements OnInit, OnDestroy {
  myUid = '';
  roomId = '';

  room: any = null;

  users: AppUser[] = [];
  filtered: AppUser[] = [];

  search = '';
  selected = new Set<string>();

  loading = true;
  saving = false;
  err = '';

  private subUsers?: Subscription;
  private subRoom?: any;

  constructor(
    private auth: Auth,
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private roomService: RoomService
  ) {}

  ngOnInit(): void {
    const u = this.auth.currentUser;
    if (!u) return;
    this.myUid = u.uid;

    this.roomId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.roomId) return;

    this.subRoom = this.roomService.listenRoom(this.roomId, (r: any) => {
      this.room = r;
      this.loading = false;
      this.apply();
    });

    this.subUsers = this.userService.getUsers().subscribe((list) => {
      this.users = (list || []).filter((x) => x.uid !== this.myUid);
      this.apply();
    });
  }

  ngOnDestroy(): void {
    this.subUsers?.unsubscribe();
    this.subRoom?.();
  }

  apply() {
    const t = this.search.trim().toLowerCase();
    const members = new Set<string>(this.room?.members || []);

    let list = (this.users || []).filter((u) => !members.has(u.uid));

    if (t) {
      list = list.filter((u) => {
        return (
          (u.name || '').toLowerCase().includes(t) ||
          (u.email || '').toLowerCase().includes(t) ||
          (u.phone || '').toLowerCase().includes(t)
        );
      });
    }

    this.filtered = list;
  }

  getInitial(u: AppUser) {
    return (u.name || u.email || 'U').slice(0, 1).toUpperCase();
  }

  toggle(uid: string) {
    if (!uid) return;
    if (this.selected.has(uid)) this.selected.delete(uid);
    else this.selected.add(uid);
  }

  isSelected(uid: string) {
    return this.selected.has(uid);
  }

  async add() {
    this.err = '';
    if (this.selected.size === 0) {
      this.err = 'Select at least 1 user';
      return;
    }

    try {
      this.saving = true;
      await this.roomService.addMembers(this.roomId, Array.from(this.selected));
      this.router.navigate(['/app/group', this.roomId, 'info']);
    } catch (e: any) {
      console.error(e);
      this.err = e?.message || 'Add members failed';
    } finally {
      this.saving = false;
    }
  }
}
