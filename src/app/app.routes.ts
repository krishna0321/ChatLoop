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

  // ✅ APP LAYOUT (Protected)
  {
    path: 'app',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'chats', pathMatch: 'full' },

      // ✅ pages
      {
        path: 'chats',
        loadComponent: () =>
          import('./features/chats/chats.component').then((m) => m.ChatsComponent),
      },
      {
        path: 'chat/:id',
        loadComponent: () =>
          import('./features/chat/chat-room/chat-room.component').then(
            (m) => m.ChatRoomComponent
          ),
      },
      {
        path: 'create-room',
        loadComponent: () =>
          import('./features/chats/create-room/create-room.component').then(
            (m) => m.CreateRoomComponent
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then((m) => m.SettingsComponent),
      },
      {
        path: 'contact',
        loadComponent: () =>
          import('./features/contact/contact.component').then((m) => m.ContactComponent),
      },
      {
  path: 'app/user/:uid',
  loadComponent: () =>
    import('./features/users/user-profile/user-profile.component').then(
      (m) => m.UserProfileComponent
    ),
}

    ],
  },

  // ✅ fallback
  { path: '**', redirectTo: 'login' },
];
