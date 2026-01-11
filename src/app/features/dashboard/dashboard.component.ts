import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <h2>📊 Dashboard</h2>

    <div class="cards">
      <div class="card">💬 Chats</div>
      <div class="card">👥 Users</div>
      <div class="card">🔥 Firebase</div>
    </div>
  `,
  styles: [`
    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit,minmax(200px,1fr));
      gap: 1rem;
    }
    .card {
      padding: 1rem;
      background: #1e293b;
      color: white;
      border-radius: 8px;
    }
  `]
})
export class DashboardComponent {}
