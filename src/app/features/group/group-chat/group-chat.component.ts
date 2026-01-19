import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';

import { RoomService } from '../../../core/services/room.service';
import { UserService, AppUser } from '../../../core/services/user.service';

@Component({
  selector: 'app-group-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './group-chat.component.html',
  styleUrls: ['./group-chat.component.css'],
})
export class GroupChatComponent implements OnInit, OnDestroy {
  @ViewChild('box') box?: ElementRef<HTMLDivElement>;

  roomId = '';
  room: any = null;

  loading = true;
  err = '';

  messages: any[] = [];
  text = '';

  myUid = '';

  private unsubRoom?: () => void;
  private unsubMsgs?: () => void;

  // ✅ for showing member names
  usersMap = new Map<string, AppUser>();
  private subUsers?: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: Auth,
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
      this.err = 'Invalid group ID';
      return;
    }

    // ✅ cache all users for names
    this.subUsers = this.userService.getUsers().subscribe((list: AppUser[]) => {
      this.usersMap.clear();
      (list || []).forEach((x) => this.usersMap.set(x.uid, x));
    });

    // ✅ listen room
    this.unsubRoom = this.roomService.listenRoom(this.roomId, (room: any) => {
      this.room = room;
      this.loading = false;

      if (!room) {
        this.err = 'Group not found';
      } else {
        this.err = '';
      }
    });

    // ✅ listen messages
    this.unsubMsgs = this.roomService.listenRoomMessages(this.roomId, (msgs: any[]) => {
      this.messages = msgs || [];
      this.scrollToBottom();
    });
  }

  ngOnDestroy(): void {
    this.unsubRoom?.();
    this.unsubMsgs?.();
    this.subUsers?.unsubscribe?.();
  }

  async send() {
    const t = this.text.trim();
    if (!t || !this.myUid || !this.roomId) return;

    try {
      await this.roomService.sendRoomMessage(this.roomId, {
        text: t,
        senderId: this.myUid,
      });

      this.text = '';
      this.scrollToBottom(true);
    } catch (e) {
      console.error('send group message error', e);
      this.err = 'Message sending failed';
    }
  }

  openInfo() {
    this.router.navigate(['/app/group', this.roomId, 'info']);
  }

  getMemberName(uid: string): string {
    if (!uid) return 'User';
    if (uid === this.myUid) return 'You';
    const u = this.usersMap.get(uid);
    return u?.name || u?.email || 'User';
  }

  getInitial(uid: string): string {
    const name = this.getMemberName(uid);
    return (name || 'U').slice(0, 1).toUpperCase();
  }

  private scrollToBottom(force = false) {
    setTimeout(() => {
      const el = this.box?.nativeElement;
      if (!el) return;
      if (force) el.scrollTop = el.scrollHeight;
      else el.scrollTop = el.scrollHeight;
    }, 30);
  }
}
