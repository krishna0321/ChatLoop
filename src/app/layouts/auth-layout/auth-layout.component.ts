import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="authShell">

      <!-- ✅ Animated glow background -->
      <div class="bg"></div>
      <div class="orb orb1"></div>
      <div class="orb orb2"></div>
      <div class="grain"></div>

      <!-- ✅ CONTENT -->
      <div class="authInner">
        <router-outlet></router-outlet>
      </div>

    </div>
  `,
  styles: [`
    :host{
      display:block;
      width:100%;
      min-height:100vh;
      overflow:hidden; /* ✅ prevents body scroll UI breaking */
    }

    /* ✅ AUTH ROOT */
    .authShell{
      position:relative;
      width:100%;
      min-height:100vh;

      display:flex;
      justify-content:center;
      align-items:center;

      padding: 20px;
      overflow:hidden;

      background:#020617;
      color:#fff;
      isolation:isolate; /* ✅ keeps background layers clean */
    }

    /* ✅ soft bg glow */
    .bg{
      position:absolute;
      inset:0;
      z-index:0;
      pointer-events:none;
      background:
        radial-gradient(circle at 25% 10%, rgba(59,130,246,0.20), transparent 40%),
        radial-gradient(circle at 75% 20%, rgba(139,92,246,0.18), transparent 45%),
        radial-gradient(circle at 50% 90%, rgba(236,72,153,0.10), transparent 60%);
      filter: blur(90px);
      opacity: 0.95;
    }

    /* ✅ floating orbs */
    .orb{
      position:absolute;
      width: 460px;
      height: 460px;
      border-radius: 999px;
      filter: blur(140px);
      opacity: .30;
      pointer-events:none;
      z-index:0;
      animation: float 14s ease-in-out infinite;
    }

    .orb1{
      background: #3b82f6;
      top:-200px;
      left:-200px;
    }

    .orb2{
      background: #8b5cf6;
      bottom:-220px;
      right:-220px;
      animation-delay: 6s;
    }

    @keyframes float{
      0%,100%{ transform: translate(0,0); }
      50%{ transform: translate(40px,-34px); }
    }

    /* ✅ premium grain */
    .grain{
      position:absolute;
      inset:0;
      pointer-events:none;
      opacity: .06;
      z-index:1;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E");
      mix-blend-mode: overlay;
    }

    /* ✅ CENTER CONTENT */
    .authInner{
      position:relative;
      z-index:2;

      width:100%;
      max-width: 520px;

      /* ✅ important for layout stability */
      min-width:0;
      min-height:0;

      animation: fadeUp .45s ease;
    }

    @keyframes fadeUp{
      from{ opacity:0; transform: translateY(18px); }
      to{ opacity:1; transform: translateY(0); }
    }

    /* ✅ RESPONSIVE */
    @media (max-width: 520px){
      .authShell{
        padding: 14px;
        align-items:flex-start;  /* ✅ avoids squish on small screens */
      }

      .authInner{
        max-width: 100%;
        margin-top: 20px;
      }
    }

    /* ✅ Reduce motion support */
    @media (prefers-reduced-motion: reduce){
      .orb{ animation:none !important; }
      .authInner{ animation:none !important; }
    }
  `]
})
export class AuthLayoutComponent {}
