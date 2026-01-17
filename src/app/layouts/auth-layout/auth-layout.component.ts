import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="auth">

      <!-- 🔮 Animated background orbs -->
      <div class="orb orb1"></div>
      <div class="orb orb2"></div>

      <!-- CONTENT -->
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

    /* =========================
       AUTH BACKGROUND
    ========================== */
    .auth{
      min-height: 100vh;
      width: 100%;
      background: #020617;
      color: white;

      display: grid;
      place-items: center;
      padding: 20px;
      overflow: hidden;
      position: relative;
    }

    /* =========================
       GLOW ORBS
    ========================== */
    .orb{
      position: absolute;
      width: 420px;
      height: 420px;
      border-radius: 50%;
      filter: blur(120px);
      opacity: .45;
      animation: float 14s ease-in-out infinite;
      pointer-events: none;
    }

    .orb1{
      background: radial-gradient(circle, #3b82f6, transparent 60%);
      top: -120px;
      left: -120px;
    }

    .orb2{
      background: radial-gradient(circle, #8b5cf6, transparent 60%);
      bottom: -120px;
      right: -120px;
      animation-delay: 6s;
    }

    @keyframes float{
      0%,100%{ transform: translateY(0) translateX(0); }
      50%{ transform: translateY(-40px) translateX(30px); }
    }

    /* =========================
       CONTENT WRAPPER
    ========================== */
    .auth-inner{
      width: 100%;
      max-width: 1100px;
      z-index: 2;
      animation: fadeUp .45s ease;
    }

    @keyframes fadeUp{
      from{
        opacity: 0;
        transform: translateY(20px);
      }
      to{
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* =========================
       RESPONSIVE
    ========================== */
    @media (max-width: 900px){
      .auth-inner{
        max-width: 520px;
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
