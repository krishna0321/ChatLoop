import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="card">
        <h2>Settings ⚙️</h2>

        <div class="item">
          <div>
            <b>Logout</b>
            <div class="sub">Sign out of your account</div>
          </div>
          <button (click)="logout()">Logout</button>
        </div>

        <div class="note">
          More settings like theme, notifications, privacy coming soon ✅
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page{height:100%;padding:18px;overflow:auto;color:#e5e7eb;}
    .card{
      max-width:520px;
      background:rgba(15,23,42,0.75);
      border:1px solid rgba(255,255,255,0.08);
      border-radius:18px;
      padding:16px;
      backdrop-filter: blur(10px);
    }
    h2{margin:0 0 14px;font-size:18px;font-weight:900;}
    .item{
      display:flex;justify-content:space-between;align-items:center;
      padding:14px;border-radius:16px;
      background:rgba(2,6,23,0.45);
      border:1px solid rgba(255,255,255,0.06);
    }
    .sub{opacity:.7;font-size:12px;margin-top:4px;}
    button{
      height:40px;padding:0 14px;border:none;border-radius:12px;
      background:#ef4444;color:white;font-weight:900;cursor:pointer;
    }
    .note{margin-top:14px;opacity:.7;font-size:13px;}
  `]
})
export class SettingsComponent {
  constructor(private auth: AuthService, private router: Router) {}

  async logout() {
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}
