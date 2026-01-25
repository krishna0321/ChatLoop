import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { Auth, signOut } from '@angular/fire/auth';

@Component({
  selector: 'app-leftbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './leftbar.component.html',
  styleUrls: ['./leftbar.component.css'],
})
export class LeftbarComponent {
  loading = false;

  constructor(private auth: Auth, private router: Router) {}

  async logout() {
    try {
      this.loading = true;
      await signOut(this.auth);
      await this.router.navigate(['/login']);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      this.loading = false;
    }
  }
}
