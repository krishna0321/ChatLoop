import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import { LeftbarComponent } from '../../layout/leftbar/leftbar.component';

@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    LeftbarComponent
  ],
  template: `
    <div class="appShell">
      <!-- LEFT / BOTTOM BAR -->
      <app-leftbar></app-leftbar>

      <!-- MAIN CONTENT -->
      <div class="main">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    :host{
      display:block;
      height:100vh;
      width:100%;
    }

    /* ✅ Root shell */
    .appShell{
      display:flex;
      height:100vh;
      width:100%;
      background:#020617;
      color:white;
      overflow:hidden;
    }

    /* ✅ Main routed content */
    .main{
      flex:1;
      min-width:0;
      height:100vh;
      overflow:auto; /* 🔥 VERY IMPORTANT */
      display:flex;
      flex-direction:column;
    }

    /* ===========================
       📱 MOBILE FIX
    ============================ */
    @media (max-width: 900px){
      .appShell{
        flex-direction:column;
      }

      .main{
        height: calc(100vh - 66px); /* bottom bar height */
        padding-bottom: 0;
      }
    }
  `]
})
export class AppLayoutComponent {}
