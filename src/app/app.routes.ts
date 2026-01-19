import { Routes } from '@angular/router';

import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { AppLayoutComponent } from './layouts/app-layout/app-layout.component';

import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';

import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // ✅ AUTH LAYOUT
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
    ],
  },

  // ✅ MAIN APP LAYOUT
  {
    path: 'app',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'chats', pathMatch: 'full' },

      // ✅ CHATS
      {
        path: 'chats',
        loadComponent: () =>
          import('./features/chats/chats.component').then((m) => m.ChatsComponent),
      },

      // ✅ DM / ROOM CHAT
      {
        path: 'chat/:id',
        loadComponent: () =>
          import('./features/chat/chat-room/chat-room.component').then(
            (m) => m.ChatRoomComponent
          ),
      },

      // ✅ CREATE ROOM
      {
        path: 'create-room',
        loadComponent: () =>
          import('./features/chats/create-room/create-room.component').then(
            (m) => m.CreateRoomComponent
          ),
      },

      // ✅ GROUP SYSTEM
      {
        path: 'group/create',
        loadComponent: () =>
          import('./features/group/create-group/create-group.component').then(
            (m) => m.CreateGroupComponent
          ),
      },
      {
        path: 'group/:id',
        loadComponent: () =>
          import('./features/group/group-chat/group-chat.component').then(
            (m) => m.GroupChatComponent
          ),
      },
      {
        path: 'group/:id/info',
        loadComponent: () =>
          import('./features/group/group-info/group-info.component').then(
            (m) => m.GroupInfoComponent
          ),
      },
      {
        path: 'group/:id/add-members',
        loadComponent: () =>
          import('./features/group/add-members/add-members.component').then(
            (m) => m.AddMembersComponent
          ),
      },

      // ✅ USERS
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/users.component').then((m) => m.UsersComponent),
      },

      // ✅ USER PROFILE
      {
        path: 'user/:uid',
        loadComponent: () =>
          import('./features/users/user-profile/user-profile.component').then(
            (m) => m.UserProfileComponent
          ),
      },

      // ✅ PROFILE
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then(
            (m) => m.ProfileComponent
          ),
      },

      // ✅ SETTINGS
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then(
            (m) => m.SettingsComponent
          ),
      },

      // ✅ CONTACT
      {
        path: 'contact',
        loadComponent: () =>
          import('./features/contact/contact.component').then(
            (m) => m.ContactComponent
          ),
      },
    ],
  },

  // ✅ FALLBACK
  { path: '**', redirectTo: '/login' },
];
