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
    <nav class="leftbar">

      <!-- LOGO -->
      <div class="logo" title="Chatloop">❤️</div>

      <!-- LINKS -->
      <a
        routerLink="/app/chats"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: true }"
        title="Chats"
      >
        💬
      </a>

      <a routerLink="/app/users" routerLinkActive="active" title="Users">
        👥
      </a>

      <a routerLink="/app/contact" routerLinkActive="active" title="Contacts">
        📞
      </a>

      <a routerLink="/app/profile" routerLinkActive="active" title="Profile">
        👤
      </a>

      <a routerLink="/app/settings" routerLinkActive="active" title="Settings">
        ⚙
      </a>
    
      <!-- CREATE ROOM / GROUP -->
      <a
        class="createBtn"
        routerLink="/app/group/create"
        routerLinkActive="active"
        title="Create Group / Channel"
      >
        ➕
      </a>

      <!-- LOGOUT -->
      <button
        class="bottom logoutBtn"
        (click)="logout()"
        [disabled]="loading"
        title="Logout"
      >
        {{ loading ? '⏳' : '🚪' }}
      </button>
    </nav>
  `,
  styles: [`
    :host{
      display:block;
    }

    .leftbar{
      width:70px;
      height:100vh;
      flex-shrink:0;
      display:flex;
      flex-direction:column;
      align-items:center;
      padding:10px;

      background: rgba(2, 6, 23, 0.85);
      border-right: 1px solid rgba(255,255,255,0.06);
      backdrop-filter: blur(14px);
      position: sticky;
      top:0;
      z-index: 50;
    }

    .logo{
      width:46px;
      height:46px;
      border-radius:18px;
      display:grid;
      place-items:center;
      font-size:26px;
      margin-bottom: 16px;

      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.10);
      box-shadow: 0 16px 45px rgba(0,0,0,0.35);
    }

    a{
      width:46px;
      height:46px;
      border-radius:18px;
      display:grid;
      place-items:center;

      margin: 10px 0;
      font-size:22px;
      color: rgba(226,232,240,0.9);
      text-decoration:none;

      transition: 0.16s ease;
      border: 1px solid transparent;
      position: relative;
    }

    a:hover{
      transform: translateY(-1px);
      background: rgba(255,255,255,0.07);
      border-color: rgba(255,255,255,0.08);
    }

    a.active{
      background: rgba(37,99,235,0.18);
      border-color: rgba(37,99,235,0.30);
      box-shadow: 0 18px 55px rgba(37,99,235,0.12);
      color: #fff;
    }

    /* Create button */
    .createBtn{
      margin-top: 16px;
      background: linear-gradient(135deg, rgba(37,99,235,0.8), rgba(139,92,246,0.55));
      border: 1px solid rgba(255,255,255,0.12);
      box-shadow: 0 18px 65px rgba(37,99,235,0.22);
      color: white;
      font-weight: 1000;
    }
    .createBtn:hover{
      transform: translateY(-2px);
      filter: brightness(1.05);
    }

    /* Bottom logout */
    .bottom{
      margin-top:auto;

      width:46px;
      height:46px;
      border-radius:18px;
      display:grid;
      place-items:center;

      cursor:pointer;
      border: 1px solid rgba(255,255,255,0.10);
      background: rgba(255,255,255,0.05);
      color:white;
      font-size:22px;

      transition:.16s ease;
    }

    .bottom:hover{
      background: rgba(255,255,255,0.10] );
      transform: translateY(-1px);
    }

    .bottom:disabled{
      opacity:.6;
      cursor:not-allowed;
      transform:none;
    }

    /* ===========================
       ✅ MOBILE: convert to bottom bar
    ============================ */
    @media (max-width: 900px){
      .leftbar{
        width:100%;
        height:66px;
        flex-direction:row;
        justify-content:space-around;
        padding: 8px 10px;

        position:fixed;
        left:0;
        bottom:0;
        top:auto;

        border-right:none;
        border-top: 1px solid rgba(255,255,255,0.06);
        z-index:1000;
      }

      .logo{
        display:none;
      }

      a{
        margin:0;
        width:44px;
        height:44px;
        border-radius:16px;
      }

      .createBtn{
        width:50px;
        height:50px;
        border-radius:18px;
        transform: translateY(-14px);
      }

      .bottom{
        margin-top:0;
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
