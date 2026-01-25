import { Injectable } from '@angular/core';

export type ThemeMode = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {

  private COLOR_KEY = 'chatloop_theme_color';
  private MODE_KEY  = 'chatloop_theme_mode';

// INIT (CALL ON APP START)

 initTheme() {
  const savedMode  = localStorage.getItem('chatloop_theme_mode') || 'dark';
  const savedColor = localStorage.getItem('chatloop_theme_color') || '#3b82f6';

  this.setMode(savedMode as any, false);
  this.setThemeColor(savedColor, false);
}

   
  // MODE (dark / light)
  setMode(mode: ThemeMode, persist = true) {
    const body = document.body;

    body.classList.remove('dark-mode', 'light-mode');
    body.classList.add(mode === 'dark' ? 'dark-mode' : 'light-mode');

    if (persist) {
      localStorage.setItem(this.MODE_KEY, mode);
    }
  }

   
  // COLOR (main theme color)
  setThemeColor(color: string, persist = true) {
    document.documentElement.style.setProperty('--theme', color);

    if (persist) {
      localStorage.setItem(this.COLOR_KEY, color);
    }
  }

  // HELPERS
  getSavedColor(): string {
    return localStorage.getItem(this.COLOR_KEY) || '#3b82f6';
  }

  getSavedMode(): ThemeMode {
    return (localStorage.getItem(this.MODE_KEY) as ThemeMode) || 'dark';
  }
}
