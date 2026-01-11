import { Component } from '@angular/core';

@Component({
  selector: 'app-contact',
  standalone: true,
  template: `
    <h2>📞 Contact</h2>

    <form>
      <input placeholder="Name" />
      <input placeholder="Email" />
      <textarea placeholder="Message"></textarea>
      <button>Send</button>
    </form>
  `,
  styles: [`
    input, textarea {
      width: 100%;
      padding: 8px;
      margin-bottom: 10px;
    }
  `]
})
export class ContactComponent {}
