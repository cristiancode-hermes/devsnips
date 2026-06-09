import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center px-4">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <a routerLink="/" class="text-4xl text-neon-500 font-mono font-bold">&#123;&#773;&#125;</a>
          <h1 class="text-3xl font-bold text-white mt-4">Iniciar sesión</h1>
          <p class="text-dark-400 mt-2">Accede a tus snippets</p>
        </div>

        <div class="bg-dark-900 border border-dark-700 rounded-2xl p-8">
          <!-- Google OAuth -->
          <button (click)="auth.loginWithGoogle()"
                  class="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-dark-900 font-medium py-3 px-4 rounded-xl transition-all mb-6">
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>

          <div class="relative mb-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-dark-600"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="bg-dark-900 px-4 text-dark-400">o con email</span>
            </div>
          </div>

          <!-- Formulario email/password -->
          @if (error()) {
            <div class="bg-red-900/30 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm mb-4">
              {{ error() }}
            </div>
          }

          <form (ngSubmit)="onSubmit()" class="space-y-4">
            <div>
              <label for="email" class="block text-sm font-medium text-dark-300 mb-1">Email</label>
              <input
                id="email"
                type="email"
                [(ngModel)]="email"
                name="email"
                required
                autocomplete="email"
                placeholder="tu@email.com"
                class="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:border-neon-500 focus:ring-1 focus:ring-neon-500 transition-colors"
              >
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-dark-300 mb-1">Contraseña</label>
              <input
                id="password"
                type="password"
                [(ngModel)]="password"
                name="password"
                required
                autocomplete="current-password"
                placeholder="••••••••"
                class="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:border-neon-500 focus:ring-1 focus:ring-neon-500 transition-colors"
              >
            </div>

            <button type="submit"
                    [disabled]="loading()"
                    class="w-full bg-neon-600 hover:bg-neon-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-neon-600/20">
              @if (loading()) {
                <span class="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              } @else {
                Iniciar sesión
              }
            </button>
          </form>
        </div>

        <p class="text-center text-dark-400 mt-6">
          ¿No tienes cuenta?
          <a routerLink="/register" class="text-neon-400 hover:text-neon-300 font-medium">Crear cuenta</a>
        </p>
      </div>
    </div>
  `,
  styles: ``
})
export class LoginComponent {
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  constructor(
    public auth: AuthService,
    private router: Router
  ) {}

  async onSubmit() {
    if (!this.email || !this.password) {
      this.error.set('Completa todos los campos');
      return;
    }
    this.loading.set(true);
    this.error.set('');

    const result = await this.auth.loginWithEmail(this.email, this.password);
    this.loading.set(false);

    if (result.success) {
      this.router.navigate(['/dashboard']);
    } else {
      this.error.set(result.error || 'Error al iniciar sesión');
    }
  }
}
