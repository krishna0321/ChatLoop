import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { signOut } from 'firebase/auth';

@Component({
  selector: 'app-leftbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="nav">

      <!-- GLOW BG -->
      <div class="navGlow"></div>

      <!-- BRAND -->
      <div class="brand" title="Chatloop">
        <div class="logo">🫧</div>
      </div>

      <!-- LINKS -->
      <div class="links">
        <a
          class="item"
          routerLink="/app/chats"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
          title="Chats"
          data-tip="Chats"
        >
          <span class="ico">💬</span>
        </a>

        <a
          class="item"
          routerLink="/app/users"
          routerLinkActive="active"
          title="Users"
          data-tip="Users"
        >
          <span class="ico">👥</span>
        </a>

        <a
          class="item"
          routerLink="/app/contact"
          routerLinkActive="active"
          title="Contacts"
          data-tip="Contacts"
        >
          <span class="ico">📞</span>
        </a>

        <a
          class="item"
          routerLink="/app/profile"
          routerLinkActive="active"
          title="Profile"
          data-tip="Profile"
        >
          <span class="ico">👤</span>
        </a>

        <a
          class="item"
          routerLink="/app/settings"
          routerLinkActive="active"
          title="Settings"
          data-tip="Settings"
        >
          <span class="ico">⚙️</span>
        </a>

        <!-- CREATE -->
        <a
          class="item create"
          routerLink="/app/group/create"
          routerLinkActive="active"
          title="Create"
          data-tip="Create"
        >
          <span class="ico">➕</span>
        </a>
      </div>

      <!-- FOOTER -->
      <div class="footer">
        <button
          class="logout"
          (click)="logout()"
          [disabled]="loading"
          title="Logout"
          data-tip="Logout"
        >
          <span class="ico">{{ loading ? '⏳' : '🚪' }}</span>
        </button>
      </div>

    </nav>
  `,
  styles: [`
    :host{
      display:block;
      height:100%;
    }

    :root{
      --theme:#7c3aed;
      --theme-2:#3b82f6;

      --bg: rgba(2,6,23,0.88);
      --bg2: rgba(15,23,42,0.72);

      --border: rgba(255,255,255,0.08);
      --text: rgba(226,232,240,0.92);
      --muted: rgba(226,232,240,0.55);

      --glow: color-mix(in srgb, var(--theme) 40%, transparent);
    }

    /* ============================
       DESKTOP LEFT NAV
    ============================ */
    .nav{
      width:76px;
      height:100vh;
      position:sticky;
      top:0;
      z-index:1000;

      display:flex;
      flex-direction:column;
      align-items:center;

      padding: 10px 10px 14px;

      background: var(--bg);
      border-right: 1px solid var(--border);
      backdrop-filter: blur(16px);
      overflow:hidden;
    }

    .navGlow{
      position:absolute;
      inset:0;
      pointer-events:none;
      background:
        radial-gradient(circle at 50% 12%, var(--glow), transparent 55%),
        radial-gradient(circle at 50% 85%, color-mix(in srgb, var(--theme-2) 30%, transparent), transparent 60%);
      filter: blur(50px);
      opacity: .9;
    }

    .brand{
      position:relative;
      z-index:2;
      margin-bottom: 14px;
    }

    .logo{
      width:52px;
      height:52px;
      border-radius:20px;
      display:grid;
      place-items:center;
      font-size:22px;
      font-weight:1000;

      background: linear-gradient(135deg, var(--theme), var(--theme-2));
      border: 1px solid rgba(255,255,255,0.14);
      box-shadow:
        0 18px 55px var(--glow),
        inset 0 1px 0 rgba(255,255,255,0.10);

      transform: translateZ(0);
      animation: pop .55s ease;
    }

    @keyframes pop{
      from{ transform:scale(.92); opacity:.7; }
      to{ transform:scale(1); opacity:1; }
    }

    .links{
      position:relative;
      z-index:2;
      display:flex;
      flex-direction:column;
      gap: 8px;
      width:100%;
      align-items:center;
      padding: 6px 0;
      flex:1;
    }

    .item{
      width:52px;
      height:52px;
      border-radius:20px;

      display:grid;
      place-items:center;

      text-decoration:none;
      color: var(--text);
      font-size:22px;

      position:relative;
      border:1px solid transparent;
      background: rgba(255,255,255,0.04);

      transition: .18s ease;
      cursor:pointer;
      overflow:hidden;
    }

    /* glow shine */
    .item::after{
      content:"";
      position:absolute;
      inset:0;
      background: linear-gradient(
        120deg,
        transparent 25%,
        rgba(255,255,255,0.16),
        transparent 70%
      );
      opacity:0;
      transform: translateX(-40%);
      transition:.25s ease;
    }

    .item:hover{
      transform: translateY(-2px);
      background: rgba(255,255,255,0.07);
      border-color: rgba(255,255,255,0.10);
    }

    .item:hover::after{
      opacity:1;
      transform: translateX(40%);
    }

    /* Active state: Telegram-like indicator */
    .item.active{
      background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--theme) 30%, transparent),
        color-mix(in srgb, var(--theme-2) 18%, transparent)
      );
      border-color: color-mix(in srgb, var(--theme) 45%, rgba(255,255,255,0.12));
      box-shadow: 0 18px 55px color-mix(in srgb, var(--theme) 25%, transparent);
      color:#fff;
    }

    .item.active::before{
      content:"";
      position:absolute;
      left:0;
      top: 14px;
      bottom: 14px;
      width: 4px;
      border-radius: 999px;
      background: linear-gradient(180deg, var(--theme), var(--theme-2));
      box-shadow: 0 0 18px var(--glow);
    }

    /* Create special */
    .item.create{
      background: linear-gradient(135deg, var(--theme), var(--theme-2));
      border: 1px solid rgba(255,255,255,0.14);
      box-shadow: 0 18px 60px var(--glow);
      color:white;
      font-weight:1000;
      margin-top: 10px;
    }

    .item.create:hover{
      transform: translateY(-3px) scale(1.02);
      filter: brightness(1.06);
    }

    .footer{
      position:relative;
      z-index:2;
      width:100%;
      display:flex;
      justify-content:center;
      padding-top: 10px;
    }

    .logout{
      width:52px;
      height:52px;
      border-radius:20px;
      display:grid;
      place-items:center;

      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.10);
      color:white;
      font-size:22px;
      cursor:pointer;
      transition:.18s ease;
    }

    .logout:hover{
      transform: translateY(-2px);
      background: rgba(255,255,255,0.09);
    }

    .logout:disabled{
      opacity:.6;
      cursor:not-allowed;
      transform:none;
    }

    /* ============================
       TOOLTIP (desktop only)
    ============================ */
    @media (min-width: 901px){
      .item[data-tip]::before,
      .logout[data-tip]::before{
        content: attr(data-tip);
        position:absolute;
        left: 72px;
        top: 50%;
        transform: translateY(-50%);

        padding: 8px 10px;
        border-radius: 14px;

        font-size:12px;
        font-weight: 950;
        letter-spacing:.2px;

        background: rgba(2,6,23,0.94);
        border:1px solid rgba(255,255,255,0.12);
        color:white;
        opacity:0;
        pointer-events:none;
        white-space:nowrap;
        box-shadow: 0 16px 60px rgba(0,0,0,0.55);

        transition: .18s ease;
      }

      .item:hover::before,
      .logout:hover::before{
        opacity:1;
      }
    }

    /* ============================
       MOBILE: convert to bottom bar
    ============================ */
    @media (max-width: 900px){
      .nav{
        width:100%;
        height:72px;

        flex-direction:row;
        justify-content:space-between;
        align-items:center;

        position:fixed;
        bottom:0;
        left:0;
        top:auto;

        padding: 10px 12px;
        border-right:none;
        border-top: 1px solid var(--border);
      }

      .brand{
        display:none;
      }

      .links{
        width:100%;
        flex-direction:row;
        justify-content:space-around;
        gap: 8px;
        padding: 0;
      }

      .footer{
        display:none;
      }

      .item{
        width:46px;
        height:46px;
        border-radius:16px;
        background: rgba(255,255,255,0.04);
      }

      /* Bottom indicator on active */
      .item.active::before{
        left: 50%;
        top: auto;
        bottom: 6px;
        transform: translateX(-50%);
        height: 4px;
        width: 18px;
        border-radius: 999px;
      }

      /* Create FAB */
      .item.create{
        width:54px;
        height:54px;
        border-radius:20px;
        transform: translateY(-16px);
        box-shadow:
          0 22px 70px var(--glow),
          0 8px 28px rgba(0,0,0,0.45);
      }
      .item.create:hover{
        transform: translateY(-18px) scale(1.03);
      }
    }
  `],
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
      console.error('Logout error:', err);
    } finally {
      this.loading = false;
    }
  }
}
