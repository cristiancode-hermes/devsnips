import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center px-4">
      <div class="text-center max-w-2xl">
        <div class="text-7xl mb-6 text-neon-500 font-mono font-bold">&#123;&#773;&#125;</div>
        <h1 class="text-5xl font-bold text-white mb-4">DevSnips</h1>
        <p class="text-xl text-dark-400 mb-8">
          Tu colección personal de snippets de código.
          Guarda, organiza y encuentra tu código rápido.
        </p>

        <div class="flex justify-center gap-4">
          @if (!auth.isLoggedIn()) {
            <button (click)="auth.login()"
                    class="bg-neon-600 hover:bg-neon-500 text-white px-8 py-3 rounded-xl text-lg font-semibold transition-all shadow-lg shadow-neon-600/20">
              Iniciar sesión
            </button>
          } @else {
            <button (click)="router.navigate(['/dashboard'])"
                    class="bg-neon-600 hover:bg-neon-500 text-white px-8 py-3 rounded-xl text-lg font-semibold transition-all">
              Ir a mis snippets →
            </button>
          }
        </div>

        <div class="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div class="bg-dark-900 border border-dark-700 rounded-xl p-6">
            <div class="text-2xl mb-2">📝</div>
            <h3 class="font-semibold text-white mb-2">Guarda snippets</h3>
            <p class="text-dark-400 text-sm">Código de cualquier lenguaje, con descripción y etiquetas.</p>
          </div>
          <div class="bg-dark-900 border border-dark-700 rounded-xl p-6">
            <div class="text-2xl mb-2">🔍</div>
            <h3 class="font-semibold text-white mb-2">Encuentra rápido</h3>
            <p class="text-dark-400 text-sm">Busca por lenguaje, etiquetas o texto. Todo organizado.</p>
          </div>
          <div class="bg-dark-900 border border-dark-700 rounded-xl p-6">
            <div class="text-2xl mb-2">☁️</div>
            <h3 class="font-semibold text-white mb-2">Siempre disponible</h3>
            <p class="text-dark-400 text-sm">Tus snippets en la nube, accede desde cualquier lado.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: ``
})
export class HomeComponent {
  constructor(
    public auth: AuthService,
    public router: Router
  ) {}
}
