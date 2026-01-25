import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Auth, onAuthStateChanged, signOut, deleteUser } from '@angular/fire/auth';
import { Subscription } from 'rxjs';

import { SettingsService, UserSettings } from '../../core/services/settings.service';
import { ThemeService } from '../../core/services/theme.service';

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
  toastType: 'ok' | 'err' = 'ok';

  // detect unsaved changes
  hasChanges = false;
  private originalSettings: UserSettings | null = null;

  settings: UserSettings = {
    uid: '',
    name: '',
    bio: '',
    phone: '',

    darkMode: true,
    themeColor: '#3b82f6', // ✅ custom main color

    notifyMessages: true,
    notifySound: true,

    showOnlineStatus: true,
    allowFriendRequests: true,
  };

  private sub?: Subscription;

  constructor(
    private auth: Auth,
    private router: Router,
    private settingsService: SettingsService,
    private theme: ThemeService
  ) {}

  ngOnInit(): void {
    onAuthStateChanged(this.auth, async (user) => {
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }

      this.uid = user.uid;

      // ✅ create settings doc if missing
      try {
        await this.settingsService.createDefaultIfMissing(user.uid, user.email || '');
      } catch (err) {
        console.error('❌ Default settings create error:', err);
      }

      // ✅ subscribe settings
      this.sub = this.settingsService.getSettings(user.uid).subscribe({
        next: (data) => {
          this.settings = {
            ...this.settings,
            ...data,
            uid: user.uid,
            themeColor: data?.themeColor || this.theme.getSavedColor(),
          };

          this.originalSettings = structuredClone(this.settings);
          this.hasChanges = false;
          this.loading = false;

          // ✅ apply theme instantly
          this.applyTheme();
          this.applyColor();
        },
        error: (err) => {
          console.error('❌ Firestore settings read failed:', err);
          this.loading = false;
          this.showToast("❌ Can't load settings. Check Firestore rules!", 'err');
        },
      });
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // ✅ UI titles
  getTabTitle() {
    switch (this.activeTab) {
      case 'profile': return '👤 Profile';
      case 'appearance': return '🎨 Appearance';
      case 'notifications': return '🔔 Notifications';
      case 'privacy': return '🛡️ Privacy';
      case 'account': return '🔐 Account';
      default: return '⚙️ Settings';
    }
  }

  getTabSubtitle() {
    switch (this.activeTab) {
      case 'profile': return 'Update your name, bio and phone';
      case 'appearance': return 'Dark/Light mode + Custom Color';
      case 'notifications': return 'Sounds and message alerts';
      case 'privacy': return 'Online status & requests';
      case 'account': return 'Logout or delete permanently';
      default: return 'Manage your Chatloop preferences';
    }
  }

  selectTab(tab: TabKey) {
    this.activeTab = tab;
  }

  // ✅ Detect changes (ignore uid)
  trackChanges() {
    if (!this.originalSettings) return;

    const { uid: _a, ...cur } = this.settings;
    const { uid: _b, ...orig } = this.originalSettings;

    this.hasChanges = JSON.stringify(cur) !== JSON.stringify(orig);
  }

  // ✅ Theme (dark/light)
  applyTheme() {
    this.theme.setMode(this.settings.darkMode ? 'dark' : 'light');
  }

  // ✅ Custom theme color
  applyColor() {
    this.theme.setThemeColor(this.settings.themeColor || '#3b82f6');
  }

  showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    this.toastMsg = msg;
    this.toastType = type;
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
      this.applyColor();

      this.showToast('✅ Settings saved!', 'ok');
    } catch (err) {
      console.error('❌ save error:', err);
      this.showToast('❌ Failed to save settings', 'err');
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
      this.showToast('✅ Account deleted', 'ok');
      this.router.navigate(['/register']);
    } catch (err) {
      console.error('❌ delete error:', err);
      this.showToast('❌ Delete failed. Logout + login again then try.', 'err');
    }
  }

  closeAll() {}
}
