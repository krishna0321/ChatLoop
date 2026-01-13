import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private storageKey = 'chatloop_theme_dark';

  initTheme() {
    const saved = localStorage.getItem(this.storageKey);
    const darkMode = saved ? JSON.parse(saved) : true;
    this.setDarkMode(darkMode);
  }

  setDarkMode(isDark: boolean) {
    localStorage.setItem(this.storageKey, JSON.stringify(isDark));
    document.body.classList.toggle('dark-mode', isDark);
  }

  saveLocalSettings(settings: any) {
    localStorage.setItem('chatloop_settings', JSON.stringify(settings));
  }

  getLocalSettings() {
    const s = localStorage.getItem('chatloop_settings');
    return s ? JSON.parse(s) : null;
  }
}
