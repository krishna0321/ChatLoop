import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';

import { RoomService } from '../../../core/services/room.service';
import { UserService, AppUser } from '../../../core/services/user.service';

@Component({
  selector: 'app-group-info',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './group-info.component.html',
  styleUrls: ['./group-info.component.css'],
})
export class GroupInfoComponent implements OnInit, OnDestroy {
  myUid = '';
  roomId = '';

  room: any = null;

  usersMap = new Map<string, AppUser>();

  loading = true;
  err = '';

  private subRoom?: any;
  private subUsers?: Subscription;

  constructor(
    private auth: Auth,
    private route: ActivatedRoute,
    private router: Router,
    private roomService: RoomService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    const u = this.auth.currentUser;
    if (!u) {
      this.loading = false;
      this.err = 'Not logged in';
      return;
    }

    this.myUid = u.uid;

    this.roomId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.roomId) {
      this.loading = false;
      this.err = 'Room ID missing';
      return;
    }

    // ✅ listen all users so we can show names in members list
    this.subUsers = this.userService.getUsers().subscribe({
      next: (list) => {
        this.usersMap.clear();
        (list || []).forEach((x) => this.usersMap.set(x.uid, x));
      },
      error: (e) => console.error('Users map error:', e),
    });

    // ✅ listen room realtime
    this.subRoom = this.roomService.listenRoom(this.roomId, (r: any) => {
      this.room = r;
      this.loading = false;
      this.err = '';
    });
  }

  ngOnDestroy(): void {
    this.subRoom?.();
    this.subUsers?.unsubscribe();
  }

  getUserName(uid: string): string {
    const u = this.usersMap.get(uid);
    return u?.name || u?.email || 'User';
  }

  getInitial(uid: string): string {
    return this.getUserName(uid).slice(0, 1).toUpperCase();
  }

  isOwner(): boolean {
    return this.room?.ownerId === this.myUid;
  }

  isAdmin(uid: string): boolean {
    return (this.room?.admins || []).includes(uid);
  }

  // ✅ FIXED ROUTE
  openAddMembers() {
    this.router.navigate(['/app/group', this.roomId, 'add-members']);
  }

  async leave() {
    if (!confirm('Leave this group?')) return;

    try {
      await this.roomService.leaveRoom(this.roomId, this.myUid);
      await this.router.navigate(['/app/chats']);
    } catch (e) {
      console.error('Leave error:', e);
      alert('Failed to leave group');
    }
  }

  async deleteRoom() {
    if (!this.isOwner()) return;
    if (!confirm('Delete this group permanently?')) return;

    try {
      await this.roomService.deleteRoom(this.roomId);
      await this.router.navigate(['/app/chats']);
    } catch (e) {
      console.error('Delete room error:', e);
      alert('Failed to delete group');
    }
  }
}
