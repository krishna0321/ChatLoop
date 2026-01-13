import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  AfterViewChecked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';

import { ChatService, ChatMessage } from '../../core/services/chat.service';
import { AppUser, UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-view" *ngIf="user" (click)="closeAllMenus()">

      <!-- HEADER -->
      <div class="header" (click)="$event.stopPropagation()">
        <div class="left">
          <div class="avatar">{{ (user?.name || 'U')[0] }}</div>
          <div class="info">
            <div class="title">{{ user.name }}</div>
            <div class="sub">
              {{ user.phone || 'No phone' }}
              <span *ngIf="isBlocked" class="pill danger">Blocked</span>
            </div>
          </div>
        </div>

        <button class="iconBtn" (click)="toggleHeaderMenu($event)">⋮</button>

        <!-- header menu -->
        <div class="dropdown" *ngIf="showHeaderMenu" (click)="$event.stopPropagation()">
          <button (click)="toggleMute()">
            {{ isMuted ? 'Unmute' : 'Mute' }}
          </button>
          <button (click)="togglePin()">
            {{ isPinned ? 'Unpin' : 'Pin' }}
          </button>
          <button class="danger" (click)="toggleBlock()">
            {{ isBlocked ? 'Unblock' : 'Block' }}
          </button>
        </div>
      </div>

      <!-- MESSAGES -->
      <div class="messages" #messagesBox>
        <div *ngFor="let m of messages"
            class="bubble"
            [class.me]="m.senderId === myUid"
            [class.deleted]="m.isDeleted"
            (click)="openMsgMenu($event, m)"
        >
          <div class="text">
            <ng-container *ngIf="!m.isDeleted; else deletedTpl">
              {{ m.text }}
            </ng-container>
            <ng-template #deletedTpl>
              <span class="deletedText">This message was deleted</span>
            </ng-template>
          </div>

          <div class="meta" *ngIf="!m.isDeleted">
            <span *ngIf="m.editedAt">edited</span>
          </div>
        </div>
      </div>

      <!-- MESSAGE MENU (only for my msgs) -->
      <div
        class="msgMenu"
        *ngIf="menuMessageId"
        [style.left.px]="menuX"
        [style.top.px]="menuY"
        (click)="$event.stopPropagation()"
      >
        <button (click)="clickEdit()">Edit</button>
        <button class="danger" (click)="clickDelete()">Delete</button>
      </div>

      <!-- EDIT BAR -->
      <div class="editBar" *ngIf="editingId" (click)="$event.stopPropagation()">
        <div class="editTitle">Editing message</div>
        <div class="editRow">
          <input [(ngModel)]="editingText" placeholder="Edit message..." />
          <button (click)="saveEdit()">Save</button>
          <button class="ghost" (click)="cancelEdit()">Cancel</button>
        </div>
      </div>

      <!-- COMPOSER -->
      <div class="composer" (click)="$event.stopPropagation()">
        <input
          [(ngModel)]="text"
          (keydown.enter)="send()"
          placeholder="Message..."
          [disabled]="isBlocked"
        />
        <button (click)="send()" [disabled]="isBlocked">Send</button>
      </div>

      <div class="blockedInfo" *ngIf="isBlocked">
        You blocked this user. Unblock to send messages.
      </div>
    </div>
  `,
  styles: [`
    :host{ flex:1; display:flex; min-width:0; height:100%; }

    .chat-view{
      height:100%;
      width:100%;
      display:flex;
      flex-direction:column;
      background: radial-gradient(circle at top left, #0b1a3b, #020617 70%);
      color:#fff;
      overflow:hidden;
    }

    /* header */
    .header{
      position:relative;
      flex-shrink:0;
      display:flex;
      align-items:center;
      justify-content:space-between;
      padding:12px 14px;
      background: rgba(15, 23, 42, 0.75);
      border-bottom:1px solid rgba(255,255,255,0.06);
      backdrop-filter: blur(10px);
    }
    .left{ display:flex; gap:12px; align-items:center; min-width:0; }
    .avatar{
      width:40px; height:40px;
      border-radius:50%;
      background: linear-gradient(135deg,#2563eb,#60a5fa);
      display:grid; place-items:center;
      font-weight:900;
      flex-shrink:0;
    }
    .info{ min-width:0; }
    .title{ font-weight:900; font-size:15px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .sub{ font-size:12px; opacity:.7; display:flex; gap:8px; align-items:center; }

    .pill{
      font-size:11px;
      padding:2px 8px;
      border-radius:999px;
      border:1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.06);
    }
    .pill.danger{
      background: rgba(255,0,0,0.18);
      border-color: rgba(255,0,0,0.22);
      color:#ffd0d0;
      font-weight:900;
    }

    .iconBtn{
      width:34px; height:34px;
      border-radius:12px;
      border:1px solid rgba(255,255,255,0.10);
      background: rgba(255,255,255,0.06);
      color:#fff;
      cursor:pointer;
      font-weight:900;
    }

    .dropdown{
      position:absolute;
      right:12px;
      top:54px;
      width:160px;
      z-index:50;
      padding:8px;
      border-radius:14px;
      background: rgba(2,6,23,0.95);
      border:1px solid rgba(255,255,255,0.12);
      box-shadow: 0 20px 50px rgba(0,0,0,0.55);
      display:flex;
      flex-direction:column;
      gap:6px;
    }
    .dropdown button{
      height:34px;
      border:none;
      border-radius:12px;
      background: rgba(255,255,255,0.10);
      color:#fff;
      font-weight:900;
      cursor:pointer;
      text-align:left;
      padding:0 12px;
    }
    .dropdown button.danger{
      background: rgba(255,0,0,0.18);
      border:1px solid rgba(255,0,0,0.2);
    }

    /* messages */
    .messages{
      flex:1;
      overflow:auto;
      padding:18px 16px;
      display:flex;
      flex-direction:column;
      gap:10px;
    }

    .bubble{
      max-width: 520px;
      width: fit-content;
      padding:10px 12px;
      border-radius:16px;
      background: rgba(30,41,59,0.70);
      border:1px solid rgba(255,255,255,0.06);
      box-shadow: 0 10px 22px rgba(0,0,0,0.25);
      cursor:pointer;
    }
    .bubble.me{
      margin-left:auto;
      background: linear-gradient(135deg, rgba(37,99,235,0.95), rgba(59,130,246,0.82));
      border:1px solid rgba(255,255,255,0.10);
    }

    .bubble.deleted{
      opacity:.65;
      filter: grayscale(.4);
    }

    .text{ font-size:14px; line-height:1.45; white-space:pre-wrap; }
    .deletedText{ font-style:italic; opacity:.8; }

    .meta{
      margin-top:6px;
      font-size:11px;
      opacity:.65;
    }

    /* message menu */
    .msgMenu{
      position:fixed;
      z-index:1000;
      display:flex;
      gap:8px;
      padding:8px;
      border-radius:14px;
      background: rgba(2,6,23,0.95);
      border:1px solid rgba(255,255,255,0.12);
      box-shadow: 0 18px 40px rgba(0,0,0,0.45);
    }
    .msgMenu button{
      height:34px;
      padding:0 12px;
      border:none;
      border-radius:12px;
      cursor:pointer;
      font-weight:900;
      background: rgba(255,255,255,0.12);
      color:white;
    }
    .msgMenu button.danger{
      background: rgba(255,0,0,0.30);
    }

    /* edit bar */
    .editBar{
      padding:10px 12px;
      background: rgba(15,23,42,0.80);
      border-top:1px solid rgba(59,130,246,0.25);
    }
    .editTitle{
      font-size:12px;
      font-weight:900;
      opacity:.8;
      margin-bottom:8px;
    }
    .editRow{
      display:flex;
      gap:10px;
      align-items:center;
    }

    /* composer */
    .composer{
      flex-shrink:0;
      display:flex;
      gap:10px;
      padding:12px;
      background: rgba(15, 23, 42, 0.75);
      border-top:1px solid rgba(255,255,255,0.06);
      backdrop-filter: blur(10px);
    }
    input{
      flex:1;
      height:46px;
      padding:0 14px;
      border-radius:14px;
      border:1px solid rgba(255,255,255,0.12);
      outline:none;
      background: rgba(2, 6, 23, 0.7);
      color:white;
    }
    input:disabled{ opacity:.5; cursor:not-allowed; }

    button{
      height:46px;
      padding:0 18px;
      border:none;
      border-radius:14px;
      background:#2563eb;
      color:white;
      font-weight:900;
      cursor:pointer;
    }
    button:disabled{ opacity:.5; cursor:not-allowed; }

    .ghost{
      background: rgba(255,255,255,0.10) !important;
      border:1px solid rgba(255,255,255,0.14);
    }

    .blockedInfo{
      padding:10px 12px;
      text-align:center;
      font-size:12px;
      opacity:.75;
      border-top:1px solid rgba(255,255,255,0.06);
      background: rgba(2,6,23,0.55);
    }
  `]
})
export class ChatComponent implements OnInit, OnChanges, OnDestroy, AfterViewChecked {
  @Input() user!: AppUser;

  myUid = '';
  chatId = '';
  text = '';
  messages: ChatMessage[] = [];

  menuMessageId: string | null = null;
  menuX = 0;
  menuY = 0;
  private selectedMessage: ChatMessage | null = null;

  editingId: string | null = null;
  editingText = '';

  @ViewChild('messagesBox') messagesBox!: ElementRef<HTMLDivElement>;
  private lastMsgCount = 0;

  private unsubscribeAuth: any;
  private unsubscribeMsgs: any;
  private meSub: any;

  showHeaderMenu = false;
  isMuted = false;
  isPinned = false;
  isBlocked = false;

  constructor(
    private auth: Auth,
    private chatService: ChatService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.unsubscribeAuth = onAuthStateChanged(this.auth, (firebaseUser) => {
      if (!firebaseUser) return;
      this.myUid = firebaseUser.uid;

      this.meSub = this.userService.getUser(this.myUid).subscribe((me) => {
        const blocked = me?.blocked || [];
        this.isBlocked = !!this.user?.uid && blocked.includes(this.user.uid);
      });

      this.loadChat();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && this.myUid) this.loadChat();
  }

  ngAfterViewChecked(): void {
    if (this.messages.length !== this.lastMsgCount) {
      this.lastMsgCount = this.messages.length;
      setTimeout(() => this.scrollBottom(), 40);
    }
  }

  private scrollBottom() {
    if (!this.messagesBox) return;
    const el = this.messagesBox.nativeElement;
    el.scrollTop = el.scrollHeight;
  }

  closeAllMenus() {
    this.menuMessageId = null;
    this.selectedMessage = null;
    this.showHeaderMenu = false;
  }

  toggleHeaderMenu(event: MouseEvent) {
    event.stopPropagation();
    // ✅ close msg menu if open
    this.menuMessageId = null;
    this.selectedMessage = null;

    this.showHeaderMenu = !this.showHeaderMenu;
  }

  async loadChat() {
    if (!this.user?.uid || !this.myUid) return;

    this.chatId = this.chatService.getChatId(this.myUid, this.user.uid);
    await this.chatService.ensureChat(this.chatId, [this.myUid, this.user.uid]);

    // optional if exists in your service
    if ((this.chatService as any).markAsRead) {
      await (this.chatService as any).markAsRead(this.chatId, this.myUid);
    }

    if (this.unsubscribeMsgs) this.unsubscribeMsgs();
    this.unsubscribeMsgs = this.chatService.listenMessages(this.chatId, (msgs) => {
      this.messages = msgs;
    });
  }

  openMsgMenu(event: MouseEvent, m: ChatMessage) {
    event.stopPropagation();
    this.showHeaderMenu = false;

    if (!m.id) return;

    if (m.senderId !== this.myUid || m.isDeleted) {
      this.menuMessageId = null;
      return;
    }

    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    this.menuX = rect.right - 210;
    this.menuY = rect.top + rect.height + 8;

    this.menuMessageId = m.id;
    this.selectedMessage = m;
  }

  send(): void {
    const value = this.text.trim();
    if (!value || !this.chatId) return;

    if (this.isBlocked) return;

    // your sendMessage supports 4 params sometimes
    try {
      (this.chatService as any).sendMessage(this.chatId, value, this.myUid, this.user.uid);
    } catch {
      this.chatService.sendMessage(this.chatId, value, this.myUid, this.user.uid);
    }

    this.text = '';
  }

  clickEdit() {
    if (!this.selectedMessage?.id) return;
    this.editingId = this.selectedMessage.id;
    this.editingText = this.selectedMessage.text;
    this.menuMessageId = null;
  }

  clickDelete() {
    if (!this.selectedMessage?.id) return;
    this.deleteMessage(this.selectedMessage);
  }

  cancelEdit() {
    this.editingId = null;
    this.editingText = '';
  }

  async saveEdit() {
    if (!this.editingId || !this.chatId) return;
    const value = this.editingText.trim();
    if (!value) return;

    await this.chatService.editMessage(this.chatId, this.editingId, value);
    this.cancelEdit();
  }

  async deleteMessage(m: ChatMessage) {
    if (m.senderId !== this.myUid || !m.id || !this.chatId) return;
    this.menuMessageId = null;

    const ok = confirm('Delete this message?');
    if (!ok) return;

    await this.chatService.deleteMessage(this.chatId, m.id);
  }

  async toggleMute() {
    await (this.chatService as any).muteChat?.(this.chatId, this.myUid, !this.isMuted);
    this.isMuted = !this.isMuted;
    this.showHeaderMenu = false;
  }

  async togglePin() {
    await (this.chatService as any).pinChat?.(this.chatId, this.myUid, !this.isPinned);
    this.isPinned = !this.isPinned;
    this.showHeaderMenu = false;
  }

  async toggleBlock() {
    if (!this.user?.uid) return;

    if (!this.isBlocked) {
      const ok = confirm('Block this user?');
      if (!ok) return;
      await this.userService.blockUser(this.myUid, this.user.uid);
      this.isBlocked = true;
    } else {
      await this.userService.unblockUser(this.myUid, this.user.uid);
      this.isBlocked = false;
    }

    this.showHeaderMenu = false;
  }

  ngOnDestroy(): void {
    if (this.unsubscribeAuth) this.unsubscribeAuth();
    if (this.unsubscribeMsgs) this.unsubscribeMsgs();
    if (this.meSub) this.meSub.unsubscribe?.();
  }
}
