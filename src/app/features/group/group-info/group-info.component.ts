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
    if (!u) return;
    this.myUid = u.uid;

    this.roomId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.roomId) return;

    this.subUsers = this.userService.getUsers().subscribe((list) => {
      this.usersMap.clear();
      (list || []).forEach((x) => this.usersMap.set(x.uid, x));
    });

    this.subRoom = this.roomService.listenRoom(this.roomId, (r: any) => {
      this.room = r;
      this.loading = false;
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

  openAddMembers() {
    this.router.navigate(['/app/group', this.roomId, 'add']);
  }

  async leave() {
    if (!confirm('Leave this group?')) return;
    await this.roomService.leaveRoom(this.roomId, this.myUid);
    this.router.navigate(['/app/chats']);
  }

  async deleteRoom() {
    if (!this.isOwner()) return;
    if (!confirm('Delete this group permanently?')) return;

    await this.roomService.deleteRoom(this.roomId);
    this.router.navigate(['/app/chats']);
  }
}
