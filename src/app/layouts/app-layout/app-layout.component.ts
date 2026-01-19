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

      <!-- 🌌 Premium Background -->
      <div class="bg"></div>
      <div class="orb orb1"></div>
      <div class="orb orb2"></div>
      <div class="grain"></div>

      <!-- ✅ LEFT / BOTTOM NAV -->
      <app-leftbar></app-leftbar>

      <!-- ✅ MAIN CONTENT -->
      <main class="main">
        <div class="routeWrap">
          <router-outlet></router-outlet>
        </div>
      </main>

    </div>
  `,
  styles: [`
/* =========================================================
   ✅ Chatloop AppLayout – FINAL FIX
   - No white space
   - Correct height
   - Single scroll container
========================================================= */

:host{
  display:flex;
  width:100%;
  height:100vh;           /* ✅ FULL SCREEN */
  min-height:0;
}

/* =========================================================
   THEME VARIABLES (SAFE FALLBACKS)
========================================================= */
:host{
  --theme:#7c3aed;
  --theme-2:#3b82f6;

  --bg:#050816;
  --text:rgba(255,255,255,0.92);
  --border:rgba(255,255,255,0.10);
}

*{ box-sizing:border-box; }

/* =========================================================
   ROOT SHELL
========================================================= */
.appShell{
  position:relative;
  width:100%;
  height:100%;
  min-height:0;

  display:flex;
  align-items:stretch;

  background: var(--bg);
  color: var(--text);

  overflow:hidden;        /* ✅ CRITICAL */
  isolation:isolate;
}

/* =========================================================
   🌌 BACKGROUND EFFECTS
========================================================= */
.bg,
.orb,
.grain{
  pointer-events:none;
}

.bg{
  position:absolute;
  inset:0;
  z-index:0;

  background:
    radial-gradient(1000px 720px at 18% 10%, rgba(124,58,237,0.20), transparent 55%),
    radial-gradient(950px 700px at 86% 28%, rgba(59,130,246,0.18), transparent 62%),
    radial-gradient(800px 600px at 50% 100%, rgba(34,211,238,0.10), transparent 60%);

  filter: blur(92px);
}

.orb{
  position:absolute;
  width:560px;
  height:560px;
  border-radius:999px;

  filter: blur(175px);
  opacity:.20;
  z-index:0;

  animation: orbFloat 11s ease-in-out infinite;
}

.orb1{
  top:-280px;
  left:-280px;
  background: var(--theme);
}

.orb2{
  bottom:-300px;
  right:-300px;
  background: var(--theme-2);
  animation-delay: 2.8s;
}

@keyframes orbFloat{
  0%,100%{ transform: translate(0,0); }
  50%{ transform: translate(45px,-26px); }
}

.grain{
  position:absolute;
  inset:0;
  z-index:1;
  opacity:.06;
  mix-blend-mode: overlay;
}

/* =========================================================
   MAIN CONTENT
========================================================= */
.main{
  position:relative;
  z-index:2;

  flex:1;
  min-width:0;
  min-height:0;

  display:flex;
  flex-direction:column;
}

/* ✅ ONLY THIS SCROLLS */
.routeWrap{
  flex:1;
  min-width:0;
  min-height:0;

  overflow:auto;
  scroll-behavior:smooth;
  -webkit-overflow-scrolling:touch;
}

/* Scrollbar */
.routeWrap::-webkit-scrollbar{ width:10px; }
.routeWrap::-webkit-scrollbar-thumb{
  background: rgba(255,255,255,0.12);
  border-radius:999px;
}
.routeWrap::-webkit-scrollbar-track{ background:transparent; }

/* =========================================================
   MOBILE FIX (BOTTOM NAV)
========================================================= */
@media (max-width:900px){
  .routeWrap{
    padding-bottom:86px; /* ✅ avoids nav overlap */
  }
}

@media (prefers-reduced-motion: reduce){
  .orb{ animation:none !important; }
}
  `]
})
export class AppLayoutComponent {}
