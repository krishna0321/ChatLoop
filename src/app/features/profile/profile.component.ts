import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import QRCode from 'qrcode';
import { ProfileService, ProfileUser } from '../../core/services/profile.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent {
  user: ProfileUser | null = null;

  editMode = false;

  form = {
    name: '',
    phone: '',
  };

  msg = '';
  err = '';

  qrDataUrl = '';
  profileLink = '';

  constructor(private profile: ProfileService) {
    this.profile.getMyProfile().subscribe(async (u) => {
      this.user = u;

      if (u) {
        this.reset(u);

        // ✅ Share link
        this.profileLink = `chatloop://user/${u.uid}`;

        // ✅ Generate QR
        this.qrDataUrl = await QRCode.toDataURL(this.profileLink, {
          width: 220,
          margin: 1,
        });
      }
    });
  }

  toggleEdit() {
    this.editMode = !this.editMode;
    this.msg = '';
    this.err = '';
  }

  reset(u: ProfileUser) {
    this.form.name = u.name || '';
    this.form.phone = u.phone || '';
  }

  async save() {
    this.msg = '';
    this.err = '';

    try {
      await this.profile.updateMyProfile(this.form);
      this.msg = '✅ Profile updated';
      this.editMode = false;

      setTimeout(() => (this.msg = ''), 2500);
    } catch (e: any) {
      this.err = e?.message || '❌ Update failed';
      setTimeout(() => (this.err = ''), 2500);
    }
  }

  async copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text || '');
      this.msg = '✅ Copied';
      setTimeout(() => (this.msg = ''), 1500);
    } catch {
      this.err = '❌ Copy failed';
      setTimeout(() => (this.err = ''), 1500);
    }
  }
}
