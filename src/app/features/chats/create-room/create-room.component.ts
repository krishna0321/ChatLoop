import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { RoomService, RoomType } from '../../../core/services/room.service';

@Component({
  selector: 'app-create-room',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './create-room.component.html',
  styleUrls: ['./create-room.component.css'],
})
export class CreateRoomComponent {
  type: Extract<RoomType, 'group' | 'channel'> = 'group';

  name = '';
  description = '';

  loading = false;
  msg = '';
  err = '';

  constructor(private rooms: RoomService, private router: Router) {}

  selectType(t: 'group' | 'channel') {
    this.type = t;
    this.msg = '';
    this.err = '';
  }

  validate(): string {
    const name = this.name.trim();
    const desc = this.description.trim();

    if (!name) return 'Please enter group/channel name';
    if (name.length < 3) return 'Name must be at least 3 characters';
    if (name.length > 30) return 'Name must be max 30 characters';
    if (desc.length > 120) return 'Description must be max 120 characters';

    return '';
  }

  async create() {
    this.msg = '';
    this.err = '';

    const v = this.validate();
    if (v) {
      this.err = v;
      return;
    }

    try {
      this.loading = true;

      const roomId = await this.rooms.createRoom({
        type: this.type,
        name: this.name.trim(),
        description: this.description.trim(),
        members: [],
      });

      this.msg = 'Created ✅';

      await this.router.navigate(['/app/chats'], {
        queryParams: { room: roomId },
      });
    } catch (e: any) {
      console.error(e);
      this.err = e?.message || 'Create failed';
    } finally {
      this.loading = false;
    }
  }
}
