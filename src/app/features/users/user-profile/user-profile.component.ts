import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import QRCode from 'qrcode';

import { AppUser, UserService } from '../../../core/services/user.service';
import { ChatService } from '../../../core/services/chat.service';
import { ContactService } from '../../../core/services/contact.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css'],
})
export class UserProfileComponent implements OnInit, OnDestroy {
  myUid = '';
  uid = '';

  loading = true;

  user: AppUser | null = null;
  isMe = false;

  isBlocked = false;
  isContact = false;

  profileLink = '';
  qrDataUrl = '';

  private authUnsub?: () => void;
  private userSub: any;
  private meSub: any;

  constructor(
    private auth: Auth,
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private chatService: ChatService,
    private contactService: ContactService
  ) {}

  ngOnInit(): void {
    this.uid = this.route.snapshot.paramMap.get('uid') || '';

    this.authUnsub = onAuthStateChanged(this.auth, async (u) => {
      if (!u) {
        this.router.navigate(['/login']);
        return;
      }

      this.myUid = u.uid;
      this.isMe = this.myUid === this.uid;

      if (!this.uid) {
        this.router.navigate(['/app/chats']);
        return;
      }

      // ✅ user details
      this.userSub = this.userService.getUser(this.uid).subscribe(async (data) => {
        this.user = data || null;
        this.loading = false;

        if (this.user) {
          // ✅ share link
          this.profileLink = `${location.origin}/app/user/${this.uid}`;

          // ✅ QR create
          this.qrDataUrl = await QRCode.toDataURL(this.profileLink, {
            width: 230,
            margin: 1,
          });
        }
      });

      // ✅ block status
      this.meSub = this.userService.getUser(this.myUid).subscribe((me) => {
        const blocked = me?.blocked || [];
        this.isBlocked = blocked.includes(this.uid);
      });

      // ✅ contact exists
      this.contactService.listenContacts(this.myUid, (list) => {
        this.isContact = !!(list || []).find((c: any) => c.uid === this.uid);
      });
    });
  }

  ngOnDestroy(): void {
    this.authUnsub?.();
    this.userSub?.unsubscribe?.();
    this.meSub?.unsubscribe?.();
  }

  async message() {
    if (!this.uid || this.uid === this.myUid) return;

    const chatId = this.chatService.getChatId(this.myUid, this.uid);

    await this.chatService.ensureChat(chatId, [this.myUid, this.uid]);

    this.router.navigate(['/app/chats'], { queryParams: { uid: this.uid } });
  }

  async addToContacts() {
    if (!this.user || !this.uid || this.uid === this.myUid) return;
    if (this.isContact) return;

    await this.contactService.addContact(this.myUid, {
      name: this.user.name || 'New Friend',
      phone: this.user.phone || '',
      uid: this.uid,
    });

    alert('✅ Added to contacts');
  }

  async toggleBlock() {
    if (!this.uid || this.uid === this.myUid) return;

    if (!this.isBlocked) {
      const ok = confirm('Block this user?');
      if (!ok) return;

      await this.userService.blockUser(this.myUid, this.uid);
      this.isBlocked = true;

      alert('⛔ User blocked');
    } else {
      await this.userService.unblockUser(this.myUid, this.uid);
      this.isBlocked = false;

      alert('✅ User unblocked');
    }
  }

  copy(text: string) {
    navigator.clipboard.writeText(text || '');
    alert('✅ Copied');
  }
}
