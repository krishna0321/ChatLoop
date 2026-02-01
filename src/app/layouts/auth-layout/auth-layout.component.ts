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
/* =========================================================
   🍃 Chatloop Auth Layout – PREMIUM MINT THEME
========================================================= */

:host{
  display:flex;
  flex:1;
  min-height:100dvh;

  --mint:#34d399;
  --mint-soft:#a7f3d0;
  --aqua:#67e8f9;
  --sky:#93c5fd;

  --bg:#f4fffb;
  --text:#0f172a;
  --border:rgba(0,0,0,0.06);
}

/* fallback */
@supports not (height: 100dvh){
  :host{ height:100vh; }
}

*{ box-sizing:border-box; }

/* =========================================================
   📦 ROOT SHELL
========================================================= */

.authShell{
  position:relative;
  width:100%;
  height:100%;
  min-height:0;

  display:grid;
  place-items:center;
  padding:20px;

  background: var(--bg);
  color: var(--text);
  overflow:hidden;
  isolation:isolate;
}
/* =========================================================
   🌤 SOFT MINT BACKGROUND
========================================================= */

.bg,.orb,.grain{ pointer-events:none; }

.bg{
  position:absolute;
  inset:0;
  z-index:0;

  background:
    radial-gradient(900px 620px at 15% 10%, rgba(52,211,153,.35), transparent 60%),
    radial-gradient(900px 620px at 85% 90%, rgba(103,232,249,.30), transparent 65%),
    radial-gradient(700px 500px at 50% 50%, rgba(167,243,208,.35), transparent 65%);

  filter: blur(95px);
}

/* =========================================================
   💫 FLOATING MINT ORBS
========================================================= */

.orb{
  position:absolute;
  width:420px;
  height:420px;
  border-radius:999px;

  filter: blur(150px);
  opacity:.35;
  z-index:0;

  animation: floatOrb 15s ease-in-out infinite;
}

.orb1{
  top:-160px;
  left:-160px;
  background: var(--mint);
}

.orb2{
  bottom:-160px;
  right:-160px;
  background: var(--aqua);
  animation-delay:5s;
}

@keyframes floatOrb{
  0%,100%{ transform: translate(0,0); }
  50%{ transform: translate(40px,-45px); }
}

/* =========================================================
   🌾 SUPER LIGHT TEXTURE
========================================================= */

.grain{
  position:absolute;
  inset:0;
  opacity:.025;
  mix-blend-mode: soft-light;

  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.7' numOctaves='2'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='.4'/%3E%3C/svg%3E");
}

/* =========================================================
   📑 AUTH CONTENT WRAPPER
========================================================= */

.authInner{
  position:relative;
  z-index:2;

  width:100%;
  max-width: min(1180px, 100%);
  display:flex;
  justify-content:center;
}

/* =========================================================
   📱 MOBILE TWEAK
========================================================= */

@media (max-width:480px){
  .authShell{
    place-items:start center;
    padding:14px;
  }
}

/* =========================================================
   🧘 REDUCED MOTION
========================================================= */

@media (prefers-reduced-motion: reduce){
  .orb{ animation:none !important; }
}
`]

})
export class AuthLayoutComponent {}
