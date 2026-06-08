import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <main class="min-h-[calc(100vh-4rem)]">
      <router-outlet />
    </main>
  `,
  styles: ``
})
export class App {
  constructor(public auth: AuthService) {}
}
