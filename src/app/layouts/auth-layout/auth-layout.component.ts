import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="auth">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .auth {
      height: 100vh;
      display: grid;
      place-items: center;
      background: #020617;
      color: white;
    }
  `]
})
export class AuthLayoutComponent {}
