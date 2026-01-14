import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, updateDoc, arrayUnion } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';

import { UserService, AppUser } from '../../../core/services/user.service';

@Component({
  selector: 'app-add-members',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './add-members.component.html',
  styleUrls: ['./add-members.component.css'],
})
export class AddMembersComponent implements OnInit, OnDestroy {
  id = '';
  me = '';

  users: AppUser[] = [];
  filtered: AppUser[] = [];
  selected = new Set<string>();

  search = '';
  loading = false;
  err = '';

  private sub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private auth: Auth,
    private fs: Firestore,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    const u = this.auth.currentUser;
    if (!u) return;
    this.me = u.uid;

    this.id = this.route.snapshot.paramMap.get('id') || '';
    if (!this.id) return;

    this.sub = this.userService.getUsers().subscribe((list) => {
      this.users = (list || []).filter((x) => x.uid !== this.me);
      this.apply();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  apply() {
    const t = this.search.trim().toLowerCase();
    if (!t) {
      this.filtered = [...this.users];
      return;
    }
    this.filtered = this.users.filter((u) => {
      return (
        (u.name || '').toLowerCase().includes(t) ||
        (u.email || '').toLowerCase().includes(t) ||
        (u.phone || '').toLowerCase().includes(t)
      );
    });
  }

  toggle(uid: string) {
    if (this.selected.has(uid)) this.selected.delete(uid);
    else this.selected.add(uid);
  }

  isSelected(uid: string) {
    return this.selected.has(uid);
  }

  async add() {
    this.err = '';
    if (this.selected.size === 0) {
      this.err = 'Select at least one user';
      return;
    }

    try {
      this.loading = true;
      const roomRef = doc(this.fs, `rooms/${this.id}`);

      for (const uid of this.selected) {
        await updateDoc(roomRef, {
          members: arrayUnion(uid),
          [`unread.${uid}`]: 0,
        });
      }

      alert('✅ Members added');
      history.back();
    } catch (e: any) {
      console.error(e);
      this.err = e?.message || 'Add failed';
    } finally {
      this.loading = false;
    }
  }
}
