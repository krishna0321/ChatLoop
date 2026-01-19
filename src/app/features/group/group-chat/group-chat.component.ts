import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { Auth, onAuthStateChanged } from '@angular/fire/auth';

import { RoomService, Room, RoomMessage } from '../../../core/services/room.service';

@Component({
  selector: 'app-group-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './group-chat.component.html',
  styleUrls: ['./group-chat.component.css'],
})
export class GroupChatComponent implements OnInit, OnDestroy {
  @ViewChild('box') box?: ElementRef<HTMLElement>;

  roomId = '';
  myUid = '';

  loading = true;
  err = '';

  room: Room | null = null;
  messages: RoomMessage[] = [];

  text = '';

  private authUnsub?: () => void;
  private unsubRoom?: () => void;
  private unsubMsgs?: () => void;

  constructor(
    private auth: Auth,
    private route: ActivatedRoute,
    private router: Router,
    private roomService: RoomService
  ) {}

  ngOnInit(): void {
    this.roomId = this.route.snapshot.paramMap.get('id') || '';

    if (!this.roomId) {
      this.router.navigate(['/app/chats']);
      return;
    }

    this.authUnsub = onAuthStateChanged(this.auth, (u) => {
      if (!u) {
        this.router.navigate(['/login']);
        return;
      }

      this.myUid = u.uid;

      // ✅ listen room doc
      this.unsubRoom = this.roomService.listenRoom(this.roomId, (room) => {
        this.room = room;
      });

      // ✅ listen messages
      this.unsubMsgs = this.roomService.listenRoomMessages(
        this.roomId,
        (msgs) => {
          this.messages = msgs || [];
          this.loading = false;

          // ✅ scroll bottom
          setTimeout(() => this.scrollToBottom(), 50);

          // ✅ mark as read (Telegram behavior)
          this.roomService.markAsRead(this.roomId, this.myUid);
        }
      );
    });
  }

  ngOnDestroy(): void {
    this.authUnsub?.();
    this.unsubRoom?.();
    this.unsubMsgs?.();
  }

  scrollToBottom() {
    const el = this.box?.nativeElement;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }

  async send() {
    const value = (this.text || '').trim();
    if (!value) return;

    try {
      await this.roomService.sendRoomMessage(this.roomId, {
        text: value,
        senderId: this.myUid,
      });

      this.text = '';
      setTimeout(() => this.scrollToBottom(), 50);
    } catch (err) {
      console.error('Send message error:', err);
      this.err = '❌ Failed to send message';
    }
  }

  openInfo() {
    this.router.navigate(['/app/group', this.roomId, 'info']);
  }

  getInitial(uid: string) {
    return (uid || 'U').slice(0, 1).toUpperCase();
  }

  getMemberName(uid: string) {
    if (uid === this.myUid) return 'You';
    return uid.slice(0, 8);
  }
}
