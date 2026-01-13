import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { signOut } from 'firebase/auth';

@Component({
  selector: 'app-leftbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="leftbar">
      <div class="logo">❤️</div>

      <a routerLink="/app/chats" routerLinkActive="active">💬</a>
      <a routerLink="/app/profile" routerLinkActive="active">👤</a>
      <a routerLink="/app/settings" routerLinkActive="active">⚙</a>
      <a routerLink="/app/contact" routerLinkActive="active">📞</a>

      <a class="createBtn" routerLink="/app/create-room" routerLinkActive="active">➕</a>
      <a routerLink="/app/users" routerLinkActive="active">👥</a>

      <!-- ✅ Logout button -->
      <button class="bottom logoutBtn" (click)="logout()" [disabled]="loading" title="Logout">
        {{ loading ? '...' : '🚪' }}
      </button>
    </div>
  `,
  styles: [`
    .leftbar {
      width: 70px;
      background: #0b1220;
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px;
      color: white;
      flex-shrink: 0;
    }

    a {
      margin: 15px 0;
      font-size: 22px;
      color: #cbd5f5;
      text-decoration: none;
      padding: 10px;
      border-radius: 12px;
      transition: 0.15s;
    }

    a:hover {
      background: rgba(255,255,255,0.06);
    }

    a.active {
      background: rgba(37,99,235,0.2);
      color: #fff;
    }

    .logo {
      font-size: 26px;
      margin-bottom: 20px;
    }

    .bottom {
      margin-top: auto;
      cursor: pointer;
      opacity: 0.9;
      background: transparent;
      border: none;
      color: white;
      font-size: 22px;
      padding: 12px;
      border-radius: 14px;
      transition: 0.2s;
    }

    .bottom:hover {
      background: rgba(255,255,255,0.06);
    }

    .bottom:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class LeftbarComponent {

  loading = false;

  constructor(private auth: Auth, private router: Router) {}

  async logout() {
    try {
      this.loading = true;
      await signOut(this.auth);
      await this.router.navigate(['/login']);
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      this.loading = false;
    }
  }
}
