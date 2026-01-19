import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';

import { RoomService, Room } from '../../core/services/room.service';

export type ChatItem = {
  id: string;
  title: string;
  type: 'dm' | 'group' | 'channel';
  lastMessage: string;
  updatedAt?: any;
  unread: number;
  ownerId?: string;
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

  constructor(private auth: Auth, public rooms: RoomService) {}

  ngOnInit(): void {
    const user = this.auth.currentUser;
    if (!user) {
      this.loading = false;
      return;
    }

    const myUid = user.uid;

    this.sub = this.rooms.myRooms$().subscribe({
      next: (roomsList: Room[]) => {
        this.chats = (roomsList || []).map((r) => ({
          id: r.id!,
          title:
            r.type === 'dm'
              ? r.members?.find((m) => m !== myUid) || 'Direct Message'
              : r.name || 'Room',
          type: r.type,
          lastMessage: r.lastMessage || '',
          updatedAt: r.updatedAt,
          unread: r.unread?.[myUid] || 0,
          ownerId: r.ownerId,
        }));

        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      },
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  trackByChatId(_: number, item: ChatItem) {
    return item.id;
  }

  iconByType(type: ChatItem['type']) {
    if (type === 'group') return '👥';
    if (type === 'channel') return '📢';
    return '💬';
  }

  // ======================================================
  // ✅ DELETE SINGLE CHAT FULL HISTORY
  // ======================================================
  async deleteChatHistory(c: ChatItem) {
    const myUid = this.auth.currentUser?.uid;
    if (!myUid) return;

    const ok = confirm(
      `Delete FULL chat history of "${c.title}"?\n\nThis will permanently delete room + all messages for everyone.`
    );
    if (!ok) return;

    try {
      // ✅ If group/channel and NOT owner => leave only
      if ((c.type === 'group' || c.type === 'channel') && c.ownerId !== myUid) {
        await this.rooms.leaveRoom(c.id, myUid);
        alert('✅ You left this group/channel');
        return;
      }

      // ✅ DM OR owner => delete fully (messages + room)
      await this.rooms.deleteRoomWithMessages(c.id);
      alert('✅ Chat deleted permanently!');
    } catch (e) {
      console.error(e);
      alert('❌ Failed to delete chat');
    }
  }

  // ======================================================
  // ✅ DELETE ALL CHATS FULL HISTORY (Account)
  // ======================================================
  async deleteAllChatsHistory() {
    const ok = confirm(
      `Delete ALL chats history?\n\nThis will permanently delete all your DMs.\nGroup chats will be deleted only if you are owner, otherwise you will leave them.`
    );
    if (!ok) return;

    try {
      await this.rooms.deleteAllMyChats();
      alert('✅ All chats deleted!');
    } catch (e) {
      console.error(e);
      alert('❌ Failed to delete all chats');
    }
  }
  
}
