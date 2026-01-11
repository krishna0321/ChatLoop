import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LeftbarComponent } from '../../layout/leftbar/leftbar.component';
import { ChatListComponent } from '../../layout/chat-list/chat-list.component';
import { ChatComponent } from '../../features/chat/chat.component';

@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [
    CommonModule,
    LeftbarComponent,
    ChatListComponent,
    ChatComponent
  ],
  template: `
    <div class="app">
      <!-- LEFT ICON BAR -->
      <app-leftbar></app-leftbar>

      <!-- CHAT LIST -->
      <app-chat-list
        (userSelected)="onUserSelected($event)"
      ></app-chat-list>

      <!-- MAIN CONTENT -->
      <div class="content">
        <!-- SHOW CHAT ONLY IF USER SELECTED -->
        <app-chat
          *ngIf="selectedUser"
          [user]="selectedUser"
        ></app-chat>

        <!-- EMPTY STATE -->
        <div *ngIf="!selectedUser" class="empty">
          Select a chat to start messaging 💬
        </div>
      </div>
    </div>
  `,
  styles: [`
  .app {
    display: flex;
    height: 100vh;
    background: #020617;
    color: white;
    overflow: hidden;
  }

  .content {
    flex: 1;
    display: flex;
    height: 100vh;
    min-width: 0;
    overflow: hidden;
  }

  app-chat {
    flex: 1;
    display: flex;
    min-width: 0;
    height: 100%;
  }

  .empty {
    margin: auto;
    opacity: 0.7;
    font-size: 18px;
    font-weight: 600;
    color: #cbd5f5;
    text-align: center;
  }
`]
})
export class AppLayoutComponent {
  selectedUser: any = null;

  onUserSelected(user: any) {
    this.selectedUser = user;
  }
}
