import { Injectable } from '@angular/core';

export type ThemeMode = 'dark' | 'light';

export type ThemePreset =
  | 'mint'
  | 'blue'
  | 'purple'
  | 'red'
  | 'yellow';

@Injectable({ providedIn: 'root' })
export class ThemeService {

  private MODE_KEY   = 'chatloop_theme_mode';
  private COLOR_KEY  = 'chatloop_theme_color';
  private PRESET_KEY = 'chatloop_theme_preset';

  private presets: Record<ThemePreset, string> = {
    mint:   '#10b981',
    blue:   '#3b82f6',
    purple: '#8b5cf6',
    red:    '#ef4444',
    yellow: '#facc15'
  };


  initTheme() {
    const mode   = (localStorage.getItem(this.MODE_KEY) as ThemeMode) || 'dark';

    const preset =
      (localStorage.getItem(this.PRESET_KEY) as ThemePreset) || 'mint';

    const customColor = localStorage.getItem(this.COLOR_KEY);

    this.setMode(mode, false);

    if (customColor) {
      this.setCustomColor(customColor, false);
    } else {
      this.setPreset(preset, false);
    }
  }

  setMode(mode: ThemeMode, persist = true) {
    document.body.classList.toggle('dark-mode', mode === 'dark');
    document.body.classList.toggle('light-mode', mode === 'light');

    if (persist) localStorage.setItem(this.MODE_KEY, mode);
  }

  setPreset(preset: ThemePreset, persist = true) {

    const color = this.presets[preset];

    document.documentElement.style.setProperty('--theme', color);

    if (persist) {
      localStorage.setItem(this.PRESET_KEY, preset);
      localStorage.setItem(this.COLOR_KEY, color);
    }
  }
  setCustomColor(color: string, persist = true) {

    document.documentElement.style.setProperty('--theme', color);

    if (persist) {
      localStorage.setItem(this.COLOR_KEY, color);
      localStorage.removeItem(this.PRESET_KEY);
    }
  }

  getMode(): ThemeMode {
    return (localStorage.getItem(this.MODE_KEY) as ThemeMode) || 'dark';
  }

  getPreset(): ThemePreset {
    return (localStorage.getItem(this.PRESET_KEY) as ThemePreset) || 'mint';
  }

  getColor(): string {
    return localStorage.getItem(this.COLOR_KEY) || '#10b981';
  }

  getSavedColor(): string {
    return this.getColor();
  }

  setThemeColor(color: string) {
    this.setCustomColor(color);
  }
}
