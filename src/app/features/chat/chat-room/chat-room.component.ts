import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';

import { MessageService, RoomMessage } from '../../../core/services/message.service';
import { RoomService } from '../../../core/services/room.service';

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.css'],
})
export class ChatRoomComponent implements OnInit, OnDestroy {
  @Input() roomId = ''; // ✅ works with chats sidebar
  room: any = null;

  loading = true;
  messages: RoomMessage[] = [];

  text = '';
  me = '';

  private subs: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private auth: Auth,
    private fs: Firestore,
    private msg: MessageService,
    private rooms: RoomService
  ) {}

  ngOnInit(): void {
    const user = this.auth.currentUser;
    if (!user) return;

    this.me = user.uid;

    // ✅ if opened by route
    if (!this.roomId) {
      this.roomId = this.route.snapshot.paramMap.get('id') || '';
    }
    if (!this.roomId) return;

    // ✅ listen room
    const roomDoc = doc(this.fs, `rooms/${this.roomId}`);
    const subRoom = docData(roomDoc, { idField: 'id' }).subscribe((data: any) => {
      this.room = data;
    });
    this.subs.push(subRoom);

    // ✅ read
    this.rooms.markAsRead(this.roomId, this.me);

    // ✅ messages
    const subMsg = this.msg.getRoomMessages(this.roomId).subscribe((list) => {
      this.messages = list || [];
      this.loading = false;

      setTimeout(() => {
        const el = document.getElementById('msgEnd');
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    });
    this.subs.push(subMsg);
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  canSend(): boolean {
    if (!this.room) return true;
    if (this.room?.type !== 'channel') return true;

    const admins: string[] = this.room?.admins || [];
    return admins.includes(this.me);
  }

  async send() {
    const value = this.text.trim();
    if (!value) return;
    if (!this.canSend()) return;

    try {
      await this.msg.sendRoomMessage(this.roomId, this.me, value);
      this.text = '';
    } catch (e: any) {
      alert(e?.message || 'Message send failed');
    }
  }

  async deleteMessage(m: RoomMessage) {
    if (!m?.id) return;
    if (m.senderId !== this.me) return;
    await this.msg.deleteRoomMessage(this.roomId, m.id);
  }
}
