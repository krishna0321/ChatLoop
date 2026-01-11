import { Component, Input, OnDestroy, OnInit, OnChanges, SimpleChanges } from '@angular/core';
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
        <div class="avatar">{{ user.name[0] }}</div>
        <div>
          <div class="title">{{ user.name }}</div>
          <div class="sub">{{ user.phone || '' }}</div>
        </div>
      </div>

      <div class="messages">
        <div
          *ngFor="let m of messages"
          class="bubble"
          [class.me]="m.senderId === myUid"
        >
          {{ m.text }}
        </div>
      </div>

      <div class="composer">
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
  }

  .messages::-webkit-scrollbar{ width:10px; }
  .messages::-webkit-scrollbar-thumb{
    background: rgba(255,255,255,0.12);
    border-radius: 20px;
  }

  .bubble{
    max-width: min(65%, 520px);
    padding:10px 12px;
    border-radius:16px;
    background: rgba(30, 41, 59, 0.75);
    border: 1px solid rgba(255,255,255,0.06);
    backdrop-filter: blur(10px);
    box-shadow: 0 10px 22px rgba(0,0,0,0.25);
    word-wrap: break-word;
    white-space: pre-wrap;
  }

  .bubble.me{
    margin-left:auto;
    background: linear-gradient(135deg, rgba(37,99,235,0.95), rgba(59,130,246,0.85));
    border: 1px solid rgba(255,255,255,0.12);
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

  input:focus{
    border-color: rgba(59,130,246,0.8);
    box-shadow: 0 0 0 4px rgba(59,130,246,0.15);
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
`]
})
export class ChatComponent implements OnInit, OnChanges, OnDestroy {
  @Input() user!: AppUser;

  myUid = '';
  chatId = '';
  text = '';
  messages: ChatMessage[] = [];

  private unsubscribeAuth: any;
  private unsubscribeMsgs: any;

  constructor(private auth: Auth, private chatService: ChatService) {}

  ngOnInit(): void {
    // ✅ wait for firebase auth
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

  async loadChat() {
    if (!this.user?.uid || !this.myUid) return;

    // ✅ unique chat room per 2 users
    this.chatId = this.chatService.getChatId(this.myUid, this.user.uid);

    await this.chatService.ensureChat(this.chatId, [this.myUid, this.user.uid]);

    // cleanup old messages listener
    if (this.unsubscribeMsgs) this.unsubscribeMsgs();

    // ✅ realtime messages
    this.unsubscribeMsgs = this.chatService.listenMessages(this.chatId, (msgs) => {
      this.messages = msgs;
    });
  }

  send(): void {
    const value = this.text.trim();
    if (!value || !this.chatId) return;

    this.chatService.sendMessage(this.chatId, value, this.myUid);
    this.text = '';
  }

  ngOnDestroy(): void {
    if (this.unsubscribeAuth) this.unsubscribeAuth();
    if (this.unsubscribeMsgs) this.unsubscribeMsgs();
  }
}
