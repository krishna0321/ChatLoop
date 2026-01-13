import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';

import { RoomService, Room } from '../../core/services/room.service';

type ChatItem = {
  id: string;
  title: string;
  type: 'dm' | 'group' | 'channel';
  lastMessage: string;
  updatedAt?: any;
  unread: number;
};

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './chat-list.component.html',
  styleUrls: ['./chat-list.component.css'],
})
export class ChatListComponent implements OnInit, OnDestroy {
  loading = true;
  chats: ChatItem[] = [];

  private sub?: Subscription;

  constructor(private auth: Auth, private rooms: RoomService) {}

  ngOnInit(): void {
    const user = this.auth.currentUser;
    if (!user) {
      this.loading = false;
      this.chats = [];
      return;
    }

    const myUid = user.uid;

    this.sub = this.rooms.myRooms$().subscribe({
      next: (roomsList: Room[]) => {
        // ✅ pinned first + latest updated
        const sorted = [...roomsList].sort((a: any, b: any) => {
          const ap = a?.pinned?.[myUid] ? 1 : 0;
          const bp = b?.pinned?.[myUid] ? 1 : 0;
          if (bp !== ap) return bp - ap;

          const at = a?.updatedAt?.seconds || 0;
          const bt = b?.updatedAt?.seconds || 0;
          return bt - at;
        });

        this.chats = sorted.map((r) => ({
          id: r.id!,
          title: r.type === 'dm' ? 'Direct Message' : (r.name || 'Room'),
          type: r.type,
          lastMessage: r.lastMessage || '',
          updatedAt: r.updatedAt,
          unread: r.unread?.[myUid] || 0,
        }));

        this.loading = false;
      },
      error: (err) => {
        console.error('Room list error:', err);
        this.loading = false;
        this.chats = [];
      },
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  trackByChatId(index: number, item: ChatItem) {
    return item.id;
  }

  iconByType(type: ChatItem['type']) {
    if (type === 'group') return '👥';
    if (type === 'channel') return '📢';
    return '💬';
  }
}
