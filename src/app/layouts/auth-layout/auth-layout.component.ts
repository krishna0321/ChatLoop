import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="auth">
      <div class="auth-inner">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .auth {
      min-height: 100vh; /* ✅ allow scroll */
      display: grid;
      place-items: center;
      background: #020617;
      color: white;
      padding: 18px; /* ✅ mobile spacing */
      overflow-y: auto;
    }

    /* ✅ inner wrapper so forms never stretch too wide */
    .auth-inner {
      width: 100%;
      max-width: 460px; /* ✅ perfect for login/register */
    }

    /* ✅ Better mobile scaling */
    @media (max-width: 480px) {
      .auth {
        padding: 14px;
        place-items: start center; /* ✅ top align on very small screens */
      }

      .auth-inner {
        max-width: 100%;
      }
    }
  `]
})
export class AuthLayoutComponent {}
