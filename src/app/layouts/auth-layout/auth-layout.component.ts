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
    :host{
      display:block;
      min-height:100vh;
    }

    /* ✅ Full screen auth canvas */
    .auth{
      min-height: 100vh;
      width: 100%;
      background: #020617;
      color: white;

      display: grid;
      place-items: center;
      padding: 18px;
      overflow-y: auto;
    }

    /* ✅ Important: allow login to be wide */
    .auth-inner{
      width: 100%;
      max-width: 1200px; /* ✅ allow 2 column layout */
    }

    @media (max-width: 860px){
      .auth-inner{
        max-width: 520px; /* ✅ on mobile keep it small */
      }
    }

    @media (max-width: 480px){
      .auth{
        padding: 14px;
        place-items: start center;
      }
      .auth-inner{
        max-width: 100%;
      }
    }
  `]
})
export class AuthLayoutComponent {}
