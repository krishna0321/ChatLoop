import { Routes } from '@angular/router';

import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { AppLayoutComponent } from './layouts/app-layout/app-layout.component';

import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';

import { authGuard } from './core/guards/auth.guard';

import { ProfileComponent } from './features/profile/profile.component';
import { SettingsComponent } from './features/settings/settings.component';
import { UsersComponent } from './features/users/users.component';
import { ChatsComponent } from './features/chats/chats.component';
import { ContactComponent } from './features/contact/contact.component';


export const routes: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
    ],
  },

  {
    path: 'app',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'chats', pathMatch: 'full' },
      { path: 'chats', component: ChatsComponent },

      { path: 'chats', component: ChatsComponent },
      { path: 'users', component: UsersComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'settings', component: SettingsComponent },
      { path: 'contact', component: ContactComponent },

    ],
  },

  { path: '**', redirectTo: 'login' },
];
