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
    <div class="app">
      <!-- LEFT ICON BAR -->
      <app-leftbar></app-leftbar>

      <!-- ✅ ROUTED PAGES HERE -->
      <div class="content">
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

  .app {
    display: flex;
    height: 100vh;
    width: 100%;
    background: #020617;
    color: white;
    overflow: hidden;
  }

  .content {
    flex: 1;
    min-width: 0;
    height: 100vh;
    overflow: hidden;
    display: flex;
  }
`]

})
export class AppLayoutComponent {}
