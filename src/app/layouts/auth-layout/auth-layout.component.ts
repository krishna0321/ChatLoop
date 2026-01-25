import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="authShell">

      <!-- 🌌 Premium Background -->
      <div class="bg"></div>
      <div class="orb orb1"></div>
      <div class="orb orb2"></div>
      <div class="grain"></div>

      <!-- ✅ CONTENT WRAPPER -->
      <div class="authInner">
        <router-outlet></router-outlet>
      </div>

    </div>
  `,
  styles: [`
/*     =======
   ✅ Chatloop Auth Layout – ULTRA PREMIUM ✅ FIXED
   - Login / Register pages
   - Allows big login shell width (1080px+)
   - No squeezed UI issue
    ======= */

:host{
  display:block;
  width:100%;
  height:100dvh;
  min-height:0;
}

/* fallback */
@supports not (height: 100dvh){
  :host{ height:100vh; }
}

/*     =======
   THEME FALLBACKS
    ======= */
:host{
  --theme: var(--app-theme, #7c3aed);
  --theme-2: var(--app-theme-2, #3b82f6);
  --bg: var(--app-bg, #050816);
  --text: rgba(255,255,255,0.92);
}

*{ box-sizing:border-box; }

/*     =======
   ROOT SHELL
    ======= */
.authShell{
  position:relative;
  width:100%;
  height:100%;
  min-height:0;

  display:grid;
  place-items:center;

  padding: 20px;

  background: var(--bg);
  color: var(--text);

  overflow:hidden;
  isolation:isolate;
}

/*     =======
   🌌 BACKGROUND EFFECTS
    ======= */
.bg, .orb, .grain{ pointer-events:none; }

.bg{
  position:absolute;
  inset:0;
  z-index:0;

  background:
    radial-gradient(900px 620px at 20% 10%, rgba(124,58,237,0.22), transparent 55%),
    radial-gradient(900px 620px at 80% 90%, rgba(59,130,246,0.18), transparent 60%);

  filter: blur(90px);
  opacity:.95;
}

.orb{
  position:absolute;
  width:420px;
  height:420px;
  border-radius:999px;

  filter: blur(140px);
  opacity:.35;
  z-index:0;

  animation: floatOrb 14s ease-in-out infinite;
  will-change: transform;
}

.orb1{
  top:-140px;
  left:-140px;
  background: var(--theme);
}

.orb2{
  bottom:-140px;
  right:-140px;
  background: var(--theme-2);
  animation-delay: 6s;
}

@keyframes floatOrb{
  0%,100%{ transform: translate(0,0); }
  50%{ transform: translate(30px,-40px); }
}

/* Grain */
.grain{
  position:absolute;
  inset:0;
  z-index:1;
  opacity:.06;
  mix-blend-mode: overlay;

  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E");
  background-size: 180px 180px;
}

/*     =======
   ✅ AUTH CONTAINER (FIXED HERE ✅)
    ======= */
.authInner{
  position:relative;
  z-index:2;

  width: 100%;
  max-width: min(1180px, 100%);  /* ✅ allow big login layout */
  display: flex;
  justify-content: center;
}

/* mobile tweak */
@media (max-width:480px){
  .authShell{
    place-items:start center;
    padding: 14px;
  }
}

/* reduced motion */
@media (prefers-reduced-motion: reduce){
  .orb{ animation:none !important; }
}
  `]
})
export class AuthLayoutComponent {}
