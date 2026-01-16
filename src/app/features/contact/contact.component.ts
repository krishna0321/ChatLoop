import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Router } from '@angular/router';

import { ContactService, Contact } from '../../core/services/contact.service';
import { ChatService } from '../../core/services/chat.service';
import { UserService, AppUser } from '../../core/services/user.service';

import { Html5Qrcode } from 'html5-qrcode';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css'],
})
export class ContactComponent implements OnInit, OnDestroy {
  myUid = '';

  contacts: Contact[] = [];
  filtered: Contact[] = [];
  search = '';

  // ✅ ADD MODAL
  showAdd = false;
  saving = false;
  form: Contact = { name: '', phone: '' };

  openAdd() {
    this.showAdd = true;
    this.form = { name: '', phone: '' };
  }

  closeAdd() {
    this.showAdd = false;
    this.saving = false;
  }

  users: AppUser[] = [];

  unsubContacts: any;
  usersSub: any;

  // ✅ toast
  toastMsg = '';
  toastType: 'ok' | 'err' = 'ok';
  toastVisible = false;

  // ✅ QR Scanner
  showScanner = false;
  private qr?: Html5Qrcode;

  // ✅ after scan popup
  showScanResult = false;
  scannedUid = '';
  scannedUser: AppUser | null = null;

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

      this.usersSub = this.userService.getUsers().subscribe((list) => {
        this.users = list || [];
      });

      this.unsubContacts = this.contactService.listenContacts(this.myUid, (list) => {
        this.contacts = (list || []).sort((a, b) =>
          (a.name || '').localeCompare(b.name || '')
        );
        this.applyFilter();
      });
    });
  }

  showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    this.toastMsg = msg;
    this.toastType = type;
    this.toastVisible = true;
    setTimeout(() => (this.toastVisible = false), 2200);
  }

  applyFilter() {
    const t = this.search.trim().toLowerCase();
    if (!t) {
      this.filtered = [...this.contacts];
      return;
    }
    this.filtered = this.contacts.filter((c) => {
      const n = (c.name || '').toLowerCase();
      const p = (c.phone || '').toLowerCase();
      return n.includes(t) || p.includes(t);
    });
  }

  // ✅ normalize phone
  normalizePhone(phone: string) {
    return (phone || '').replace(/\s+/g, '').trim();
  }

  // ===================================================
  // ✅ NEW: SAVE MANUAL CONTACT (FIX)
  // ===================================================
  async saveManualContact() {
    if (!this.myUid) return;

    const name = (this.form.name || '').trim();
    const phone = this.normalizePhone(this.form.phone || '');

    if (!name || name.length < 2) {
      this.showToast('❌ Enter valid name', 'err');
      return;
    }

    if (!phone || phone.length < 8) {
      this.showToast('❌ Enter valid phone number', 'err');
      return;
    }

    // prevent duplicates
    const exists = this.contacts.some(
      (c) => this.normalizePhone(c.phone || '') === phone
    );
    if (exists) {
      this.showToast('⚠ This number already in contacts', 'err');
      return;
    }

    // ✅ if user exists in app, link uid automatically
    const matchedUser = this.users.find(
      (u) => this.normalizePhone(u.phone || '') === phone
    );

    try {
      this.saving = true;

      await this.contactService.addContact(this.myUid, {
        name,
        phone,
        uid: matchedUser?.uid || '', // optional
      });

      this.showToast('✅ Contact added', 'ok');
      this.closeAdd();
    } catch (e) {
      console.error(e);
      this.showToast('❌ Failed to add contact', 'err');
    } finally {
      this.saving = false;
    }
  }

  // ===================================================
  // ✅ QR SCANNER (scan url & extract UID)
  // ===================================================

  async openScanner() {
    this.showScanner = true;
    this.scannedUid = '';
    this.scannedUser = null;

    setTimeout(async () => {
      try {
        this.qr = new Html5Qrcode('qr-reader');

        await this.qr.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 250 },
          async (decodedText) => {
            await this.onQrScanned(decodedText);
          },
          () => {}
        );
      } catch (err) {
        console.error(err);
        this.showToast('❌ Camera permission needed', 'err');
        this.closeScanner();
      }
    }, 50);
  }

  async closeScanner() {
    this.showScanner = false;
    try {
      if (this.qr) {
        await this.qr.stop();
        await this.qr.clear();
        this.qr = undefined;
      }
    } catch {}
  }

  extractUidFromQr(text: string): string {
    const t = (text || '').trim();

    if (t.startsWith('chatloop://user/')) {
      return t.replace('chatloop://user/', '').trim();
    }

    try {
      if (t.startsWith('http')) {
        const url = new URL(t);
        const parts = url.pathname.split('/').filter(Boolean);

        const uIndex = parts.indexOf('u');
        if (uIndex !== -1 && parts[uIndex + 1]) return parts[uIndex + 1];

        const userIndex = parts.indexOf('user');
        if (userIndex !== -1 && parts[userIndex + 1]) return parts[userIndex + 1];
      }
    } catch {}

    return t;
  }

  async onQrScanned(decodedText: string) {
    const uid = this.extractUidFromQr(decodedText);

    if (!uid || uid.length < 6) {
      this.showToast('❌ Invalid QR', 'err');
      return;
    }

    if (uid === this.myUid) {
      this.showToast("⚠ That's your own QR", 'err');
      return;
    }

    await this.closeScanner();

    const found = this.users.find((x) => x.uid === uid);
    if (!found) {
      this.showToast('❌ User not registered', 'err');
      return;
    }

    this.scannedUid = uid;
    this.scannedUser = found;
    this.showScanResult = true;
  }

  closeScanResult() {
    this.showScanResult = false;
    this.scannedUid = '';
    this.scannedUser = null;
  }

  // ===================================================
  // ✅ ADD FRIEND (save contact)
  // ===================================================
  async addFriendFromScan() {
    if (!this.myUid || !this.scannedUser) return;

    const uid = this.scannedUser.uid;

    const exists = this.contacts.some((c) => c.uid === uid);
    if (exists) {
      this.showToast('⚠ Already in contacts', 'err');
      return;
    }

    try {
      await this.contactService.addContact(this.myUid, {
        name: this.scannedUser.name || 'New Friend',
        phone: this.scannedUser.phone || '',
        uid: uid,
      });

      this.showToast('✅ Friend added', 'ok');
      this.closeScanResult();
    } catch (e) {
      console.error(e);
      this.showToast('❌ Failed to add friend', 'err');
    }
  }

  // ===================================================
  // ✅ OPEN CHAT BY UID
  // ===================================================
  async openChatByUid(uid: string) {
    await this.chatService.ensureChat(
      this.chatService.getChatId(this.myUid, uid),
      [this.myUid, uid]
    );

    this.router.navigate(['/app/chats'], { queryParams: { uid } });
  }

  async openChatFromScan() {
    if (!this.scannedUid) return;
    const uid = this.scannedUid;
    this.closeScanResult();
    await this.openChatByUid(uid);
  }

  async removeContact(c: Contact) {
    const ok = confirm(`Delete contact "${c.name}" ?`);
    if (!ok) return;

    try {
      await this.contactService.deleteContact(this.myUid, c.id!);
      this.showToast('✅ Contact deleted', 'ok');
    } catch (e) {
      console.error(e);
      this.showToast('❌ Delete failed', 'err');
    }
  }

  ngOnDestroy() {
    if (this.unsubContacts) this.unsubContacts();
    if (this.usersSub) this.usersSub.unsubscribe?.();
    this.closeScanner();
  }
}
