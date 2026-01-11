import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../core/services/chat.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>💬 Chat</h2>

    <div *ngFor="let msg of messages">
      <b>{{ msg.sender }}:</b> {{ msg.text }}
    </div>
  `
})
export class ChatComponent implements OnInit {
  messages: any[] = [];

  constructor(private chatService: ChatService) {}

  ngOnInit() {
    this.chatService.getMessages().subscribe(data => {
      this.messages = data;
    });
  }
}
