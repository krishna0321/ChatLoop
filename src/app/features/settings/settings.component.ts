import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { signOut, deleteUser } from '@angular/fire/auth';

import { Subscription } from 'rxjs';
import { SettingsService, UserSettings } from '../../core/services/settings.service';

type TabKey = 'profile' | 'appearance' | 'notifications' | 'privacy' | 'account';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent implements OnInit, OnDestroy {
  loading = true;
  saving = false;

  uid: string | null = null;
  activeTab: TabKey = 'profile';

  // toast
  toastMsg = '';
  toastVisible = false;

  // detect unsaved changes
  hasChanges = false;
  private originalSettings: UserSettings | null = null;

  settings: UserSettings = {
    uid: '',
    name: '',
    bio: '',
    phone: '',
    darkMode: true,
    notifyMessages: true,
    notifySound: true,
    showOnlineStatus: true,
    allowFriendRequests: true,
  };

  private sub?: Subscription;

  constructor(
    private auth: Auth,
    private router: Router,
    private settingsService: SettingsService
  ) {}

  ngOnInit() {
    onAuthStateChanged(this.auth, async (user) => {
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }

      this.uid = user.uid;

      try {
        // ✅ Create default doc if missing
        await this.settingsService.createDefaultIfMissing(user.uid, user.email || '');
      } catch (err) {
        console.error('❌ Default settings create error:', err);
      }

      this.sub = this.settingsService.getSettings(user.uid).subscribe({
        next: (data) => {
          // ✅ Merge + keep UI defaults
          this.settings = { ...this.settings, ...data, uid: user.uid };

          // ✅ clone for comparison
          this.originalSettings = structuredClone(this.settings);
          this.hasChanges = false;

          this.loading = false;
          this.applyTheme();
        },
        error: (err) => {
          console.error('❌ Firestore settings read failed:', err);
          this.loading = false;
          this.showToast("❌ Can't load settings. Check Firestore rules!");
        },
      });
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  selectTab(tab: TabKey) {
    this.activeTab = tab;
  }

  // ✅ runs every time user changes something
  trackChanges() {
    if (!this.originalSettings) return;

    this.hasChanges =
      JSON.stringify(this.settings) !== JSON.stringify(this.originalSettings);
  }

  applyTheme() {
    const body = document.body;
    if (this.settings.darkMode) body.classList.add('dark-mode');
    else body.classList.remove('dark-mode');
  }

  showToast(msg: string) {
    this.toastMsg = msg;
    this.toastVisible = true;

    setTimeout(() => {
      this.toastVisible = false;
    }, 2500);
  }

  async save() {
    if (!this.uid) return;

    this.saving = true;
    try {
      await this.settingsService.saveSettings(this.uid, this.settings);

      this.originalSettings = structuredClone(this.settings);
      this.hasChanges = false;

      this.applyTheme();
      this.showToast('✅ Settings saved!');
    } catch (err) {
      console.error('❌ save error:', err);
      this.showToast('❌ Failed to save settings');
    } finally {
      this.saving = false;
    }
  }

  async logout() {
    await signOut(this.auth);
    this.router.navigate(['/login']);
  }

  async deleteAccount() {
    const user = this.auth.currentUser;
    if (!user) return;

    const ok = confirm('⚠ Are you sure you want to delete your account permanently?');
    if (!ok) return;

    try {
      await deleteUser(user);
      this.showToast('✅ Account deleted');
      this.router.navigate(['/register']);
    } catch (err) {
      console.error('❌ delete error:', err);
      this.showToast('❌ Delete failed. Logout + login again then try.');
    }
  }
}
