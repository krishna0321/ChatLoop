import { Injectable } from '@angular/core';

export type ThemeMode = 'dark' | 'light';
@Injectable({ providedIn: 'root' })
export class ThemeService 
{

  private MODE_KEY  = 'chatloop_theme_mode';
  private COLOR_KEY = 'chatloop_theme_color';

  initTheme() 
  {
    const mode  = (localStorage.getItem(this.MODE_KEY) as any) || 'dark';
    const color = localStorage.getItem(this.COLOR_KEY) || '#6366f1';

    this.setMode(mode, false);
    this.setThemeColor(color, false);
  }

  setMode(mode: 'dark' | 'light', persist = true)
   {
    document.body.classList.toggle('dark-mode', mode === 'dark');
    document.body.classList.toggle('light-mode', mode === 'light');

    if (persist) localStorage.setItem(this.MODE_KEY, mode);
  }

  setThemeColor(color: string, persist = true) 
  {
    document.documentElement.style.setProperty('--theme', color);

    if (persist) localStorage.setItem(this.COLOR_KEY, color);
  }

  getSavedColor() 
  {
    return localStorage.getItem(this.COLOR_KEY) || '#6366f1';
  }

  getSavedMode() 
  {
    return (localStorage.getItem(this.MODE_KEY) as any) || 'dark';
  }
}