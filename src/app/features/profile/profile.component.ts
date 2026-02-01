import { Component, OnInit } from '@angular/core';
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
export class ProfileComponent implements OnInit {

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

  uploading = false;
  avatarErr = '';

  previewAvatar: string | null = null;

  constructor(private profile: ProfileService) {}

  // 🔥 LIVE PROFILE (Telegram style)
  ngOnInit() {
    this.profile.getMyProfile().subscribe(async (u) => {
      this.user = u;
      if (!u) return;

      this.form.name = u.name || '';
      this.form.phone = u.phone || '';

      const base = window.location.origin;
      this.profileLink = `${base}/u/${u.uid}`;

      try {
        this.qrDataUrl = await QRCode.toDataURL(this.profileLink, {
          width: 220,
          margin: 1,
        });
      } catch {
        this.qrDataUrl = '';
      }
    });
  }

  toggleEdit() {
    this.editMode = !this.editMode;
    this.msg = '';
    this.err = '';
    this.avatarErr = '';
  }

  async save() {
    this.msg = '';
    this.err = '';

    if (this.form.name.trim().length < 2) {
      this.err = '❌ Name too short';
      return;
    }

    try {
      await this.profile.updateMyProfile({
        name: this.form.name.trim(),
        phone: this.form.phone.trim(),
      });

      this.msg = '✅ Profile updated';
      this.editMode = false;

      setTimeout(() => this.msg = '', 2000);

    } catch (e: any) {
      this.err = e?.message || 'Update failed';
    }
  }

  // 📸 INSTANT avatar update
  async onPickAvatar(e: Event) {

    if (this.uploading) return;

    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.avatarErr = '';
    this.msg = '';
    this.err = '';

    if (!file.type.startsWith('image/')) {
      this.avatarErr = 'Image only';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.avatarErr = 'Max 2MB';
      return;
    }

    // ⚡ instant preview
    this.previewAvatar = URL.createObjectURL(file);

    try {
      this.uploading = true;

      await this.profile.updateAvatar(file);

      this.msg = '✅ Photo updated';

      setTimeout(() => this.msg = '', 2000);

      setTimeout(() => {
        URL.revokeObjectURL(this.previewAvatar!);
        this.previewAvatar = null;
      }, 800);

    } catch (err: any) {
      this.avatarErr = err?.message || 'Upload failed';

    } finally {
      this.uploading = false;
    }
  }

  async copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text || '');
      this.msg = '✅ Copied';
      setTimeout(() => this.msg = '', 1500);
    } catch {
      this.err = '❌ Copy failed';
    }
  }
}
