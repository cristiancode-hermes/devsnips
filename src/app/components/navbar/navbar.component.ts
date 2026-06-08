import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="bg-dark-900 border-b border-dark-700 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
          <a routerLink="/" class="flex items-center gap-2 text-xl font-bold">
            <span class="text-neon-500">&#123;&#773;&#125;</span>
            <span class="text-white">DevSnips</span>
          </a>

          @if (auth.isLoggedIn()) {
            <div class="flex items-center gap-4">
              <a routerLink="/dashboard" routerLinkActive="text-neon-400"
                 class="text-dark-300 hover:text-white transition-colors">
                Mis Snippets
              </a>
              <a routerLink="/snippets/new"
                 class="bg-neon-600 hover:bg-neon-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                + Nuevo
              </a>
              <div class="flex items-center gap-2">
                @if (user?.picture) {
                  <img [src]="user?.picture" alt="" class="w-8 h-8 rounded-full">
                }
                <span class="text-sm text-dark-300">{{ user?.name || user?.email }}</span>
                <button (click)="auth.logout()"
                        class="text-dark-500 hover:text-red-400 text-sm transition-colors ml-2">
                  Salir
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    </nav>
  `,
  styles: ``
})
export class NavbarComponent {
  constructor(public auth: AuthService) {}

  get user() {
    return this.auth.getUser();
  }
}
