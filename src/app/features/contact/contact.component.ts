import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Router } from '@angular/router';

import { ContactService, Contact } from '../../core/services/contact.service';
import { ChatService } from '../../core/services/chat.service';
import { UserService, AppUser } from '../../core/services/user.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="panel">
      <div class="header">
        <div class="title">Contacts</div>
        <button class="btn" (click)="openAdd()">Add Contact</button>
      </div>

      <input
        class="search"
        [(ngModel)]="search"
        (input)="applyFilter()"
        placeholder="Search contacts"
      />

      <div class="list">
        <div
          class="item"
          *ngFor="let c of filtered"
          (click)="openChat(c)"
        >
          <div class="avatar">{{ (c.name || 'C')[0] }}</div>

          <div class="info">
            <div class="name">{{ c.name }}</div>
            <div class="sub">
              {{ c.phone }}
              <span *ngIf="c.uid" class="tag">registered</span>
              <span *ngIf="!c.uid" class="tag gray">not registered</span>
            </div>
          </div>

          <button class="btn ghost" (click)="remove(c); $event.stopPropagation()">Delete</button>
        </div>

        <div *ngIf="filtered.length === 0" class="empty">
          No contacts yet
        </div>
      </div>
    </div>

    <!-- ADD CONTACT MODAL -->
    <div class="modal" *ngIf="showAdd" (click)="closeAdd()">
      <div class="box" (click)="$event.stopPropagation()">
        <div class="mTitle">Add Contact</div>

        <label>Name</label>
        <input [(ngModel)]="form.name" placeholder="Krishna" />

        <label>Phone</label>
        <input [(ngModel)]="form.phone" placeholder="98765xxxxx" />

        <div class="hint">
          ✅ If phone matches a registered user, chat will open.
        </div>

        <div class="actions">
          <button class="btn ghost" (click)="closeAdd()">Cancel</button>
          <button class="btn" (click)="save()">Save</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host{
      display:flex;
      flex:1;
      width:100%;
      height:100%;
      min-width:0;
      overflow:hidden;
    }

    .panel{
      width: 420px;
      max-width: 100%;
      background: rgba(15,23,42,0.55);
      border-right:1px solid rgba(255,255,255,0.07);
      padding:14px;
      height:100%;
      overflow:hidden;
      display:flex;
      flex-direction:column;
      color:white;
      backdrop-filter: blur(10px);
    }

    .header{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
    }

    .title{
      font-weight:900;
      font-size:18px;
    }

    .btn{
      height:36px;
      padding:0 12px;
      border:none;
      border-radius:12px;
      background:#2563eb;
      color:white;
      font-weight:900;
      cursor:pointer;
    }
    .btn.ghost{
      background: rgba(255,255,255,0.1);
    }

    .search{
      margin-top:12px;
      height:42px;
      border-radius:14px;
      padding:0 14px;
      border:1px solid rgba(255,255,255,0.12);
      background: rgba(2,6,23,0.6);
      color:white;
      outline:none;
      width:100%;
    }

    .list{
      flex:1;
      overflow:auto;
      margin-top:12px;
      padding-right:6px;
    }

    .item{
      display:flex;
      align-items:center;
      gap:12px;
      padding:12px;
      border-radius:16px;
      cursor:pointer;
      transition:.15s;
    }

    .item:hover{ background: rgba(255,255,255,0.05); }

    .avatar{
      width:46px;height:46px;border-radius:50%;
      background: linear-gradient(135deg,#2563eb,#60a5fa);
      display:grid;place-items:center;
      font-weight:900;
      flex-shrink:0;
      text-transform:uppercase;
    }

    .info{ flex:1; min-width:0; }
    .name{ font-weight:900; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .sub{ margin-top:4px; font-size:12px; opacity:.75; display:flex; gap:8px; align-items:center; }

    .tag{
      font-size:11px;
      padding:2px 8px;
      border-radius:999px;
      background: rgba(34,197,94,0.25);
      border:1px solid rgba(34,197,94,0.35);
      color:#bfffd0;
      font-weight:800;
    }
    .tag.gray{
      background: rgba(255,255,255,0.08);
      border:1px solid rgba(255,255,255,0.12);
      color: rgba(255,255,255,0.7);
    }

    .empty{ text-align:center; opacity:.6; margin-top:20px; }

    .modal{
      position:fixed; inset:0;
      background: rgba(0,0,0,0.55);
      display:grid; place-items:center;
      z-index:9999;
    }

    .box{
      width: min(420px, 92vw);
      background:#020617;
      border:1px solid rgba(255,255,255,0.12);
      border-radius:18px;
      padding:16px;
      color:white;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    }

    .mTitle{ font-weight:900; font-size:16px; margin-bottom:12px; }

    label{ font-size:12px; opacity:.75; font-weight:800; margin-top:10px; display:block; }
    input{
      width:100%;
      height:42px;
      border-radius:14px;
      padding:0 14px;
      border:1px solid rgba(255,255,255,0.12);
      background: rgba(2,6,23,0.6);
      color:white;
      outline:none;
      margin-top:6px;
    }

    .hint{ margin-top:10px; font-size:12px; opacity:.7; }

    .actions{
      display:flex;
      justify-content:flex-end;
      gap:10px;
      margin-top:14px;
    }
  `]
})
export class ContactComponent implements OnInit, OnDestroy {
  myUid = '';

  contacts: Contact[] = [];
  filtered: Contact[] = [];
  search = '';

  showAdd = false;
  form: Contact = { name: '', phone: '' };

  users: AppUser[] = [];

  unsubContacts: any;
  usersSub: any;

  constructor(
    private auth: Auth,
    private contactService: ContactService,
    private chatService: ChatService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    onAuthStateChanged(this.auth, (u) => {
      if (!u) return;

      this.myUid = u.uid;

      // ✅ load users list (for matching phone -> uid)
      this.usersSub = this.userService.getUsers().subscribe((list) => {
        this.users = list || [];
      });

      // ✅ load my contacts realtime
      this.unsubContacts = this.contactService.listenContacts(this.myUid, (list) => {
        this.contacts = list || [];
        this.applyFilter();
      });
    });
  }

  applyFilter() {
    const t = this.search.trim().toLowerCase();
    if (!t) {
      this.filtered = [...this.contacts];
      return;
    }

    this.filtered = this.contacts.filter(c => {
      const n = (c.name || '').toLowerCase();
      const p = (c.phone || '').toLowerCase();
      return n.includes(t) || p.includes(t);
    });
  }

  openAdd(){ this.showAdd = true; }
  closeAdd(){ this.showAdd = false; }

async save(){
  const name = (this.form.name || '').trim();
  const phone = (this.form.phone || '').trim();

  if (!name || !phone) {
    alert('Please enter name and phone');
    return;
  }

  const matchedUser = this.users.find(u => (u.phone || '').trim() === phone);

  console.log("Saving contact...", { name, phone, uid: matchedUser?.uid });

  await this.contactService.addContact(this.myUid, {
    name,
    phone,
    uid: matchedUser?.uid
  });

  console.log("Saved ✅");

  this.form = { name: '', phone: '' };
  this.closeAdd();
}


  async remove(c: Contact) {
    if (!c.id) return;
    const ok = confirm('Delete this contact?');
    if (!ok) return;
    await this.contactService.deleteContact(this.myUid, c.id);
  }

  async openChat(c: Contact){
    if (!c.uid) {
      alert('This contact is not registered in Chatloop');
      return;
    }

    await this.chatService.ensureChat(
      this.chatService.getChatId(this.myUid, c.uid),
      [this.myUid, c.uid]
    );

    this.router.navigate(['/app/chats'], { queryParams:{ uid: c.uid }});
  }

  ngOnDestroy(){
    if(this.unsubContacts) this.unsubContacts();
    if(this.usersSub) this.usersSub.unsubscribe?.();
  }
}
