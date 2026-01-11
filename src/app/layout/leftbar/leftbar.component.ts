import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-leftbar',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="leftbar">
      <div class="logo">💬</div>

      <a routerLink="/chat">💬</a>
      <a routerLink="/profile">👤</a>
      <a routerLink="/contact">⚙</a>

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
    }
    a {
      margin: 15px 0;
      font-size: 22px;
      color: #cbd5f5;
      text-decoration: none;
    }
    .logo {
      font-size: 26px;
      margin-bottom: 20px;
    }
    .bottom {
      margin-top: auto;
      cursor: pointer;
    }
  `]
})
export class LeftbarComponent {}
