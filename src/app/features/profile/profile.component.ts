import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService, ProfileUser } from '../../core/services/profile.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profile-page" *ngIf="user as u">

      <!-- LEFT PANEL (Telegram) -->
      <aside class="left">
        <div class="avatar">{{ u.name[0] || 'U' }}</div>

        <div class="name">{{ u.name }}</div>
        <div class="phone">{{ u.phone || 'No phone' }}</div>

        <button class="primary" (click)="toggleEdit()">
          {{ editMode ? 'Close Edit' : 'Edit Profile' }}
        </button>

        <button class="ghost" (click)="copyUid(u.uid)">Copy UID</button>

        <div class="status">
          <span class="dot"></span>
          Active
        </div>
      </aside>

      <!-- RIGHT PANEL -->
      <section class="right">

        <div class="top-title">
          <h2>Profile</h2>
          <p>Manage your account like Telegram</p>
        </div>

        <!-- Info card -->
        <div class="card">
          <div class="row">
            <span>Email</span>
            <b>{{ u.email }}</b>
          </div>
          <div class="row">
            <span>Phone</span>
            <b>{{ u.phone || '-' }}</b>
          </div>
          <div class="row">
            <span>User ID</span>
            <b class="mono">{{ u.uid }}</b>
          </div>
        </div>

        <!-- Edit card -->
        <div class="card" *ngIf="editMode">
          <h3>Edit profile</h3>

          <div class="form">
            <label>Name</label>
            <input [(ngModel)]="form.name" placeholder="Enter name" />

            <label>Phone</label>
            <input [(ngModel)]="form.phone" placeholder="Enter phone" />

            <div class="actions">
              <button class="primary" (click)="save()">Save</button>
              <button class="ghost" (click)="reset(u)">Reset</button>
            </div>
          </div>

          <p class="ok" *ngIf="msg">{{ msg }}</p>
          <p class="err" *ngIf="err">{{ err }}</p>
        </div>

      </section>
    </div>
  `,
  styles: [`
    :host{
      flex: 1;
      display: flex;
      min-width: 0;
      height: 100%;
    }

    .profile-page{
      flex:1;
      display:flex;
      height:100%;
      width:100%;
      overflow:hidden;
      color:#e5e7eb;
      background: radial-gradient(circle at top left, #0b1a3b, #020617 60%);
    }

    /* LEFT PANEL */
    .left{
      width: 320px;
      padding: 22px 18px;
      border-right: 1px solid rgba(255,255,255,0.06);
      background: rgba(15, 23, 42, 0.55);
      backdrop-filter: blur(12px);

      display:flex;
      flex-direction:column;
      gap: 14px;
    }

    .avatar{
      width: 92px;
      height: 92px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2563eb, #60a5fa);
      display:grid;
      place-items:center;
      font-size: 34px;
      font-weight: 900;
      text-transform: uppercase;
      margin: 6px auto 0;
      box-shadow: 0 18px 40px rgba(0,0,0,0.35);
    }

    .name{
      text-align:center;
      font-size: 20px;
      font-weight: 900;
      margin-top: 6px;
    }

    .phone{
      text-align:center;
      font-size: 13px;
      opacity: .8;
      margin-top: -6px;
    }

    .primary{
      width:100%;
      height: 44px;
      border:none;
      border-radius: 14px;
      cursor:pointer;
      background: #2563eb;
      color:white;
      font-weight: 900;
    }
    .primary:hover{ opacity:.95; }

    .ghost{
      width:100%;
      height: 44px;
      border-radius: 14px;
      cursor:pointer;
      border:1px solid rgba(255,255,255,0.12);
      background: rgba(2,6,23,0.35);
      color:white;
      font-weight: 800;
    }

    .status{
      margin-top:auto;
      display:flex;
      justify-content:center;
      align-items:center;
      gap:8px;
      opacity:.8;
      font-size: 13px;
    }

    .dot{
      width:8px;height:8px;border-radius:50%;
      background:#22c55e;
      box-shadow: 0 0 0 4px rgba(34,197,94,0.12);
    }

    /* RIGHT PANEL */
    .right{
      flex:1;
      padding: 26px;
      overflow:auto;
    }

    .right::-webkit-scrollbar{ width:10px; }
    .right::-webkit-scrollbar-thumb{
      background: rgba(255,255,255,0.12);
      border-radius: 20px;
    }

    .top-title h2{
      margin: 0;
      font-size: 22px;
      font-weight: 950;
    }

    .top-title p{
      margin: 6px 0 0;
      opacity: .7;
      font-size: 13px;
    }

    .card{
      margin-top: 18px;
      max-width: 720px;
      background: rgba(15, 23, 42, 0.65);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 18px;
      padding: 16px;
      backdrop-filter: blur(12px);
    }

    .row{
      display:flex;
      justify-content:space-between;
      gap: 20px;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .row:last-child{ border-bottom:none; }

    .row span{ opacity:.7; font-size: 13px; }
    .row b{ font-size: 13px; }

    .mono{
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      opacity: .9;
      word-break: break-all;
    }

    h3{
      margin: 0 0 12px;
      font-size: 15px;
      font-weight: 900;
    }

    .form{
      display:flex;
      flex-direction:column;
      gap: 8px;
    }

    label{
      font-size: 12px;
      opacity: .75;
      margin-top: 8px;
    }

    input{
      height: 44px;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(2,6,23,0.5);
      color: white;
      padding: 0 12px;
      outline: none;
    }

    input:focus{
      border-color: rgba(59,130,246,0.8);
      box-shadow: 0 0 0 4px rgba(59,130,246,0.15);
    }

    .actions{
      display:flex;
      gap: 10px;
      margin-top: 14px;
    }

    .actions button{
      flex:1;
    }

    .ok{ color:#22c55e; font-weight:800; margin-top: 12px; }
    .err{ color:#ef4444; font-weight:800; margin-top: 12px; }

    @media (max-width: 900px){
      .profile-page{ flex-direction: column; }
      .left{ width:100%; border-right:none; border-bottom:1px solid rgba(255,255,255,0.06); }
    }
  `]
})
export class ProfileComponent {
  user: ProfileUser | null = null;

  editMode = false;

  form = {
    name: '',
    phone: ''
  };

  msg = '';
  err = '';

  constructor(private profile: ProfileService) {
    this.profile.getMyProfile().subscribe((u) => {
      this.user = u;
      if (u) this.reset(u);
    });
  }

  toggleEdit() {
    this.editMode = !this.editMode;
    this.msg = '';
    this.err = '';
  }

  reset(u: ProfileUser) {
    this.form.name = u.name || '';
    this.form.phone = u.phone || '';
  }

  async save() {
    this.msg = '';
    this.err = '';
    try {
      await this.profile.updateMyProfile(this.form);
      this.msg = 'Profile updated ✅';
      this.editMode = false;
    } catch (e: any) {
      this.err = e?.message || 'Update failed';
    }
  }

  copyUid(uid: string) {
    navigator.clipboard.writeText(uid);
    this.msg = 'UID copied ✅';
    setTimeout(() => (this.msg = ''), 1500);
  }
}
