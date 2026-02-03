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

  // add contact modal
  showAdd = false;
  saving = false;
  form: Contact = { name: '', phone: '' };

  users: AppUser[] = [];

  unsubContacts: any;
  usersSub: any;

  // toast
  toastMsg = '';
  toastType: 'ok' | 'err' = 'ok';
  toastVisible = false;

  // QR
  showScanner = false;
  private qr?: Html5Qrcode;

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

   
  // INIT
   
  ngOnInit() {
    onAuthStateChanged(this.auth, (u) => {
      if (!u) return;

      this.myUid = u.uid;

      this.usersSub = this.userService.getUsers().subscribe((list) => {
        this.users = list || [];
      });

      this.unsubContacts = this.contactService.listenContacts(
        this.myUid,
        (list) => {

          this.contacts = (list || []).map(c => {

            const user = this.users.find(u => u.uid === c.uid);

            return {
              ...c,
              photoURL: user?.photoURL || ''   // ✅ inject real avatar
            };

          }).sort((a, b) =>
            (a.name || '').localeCompare(b.name || '')
          );

          this.applyFilter();
        }
      );

    });
  }

   
  // UI HELPERS
   
  showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    this.toastMsg = msg;
    this.toastType = type;
    this.toastVisible = true;
    setTimeout(() => (this.toastVisible = false), 2000);
  }

  applyFilter() {
    const t = this.search.trim().toLowerCase();
    this.filtered = !t
      ? [...this.contacts]
      : this.contacts.filter((c) =>
          (c.name || '').toLowerCase().includes(t) ||
          (c.phone || '').toLowerCase().includes(t)
        );
  }

  normalizePhone(phone: string) {
    return (phone || '').replace(/\s+/g, '').replace(/[^0-9]/g, '').trim();
  }


   
  // ADD CONTACT
   
  openAdd() {
    this.showAdd = true;
    this.form = { name: '', phone: '' };
  }

  closeAdd() {
    this.showAdd = false;
    this.saving = false;
  }

  async saveManualContact() {
    if (!this.myUid) return;

    const name = this.form.name?.trim();
    const phone = this.normalizePhone(this.form.phone || '');

    if (!name || name.length < 2) {
      this.showToast('Invalid name', 'err');
      return;
    }

    if (!phone || phone.length < 8) {
      this.showToast('Invalid phone', 'err');
      return;
    }

    const exists = this.contacts.some(
      (c) => this.normalizePhone(c.phone || '') === phone
    );
    if (exists) {
      this.showToast('Already exists', 'err');
      return;
    }

    const matchedUser = this.users.find(
      (u) => this.normalizePhone(u.phone || '') === phone
    );

    try {
      this.saving = true;

      await this.contactService.addContact(this.myUid, {
        name,
        phone,
        uid: matchedUser?.uid || '',
      });

      this.showToast('Contact added');
      this.closeAdd();
    } catch {
      this.showToast('Failed', 'err');
    } finally {
      this.saving = false;
    }
  }

   
  // OPEN CHAT (🔥 MAIN FIX)
   
  async openChatByUid(uid: string) {
    if (!this.myUid) {
      this.showToast('Loading user...', 'err');
      return;
    }

    uid = (uid || '').trim();

    if (!uid || uid.length < 6) {
      this.showToast('User not on Chatloop', 'err');
      return;
    }

    if (uid === this.myUid) {
      this.showToast("That's you 😅", 'err');
      return;
    }

    try {
      const chatId = this.chatService.getChatId(this.myUid, uid);

      await this.chatService.ensureChat(chatId, [this.myUid, uid]);

      // ✅ IMPORTANT: this prevents going to home
      await this.router.navigate(['/app/chats'], {
        queryParams: { uid },
        replaceUrl: true,
      });
    } catch (e) {
      console.error(e);
      this.showToast('Cannot open chat', 'err');
    }
  }

   
  // QR SCAN
   
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
          (text) => this.onQrScanned(text),
          () => {}
        );
      } catch {
        this.showToast('Camera denied', 'err');
        this.closeScanner();
      }
    }, 100);
  }

  async closeScanner() {
    this.showScanner = false;
    try {
      await this.qr?.stop();
      await this.qr?.clear();
    } catch {}
    this.qr = undefined;
  }

  extractUidFromQr(text: string): string {
    if (text.startsWith('chatloop://user/')) {
      return text.replace('chatloop://user/', '');
    }
    return text.trim();
  }

  async onQrScanned(text: string) {
    const uid = this.extractUidFromQr(text);

    if (!uid || uid === this.myUid) {
      this.showToast('Invalid QR', 'err');
      return;
    }

    await this.closeScanner();

    const found = this.users.find((u) => u.uid === uid);
    if (!found) {
      this.showToast('User not registered', 'err');
      return;
    }

    this.scannedUid = uid;
    this.scannedUser = found;
    this.showScanResult = true;
  }

  async openChatFromScan() {
    if (!this.scannedUid) return;
    this.showScanResult = false;
    await this.openChatByUid(this.scannedUid);
  }

   
  // DELETE
   
  async removeContact(c: Contact) {
    if (!confirm(`Delete ${c.name}?`)) return;

    try {
      await this.contactService.deleteContact(this.myUid, c.id!);
      this.showToast('Deleted');
    } catch {
      this.showToast('Failed', 'err');
    }
  }
   
     
// ✅ CLOSE QR RESULT MODAL
 
closeScanResult() {
  this.showScanResult = false;
  this.scannedUid = '';
  this.scannedUser = null;
}

 
// ✅ ADD FRIEND FROM QR SCAN
 
async addFriendFromScan() {
  if (!this.myUid || !this.scannedUser) return;

  const uid = this.scannedUser.uid;

  const exists = this.contacts.some((c) => c.uid === uid);
  if (exists) {
    this.showToast('Already in contacts', 'err');
    return;
  }

  try {
    await this.contactService.addContact(this.myUid, {
      name: this.scannedUser.name || 'New Friend',
      phone: this.scannedUser.phone || '',
      uid: uid,
    });

    this.showToast('Friend added');
    this.closeScanResult();
  } catch (e) {
    console.error(e);
    this.showToast('Failed to add friend', 'err');
  }
}


  ngOnDestroy() {
    this.unsubContacts?.();
    this.usersSub?.unsubscribe?.();
    this.closeScanner();
  }

}
