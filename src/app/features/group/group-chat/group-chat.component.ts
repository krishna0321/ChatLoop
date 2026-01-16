import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoomService } from '../../../core/services/room.service'; // Adjust path!!
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-group-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './group-chat.component.html',
  styleUrls: ['./group-chat.component.scss'],
})
export class GroupChatComponent implements OnInit, OnDestroy {

  roomId: string | null = null;
  room: any = null;
  loading: boolean = true;
  messages: any[] = [];
  err: string = '';
  text: string = '';
  myUid: string = '';

  private unsubRoom!: () => void;
  private unsubMsgs!: () => void;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private roomService: RoomService,
    private auth: Auth
  ) {}

  ngOnInit() {
    this.myUid = this.auth.currentUser?.uid || '';
    this.roomId = this.route.snapshot.paramMap.get('id');

    if (!this.roomId) {
      this.err = 'Invalid group ID';
      return;
    }

    // listen to room changes
    this.unsubRoom = this.roomService.listenRoom(this.roomId, (room) => {
      this.room = room;
      this.loading = false;
      if (!room) this.err = 'Group not found';
    });

    // listen to messages
    this.unsubMsgs = this.roomService.listenRoomMessages(this.roomId, (msgs) => {
      this.messages = msgs;
    });
  }

  ngOnDestroy() {
    if (this.unsubRoom) this.unsubRoom();
    if (this.unsubMsgs) this.unsubMsgs();
  }

  send() {
    if (!this.text.trim()) return;

    this.roomService.sendRoomMessage(this.roomId!, {
      text: this.text,
      senderId: this.myUid,
    });

    this.text = '';
  }

  openInfo() {
    this.router.navigate([`/app/group/${this.roomId}/info`]);
  }

  getInitial(uid: string): string {
    return uid?.slice(0, 1).toUpperCase();
  }

  getMemberName(uid: string): string {
    return uid === this.myUid ? 'You' : `User ${uid.slice(0, 5)}`;
  }
}
