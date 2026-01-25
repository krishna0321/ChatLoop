import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

type Highlight = {
  title: string;
  icon: string;
  desc: string;
};

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css',
})
export class AboutComponent {
  year = new Date().getFullYear();

  // ✅ Creator / College Project Info
  creatorName = 'Krishna Pathak';
  projectType = 'College Project';
  appName = 'Chatloop';

  highlights: Highlight[] = [
    {
      title: 'Real-time Messaging',
      icon: '⚡',
      desc: 'Chatloop uses Firebase Firestore so messages update instantly without refresh.',
    },
    {
      title: 'Secure Authentication',
      icon: '🔐',
      desc: 'Firebase Authentication handles login/register and route protection.',
    },
    {
      title: 'Rooms System',
      icon: '🧩',
      desc: 'Supports DM, Groups and Channels with members/admin/owner logic.',
    },
    {
      title: 'Premium UI Experience',
      icon: '✨',
      desc: 'Telegram-like UI with modern theme variables and responsive layout.',
    },
  ];

  techStack = [
    { label: 'Frontend', value: 'Angular 17 (Standalone Components)' },
    { label: 'Backend', value: 'Firebase' },
    { label: 'Database', value: 'Firestore (Realtime)' },
    { label: 'Auth', value: 'Firebase Authentication' },
    { label: 'UI', value: 'Premium Telegram-like Design' },
  ];
}
