import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-leftbar',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="leftbar">
      <div class="logo">❤️</div>

      <a routerLink="/app/chats" routerLinkActive="active">💬</a>
      <a routerLink="/app/profile" routerLinkActive="active">👤</a>
      <a routerLink="/app/settings" routerLinkActive="active">⚙</a>

      <div class="bottom">🚪</div>
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
      opacity: 0.85;
    }
  `]
})
export class LeftbarComponent {}
