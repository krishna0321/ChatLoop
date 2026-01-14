import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, docData, updateDoc, arrayUnion, arrayRemove } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';

import { MessageService, RoomMessage } from '../../../core/services/message.service';
import { RoomService } from '../../../core/services/room.service';
import { UserService, AppUser } from '../../../core/services/user.service';

@Component({
  selector: 'app-group-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './group-chat.component.html',
  styleUrls: ['./group-chat.component.css'],
})
export class GroupChatComponent implements OnInit, OnDestroy {
  id = '';
  room: any = null;

  me = '';
  myUser: AppUser | null = null;

  loading = true;
  messages: RoomMessage[] = [];
  text = '';

  showInfo = false;

  private subs: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: Auth,
    private fs: Firestore,
    private msg: MessageService,
    private rooms: RoomService,
    private users: UserService
  ) {}

  ngOnInit(): void {
    const u = this.auth.currentUser;
    if (!u) return;

    this.me = u.uid;
    this.id = this.route.snapshot.paramMap.get('id') || '';
    if (!this.id) return;

    // my profile
    this.subs.push(
      this.users.getUser(this.me).subscribe((me) => (this.myUser = me))
    );

    // room doc
    const roomRef = doc(this.fs, `rooms/${this.id}`);
    this.subs.push(
      docData(roomRef, { idField: 'id' }).subscribe((d: any) => {
        this.room = d;
      })
    );

    // mark read
    this.rooms.markAsRead(this.id, this.me);

    // messages
    this.subs.push(
      this.msg.getRoomMessages(this.id).subscribe((list) => {
        this.messages = list || [];
        this.loading = false;
        setTimeout(() => document.getElementById('end')?.scrollIntoView({ behavior: 'smooth' }), 40);
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  isOwner(): boolean {
    return this.room?.ownerId === this.me;
  }

  isAdmin(): boolean {
    const admins = this.room?.admins || [];
    return admins.includes(this.me);
  }

  canSend(): boolean {
    if (!this.room) return true;
    if (this.room.type !== 'channel') return true;
    return this.isAdmin();
  }

  async send() {
    const v = this.text.trim();
    if (!v) return;
    if (!this.canSend()) return;

    await this.msg.sendRoomMessage(this.id, this.me, v);
    this.text = '';
  }

  async deleteMsg(m: RoomMessage) {
    if (!m?.id) return;
    if (m.senderId !== this.me) return;

    await this.msg.deleteRoomMessage(this.id, m.id);
  }

  openInfo() {
    this.showInfo = true;
  }
  closeInfo() {
    this.showInfo = false;
  }

  goAddMembers() {
    this.router.navigate(['/app/group/add-members', this.id]);
  }
}
