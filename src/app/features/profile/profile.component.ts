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

  // ✅ avatar upload
  uploading = false;
  avatarErr = '';

  constructor(private profile: ProfileService) {
    this.profile.getMyProfile().subscribe(async (u) => {
      this.user = u;

      if (u) {
        this.reset(u);

        // ✅ share link
        this.profileLink = `chatloop://user/${u.uid}`;

        // ✅ generate QR
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
      await this.profile.updateMyProfile({
        name: this.form.name,
        phone: this.form.phone,
      });

      this.msg = '✅ Profile updated';
      this.editMode = false;

      setTimeout(() => (this.msg = ''), 2500);
    } catch (e: any) {
      this.err = e?.message || '❌ Update failed';
      setTimeout(() => (this.err = ''), 2500);
    }
  }

  // ✅ PICK + UPLOAD AVATAR
  async onPickAvatar(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.avatarErr = '';

    // ✅ only images
    if (!file.type.startsWith('image/')) {
      this.avatarErr = 'Please choose image file only';
      input.value = '';
      return;
    }

    // ✅ size limit 2MB
    const max = 2 * 1024 * 1024;
    if (file.size > max) {
      this.avatarErr = 'Image too large (Max 2MB)';
      input.value = '';
      return;
    }

    try {
      this.uploading = true;

      const url = await this.profile.updateAvatar(file);

      // ✅ update UI instantly
      if (this.user) {
        this.user = { ...this.user, photoURL: url };
      }

      this.msg = '✅ Photo updated';
      setTimeout(() => (this.msg = ''), 2000);
    } catch (err: any) {
      console.error(err);
      this.avatarErr = err?.message || 'Upload failed';
    } finally {
      this.uploading = false;
      input.value = '';
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
