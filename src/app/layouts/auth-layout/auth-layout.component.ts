import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="auth">
      <div class="orb orb1"></div>
      <div class="orb orb2"></div>

      <div class="auth-inner">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    :host{
      display:block;
      height:100%;
    }

    .auth{
      min-height:100%;
      width:100%;

      background: var(--bg);
      color: var(--text);

      display:grid;
      place-items:center;
      padding:20px;

      position:relative;
      isolation:isolate;
    }

    /* 🔮 Orbs stay visual only */
    .orb{
      position:absolute;
      width:420px;
      height:420px;
      border-radius:50%;
      filter: blur(120px);
      opacity:.45;
      pointer-events:none;
      z-index:0;
      animation: float 14s ease-in-out infinite;
    }

    .orb1{
      background: radial-gradient(circle, var(--theme), transparent 60%);
      top:-120px;
      left:-120px;
    }

    .orb2{
      background: radial-gradient(circle, var(--theme-2), transparent 60%);
      bottom:-120px;
      right:-120px;
      animation-delay:6s;
    }

    .auth-inner{
      width:100%;
      max-width:1100px;
      position:relative;
      z-index:2;
    }

    @keyframes float{
      0%,100%{ transform: translate(0,0); }
      50%{ transform: translate(30px,-40px); }
    }

    @media (max-width:480px){
      .auth{
        place-items:start center;
        padding:14px;
      }
    }
  `]
})
export class AuthLayoutComponent {}

