import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div class="dash">
      <div class="head">
        <h2>📊 Dashboard</h2>
        <p>Overview of your Chatloop app</p>
      </div>

      <div class="cards">
        <div class="card">
          <div class="icon">💬</div>
          <div>
            <div class="title">Chats</div>
            <div class="sub">Rooms & messages</div>
          </div>
        </div>

        <div class="card">
          <div class="icon">👥</div>
          <div>
            <div class="title">Users</div>
            <div class="sub">Connections & profiles</div>
          </div>
        </div>

        <div class="card">
          <div class="icon">🔥</div>
          <div>
            <div class="title">Firebase</div>
            <div class="sub">Realtime database status</div>
          </div>
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

    .dash{
      width:100%;
      height:100%;
      padding: 18px;
      color: white;
      overflow:auto;
      min-width:0;
      background: #020617;
    }

    .head{
      margin-bottom: 14px;
    }

    .head h2{
      margin:0;
      font-size: 20px;
      font-weight: 950;
    }

    .head p{
      margin: 6px 0 0;
      opacity: .7;
      font-size: 13px;
    }

    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit,minmax(220px,1fr));
      gap: 14px;
    }

    .card {
      padding: 16px;
      background: rgba(30,41,59,0.55);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 18px;
      display:flex;
      gap: 12px;
      align-items:center;
      min-width:0;
      transition: .18s ease;
      backdrop-filter: blur(12px);
      box-shadow: 0 18px 55px rgba(0,0,0,0.45);
    }

    .card:hover{
      transform: translateY(-2px);
      border-color: rgba(59,130,246,0.25);
    }

    .icon{
      width: 46px;
      height: 46px;
      border-radius: 16px;
      display:grid;
      place-items:center;
      font-size: 22px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.08);
      flex-shrink:0;
    }

    .title{
      font-weight: 950;
      font-size: 14px;
    }
    .sub{
      margin-top: 3px;
      font-size: 12px;
      opacity: .75;
    }

    /* ✅ Mobile responsive */
    @media (max-width: 900px){
      .dash{
        padding: 14px;
        padding-bottom: 90px; /* ✅ bottom nav safe space */
      }

      .cards{
        grid-template-columns: 1fr; /* ✅ single column on mobile */
      }
    }
  `]
})
export class DashboardComponent {}
