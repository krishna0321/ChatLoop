import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import { LeftbarComponent } from '../../layout/leftbar/leftbar.component';

@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, LeftbarComponent],
  template: `
    <div class="appShell">

      <!-- ✅ Premium Background -->
      <div class="bg"></div>
      <div class="orb orb1"></div>
      <div class="orb orb2"></div>
      <div class="grain"></div>

      <!-- ✅ LEFT / BOTTOM BAR -->
      <app-leftbar></app-leftbar>

      <!-- ✅ MAIN CONTENT -->
      <div class="main">
        <div class="routeWrap">
          <router-outlet></router-outlet>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host{
      display:block;
      height:100vh;
      width:100%;
      overflow:hidden;
    }

    /* ✅ THEME SYSTEM (change only these 2 colors) */
    :host{
      --theme: #ff2d95;
      --theme-2: #8b5cf6;

      --bg: #020617;
      --panel: rgba(3,7,18,0.82);

      --text: rgba(226,232,240,0.95);
      --muted: rgba(255,255,255,0.60);

      --border: rgba(255,255,255,0.10);
      --glow: color-mix(in srgb, var(--theme) 42%, transparent);

      --radius: 22px;
    }

    /* ✅ ROOT APP SHELL */
    .appShell{
      position:relative;
      display:flex;
      height:100vh;
      width:100%;
      background: var(--bg);
      color: var(--text);
      overflow:hidden;
      isolation:isolate;
    }

    /* ✅ Background Glow */
    .bg{
      position:fixed;
      inset:0;
      pointer-events:none;
      background:
        radial-gradient(circle at 20% 10%, color-mix(in srgb, var(--theme) 22%, transparent), transparent 45%),
        radial-gradient(circle at 80% 30%, color-mix(in srgb, var(--theme-2) 20%, transparent), transparent 55%),
        radial-gradient(circle at 45% 95%, color-mix(in srgb, var(--theme) 12%, transparent), transparent 60%);
      filter: blur(90px);
      opacity: 0.95;
      z-index:0;
    }

    /* ✅ Floating Orbs */
    .orb{
      position:fixed;
      width:520px;
      height:520px;
      border-radius:999px;
      filter: blur(165px);
      opacity:.22;
      pointer-events:none;
      z-index:0;
      animation: floatOrb 10s ease-in-out infinite;
    }

    .orb1{
      background: var(--theme);
      top:-240px;
      left:-240px;
    }

    .orb2{
      background: var(--theme-2);
      bottom:-260px;
      right:-260px;
      animation-delay:2.4s;
    }

    @keyframes floatOrb{
      0%,100%{ transform: translate(0,0); }
      50%{ transform: translate(38px,-26px); }
    }

    /* ✅ Premium grain overlay */
    .grain{
      position:fixed;
      inset:0;
      pointer-events:none;
      opacity: .06;
      z-index:1;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E");
      mix-blend-mode: overlay;
    }

    /* ✅ MAIN ROUTED CONTENT */
    .main{
      position:relative;
      z-index:2;
      flex:1;
      min-width:0;
      height:100vh;

      overflow:auto;
      display:flex;
      flex-direction:column;

      scroll-behavior:smooth;
      -webkit-overflow-scrolling: touch;

      animation: fadeIn .25s ease;
      scrollbar-color: rgba(255,255,255,0.10) transparent; /* firefox */
    }

    /* ✅ Route wrapper */
    .routeWrap{
      min-height:100%;
      display:flex;
      flex-direction:column;
      min-width:0;
      padding: 0;
    }

    @keyframes fadeIn{
      from{ opacity:.75; transform: translateY(2px); }
      to{ opacity:1; transform: translateY(0); }
    }

    /* ✅ Scrollbar */
    .main::-webkit-scrollbar{ width:10px; }
    .main::-webkit-scrollbar-thumb{
      background: rgba(255,255,255,0.10);
      border-radius:999px;
    }
    .main::-webkit-scrollbar-thumb:hover{
      background: rgba(255,255,255,0.15);
    }

    /* ===========================
       📱 MOBILE FIX
    ============================ */
    @media (max-width: 900px){
      .appShell{
        flex-direction:column;
      }
      .main{
        height: calc(100vh - 66px); /* bottom bar */
      }
    }

    /* ✅ Reduce motion support */
    @media (prefers-reduced-motion: reduce){
      .orb{ animation: none !important; }
      .main{ animation: none !important; }
    }
  `]
})
export class AppLayoutComponent {}
