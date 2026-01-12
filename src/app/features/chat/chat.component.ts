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
import { AppUser } from '../../core/services/user.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-view" *ngIf="user">

      <div class="header">
        <div class="avatar">{{ user?.name?.[0] || 'U' }}</div>

        <div>
          <div class="title">{{ user.name }}</div>
          <div class="sub">{{ user.phone || '' }}</div>
        </div>
      </div>

      <div class="messages" #messagesBox (click)="closeMenu()">
        <div
          *ngFor="let m of messages"
          class="bubble"
          [class.me]="m.senderId === myUid"
          [class.deleted]="m.isDeleted"
          (click)="openMenu($event, m)"
        >
          <div class="msgText">{{ m.text }}</div>

          <div class="meta">
            <span *ngIf="m.editedAt && !m.isDeleted">edited</span>
            <span *ngIf="m.isDeleted">deleted</span>
          </div>
        </div>
      </div>

      <!-- ✅ floating menu -->
      <div
        class="menu"
        *ngIf="menuMessageId"
        [style.left.px]="menuX"
        [style.top.px]="menuY"
        (click)="$event.stopPropagation()"
      >
        <button (click)="clickEdit()">✏ Edit</button>
        <button class="danger" (click)="clickDelete()">🗑 Delete</button>
      </div>

      <!-- ✅ Edit mode -->
      <div class="composer edit" *ngIf="editingId">
        <input [(ngModel)]="editingText" placeholder="Edit message..." />
        <button (click)="saveEdit()">Save</button>
        <button class="danger" (click)="cancelEdit()">Cancel</button>
      </div>

      <!-- ✅ Send mode -->
      <div class="composer" *ngIf="!editingId">
        <input [(ngModel)]="text" (keydown.enter)="send()" placeholder="Message..." />
        <button (click)="send()">Send</button>
      </div>

    </div>
  `,
  styles: [`
  :host{
    flex: 1;
    display: flex;
    min-width: 0;
    height: 100%;
    position: relative;
  }

  .chat-view{
    height: 100%;
    width: 100%;
    display:flex;
    flex-direction:column;
    background: radial-gradient(circle at top left, #0b1a3b, #020617 60%);
    color:white;
    overflow:hidden;
  }

  .header{
    flex-shrink:0;
    display:flex;
    align-items:center;
    gap:12px;
    padding:12px 16px;
    background: rgba(15, 23, 42, 0.75);
    border-bottom:1px solid rgba(255,255,255,0.06);
    backdrop-filter: blur(10px);
  }

  .avatar{
    width:40px;
    height:40px;
    border-radius:50%;
    background:#2563eb;
    display:grid;
    place-items:center;
    font-weight:800;
    text-transform:uppercase;
  }

  .title{ font-weight:900; font-size:15px; }
  .sub{ font-size:12px; opacity:.7; margin-top:2px; }

  .messages{
    flex:1;
    padding:16px;
    overflow:auto;
    display:flex;
    flex-direction:column;
    gap:10px;
    position: relative;
  }

  .bubble{
    max-width: min(70%, 520px);
    padding:10px 12px;
    border-radius:16px;
    background: rgba(30, 41, 59, 0.75);
    border: 1px solid rgba(255,255,255,0.06);
    backdrop-filter: blur(10px);
    box-shadow: 0 10px 22px rgba(0,0,0,0.25);
    word-wrap: break-word;
    white-space: pre-wrap;
    cursor: pointer;
  }

  .bubble.me{
    margin-left:auto;
    background: linear-gradient(135deg, rgba(37,99,235,0.95), rgba(59,130,246,0.85));
    border: 1px solid rgba(255,255,255,0.12);
  }

  .bubble.deleted{
    opacity: 0.7;
    filter: grayscale(0.4);
  }

  .msgText{ font-size: 14px; line-height:1.45; }
  .meta{ margin-top:6px; font-size:11px; opacity:.65; }

  /* ✅ floating popup menu */
  .menu{
    position: fixed;
    z-index: 1000;
    display:flex;
    gap:8px;
    padding:8px;
    border-radius:14px;
    background: rgba(2,6,23,0.95);
    border: 1px solid rgba(255,255,255,0.12);
    box-shadow: 0 18px 40px rgba(0,0,0,0.45);
  }

  .menu button{
    height:34px;
    padding:0 12px;
    border:none;
    border-radius:12px;
    cursor:pointer;
    font-weight:900;
    background: rgba(255,255,255,0.12);
    color:white;
  }

  .menu button.danger{
    background: rgba(255,0,0,0.35);
  }

  .composer{
    flex-shrink:0;
    display:flex;
    gap:10px;
    padding:12px;
    background: rgba(15, 23, 42, 0.75);
    border-top:1px solid rgba(255,255,255,0.06);
    backdrop-filter: blur(10px);
  }

  .composer.edit{
    border-top: 1px solid rgba(59,130,246,0.35);
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

  button:hover{ opacity:0.95; }

  .danger{
    background: rgba(255,0,0,0.35) !important;
  }
  `]
})
export class ChatComponent implements OnInit, OnChanges, OnDestroy, AfterViewChecked {
  @Input() user!: AppUser;

  myUid = '';
  chatId = '';
  text = '';
  messages: ChatMessage[] = [];

  // ✅ menu state
  menuMessageId: string | null = null;
  menuX = 0;
  menuY = 0;

  // ✅ hold message object for actions
  private selectedMessage: ChatMessage | null = null;

  // ✅ edit state
  editingId: string | null = null;
  editingText = '';

  // ✅ scroll handling
  @ViewChild('messagesBox') messagesBox!: ElementRef<HTMLDivElement>;
  private lastMsgCount = 0;

  private unsubscribeAuth: any;
  private unsubscribeMsgs: any;

  constructor(private auth: Auth, private chatService: ChatService) {}

  ngOnInit(): void {
    this.unsubscribeAuth = onAuthStateChanged(this.auth, (firebaseUser) => {
      if (!firebaseUser) return;
      this.myUid = firebaseUser.uid;
      this.loadChat();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && this.myUid) {
      this.loadChat();
    }
  }

  ngAfterViewChecked(): void {
    if (this.messages.length !== this.lastMsgCount) {
      this.lastMsgCount = this.messages.length;
      setTimeout(() => this.scrollBottom(), 50);
    }
  }

  private scrollBottom() {
    if (!this.messagesBox) return;
    const el = this.messagesBox.nativeElement;
    el.scrollTop = el.scrollHeight;
  }

  async loadChat() {
    if (!this.user?.uid || !this.myUid) return;

    this.chatId = this.chatService.getChatId(this.myUid, this.user.uid);

    await this.chatService.ensureChat(this.chatId, [this.myUid, this.user.uid]);

    if (this.unsubscribeMsgs) this.unsubscribeMsgs();

    this.unsubscribeMsgs = this.chatService.listenMessages(this.chatId, (msgs) => {
      this.messages = msgs;
    });
  }

  openMenu(event: MouseEvent, m: ChatMessage) {
    event.stopPropagation();
    if (!m.id) return;

    if (m.senderId !== this.myUid || m.isDeleted) {
      this.closeMenu();
      return;
    }

    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    this.menuX = rect.right - 220;
    this.menuY = rect.top + rect.height + 6;

    this.menuMessageId = m.id;
    this.selectedMessage = m;
  }

  closeMenu() {
    this.menuMessageId = null;
    this.selectedMessage = null;
  }

  send(): void {
    const value = this.text.trim();
    if (!value || !this.chatId) return;

    this.chatService.sendMessage(this.chatId, value, this.myUid);
    this.text = '';
  }

  clickEdit() {
    if (!this.selectedMessage) return;
    this.startEdit(this.selectedMessage);
  }

  clickDelete() {
    if (!this.selectedMessage) return;
    this.deleteMessage(this.selectedMessage);
  }

  startEdit(m: ChatMessage) {
    if (m.senderId !== this.myUid || !m.id) return;

    this.closeMenu();
    this.editingId = m.id;
    this.editingText = m.text;
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

    this.closeMenu();
    const ok = confirm('Delete this message?');
    if (!ok) return;

    await this.chatService.deleteMessage(this.chatId, m.id);
  }

  ngOnDestroy(): void {
    if (this.unsubscribeAuth) this.unsubscribeAuth();
    if (this.unsubscribeMsgs) this.unsubscribeMsgs();
  }
}
