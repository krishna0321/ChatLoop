import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';


type Tag = 'auth' | 'chat' | 'rooms' | 'ui' | 'security';
type FilterTag = 'all' | Tag;

type QA = {
  id: string;
  q: string;
  a: string;
  tag: Tag;
  icon: string;
  open?: boolean;
};

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.css',
})
export class FaqComponent {
  // ✅ UI State
  searchText = '';
  activeTag: FilterTag = 'all';

  // ✅ Filters UI
  tags: { key: FilterTag; label: string; icon: string }[] = [
    { key: 'all', label: 'All', icon: '✨' },
    { key: 'auth', label: 'Auth', icon: '🔐' },
    { key: 'chat', label: 'Chat', icon: '💬' },
    { key: 'rooms', label: 'Rooms', icon: '🧩' },
    { key: 'ui', label: 'UI', icon: '🎨' },
    { key: 'security', label: 'Security', icon: '🛡️' },
  ];

  // ✅ Questions
  items: QA[] = [
    {
      id: 'what-is',
      q: 'What is Chatloop?',
      a: 'Chatloop is a Telegram-like real-time chat application built using Angular 17 + Firebase (Firestore). It supports DM, Groups, Channels, Profile, Settings and premium UI.',
      tag: 'chat',
      icon: '💬',
      open: true,
    },
    {
      id: 'realtime',
      q: 'Is Chatloop real-time?',
      a: 'Yes ✅ Messages update instantly using Firebase Firestore real-time listeners.',
      tag: 'chat',
      icon: '⚡',
    },
    {
      id: 'login-register',
      q: 'How does Login/Register work?',
      a: 'Chatloop uses Firebase Authentication. Users can login/register securely and the app protects routes using authGuard.',
      tag: 'auth',
      icon: '🔐',
    },
    {
      id: 'rooms',
      q: 'What types of rooms are supported?',
      a: 'Chatloop supports DM (Direct Messages), Groups and Channels. Each room has owner/admin/members logic.',
      tag: 'rooms',
      icon: '🧩',
    },
    {
      id: 'mobile',
      q: 'Does Chatloop work on mobile?',
      a: 'Yes ✅ It is responsive and mobile-friendly with smooth UI layout.',
      tag: 'ui',
      icon: '📱',
    },
    {
      id: 'theme',
      q: 'Does Chatloop support Dark/Light Mode?',
      a: 'Yes ✅ Using global CSS theme variables (styles.css), you can switch complete app theme.',
      tag: 'ui',
      icon: '🌙',
    },
    {
      id: 'secure',
      q: 'Is Chatloop secure?',
      a: 'Yes. Firebase Authentication + Firestore rules protect users and private chat rooms/messages.',
      tag: 'security',
      icon: '🛡️',
    },
    {
      id: 'profile',
      q: 'Can users edit profile photo and name?',
      a: 'Yes ✅ Users can update profile info inside Profile/Settings pages.',
      tag: 'auth',
      icon: '👤',
    },
  ];

  // ✅ Filter Logic
  get filtered(): QA[] {
    const q = this.searchText.trim().toLowerCase();

    return this.items.filter((x) => {
      const byTag = this.activeTag === 'all' ? true : x.tag === this.activeTag;

      const bySearch =
        !q ||
        x.q.toLowerCase().includes(q) ||
        x.a.toLowerCase().includes(q) ||
        x.tag.toLowerCase().includes(q);

      return byTag && bySearch;
    });
  }

  // ✅ Actions
  setTag(tag: FilterTag) {
    this.activeTag = tag;
  }

  clearSearch() {
    this.searchText = '';
  }

  toggle(id: string) {
    this.items = this.items.map((x) =>
      x.id === id ? { ...x, open: !x.open } : x
    );
  }

  expandAll() {
    const ids = new Set(this.filtered.map((x) => x.id));
    this.items = this.items.map((x) =>
      ids.has(x.id) ? { ...x, open: true } : x
    );
  }

  collapseAll() {
    const ids = new Set(this.filtered.map((x) => x.id));
    this.items = this.items.map((x) =>
      ids.has(x.id) ? { ...x, open: false } : x
    );
  }

  // ✅ Stats
  get totalCount() {
    return this.items.length;
  }

  get visibleCount() {
    return this.filtered.length;
  }
}
