import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Snippet } from '../../models/snippet';
import { SnippetService } from '../../services/snippet.service';
import { AuthService } from '../../services/auth.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-snippet-detail',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-8">
      @if (loading) {
        <div class="text-center py-20">
          <div class="inline-block w-8 h-8 border-2 border-neon-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else if (snippet) {
        <div class="bg-dark-900 border border-dark-700 rounded-xl p-6 md:p-8">
          <!-- Header -->
          <div class="flex items-start justify-between mb-6">
            <div>
              <h1 class="text-2xl md:text-3xl font-bold text-white mb-2">{{ snippet.title }}</h1>
              <div class="flex items-center gap-3 text-sm text-dark-400">
                <span class="font-mono bg-dark-800 text-dark-300 px-2 py-0.5 rounded">{{ snippet.language }}</span>
                <span>Creado {{ snippet.created_at | date:'mediumDate' }}</span>
                @if (snippet.updated_at !== snippet.created_at) {
                  <span>· Editado {{ snippet.updated_at | date:'mediumDate' }}</span>
                }
              </div>
            </div>
            <div class="flex gap-2">
              <button (click)="copyCode()"
                      class="bg-dark-800 hover:bg-dark-700 text-dark-300 px-3 py-2 rounded-lg text-sm transition-colors">
                {{ copied ? '✅ Copiado!' : '📋 Copiar' }}
              </button>
              <a [routerLink]="['/snippets', snippet.id, 'edit']"
                 class="bg-dark-800 hover:bg-dark-700 text-dark-300 px-3 py-2 rounded-lg text-sm transition-colors">
                Editar
              </a>
              <button (click)="deleteSnippet()"
                      class="bg-red-900/30 hover:bg-red-800/50 text-red-400 px-3 py-2 rounded-lg text-sm transition-colors">
                Eliminar
              </button>
            </div>
          </div>

          <!-- Description -->
          @if (snippet.description) {
            <p class="text-dark-300 mb-6">{{ snippet.description }}</p>
          }

          <!-- Tags -->
          @if (snippet.tags.length > 0) {
            <div class="flex gap-2 flex-wrap mb-6">
              @for (tag of snippet.tags; track tag) {
                <span class="text-xs bg-dark-800 text-dark-400 px-3 py-1 rounded-full">{{ tag }}</span>
              }
            </div>
          }

          <!-- Code -->
          <div class="relative">
            <pre class="bg-dark-950 border border-dark-700 rounded-xl p-4 md:p-6 overflow-x-auto"><code class="text-sm leading-relaxed">{{ snippet.code }}</code></pre>
          </div>
        </div>

        <div class="mt-6">
          <a routerLink="/dashboard" class="text-dark-400 hover:text-white transition-colors">
            ← Volver a mis snippets
          </a>
        </div>
      }
    </div>
  `,
  styles: ``
})
export class SnippetDetailComponent implements OnInit {
  snippet?: Snippet;
  loading = true;
  copied = false;

  constructor(
    private route: ActivatedRoute,
    private snippetService: SnippetService,
    private auth: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/']);
      return;
    }
    const id = this.route.snapshot.paramMap.get('id')!;
    try {
      this.snippet = await this.snippetService.getById(id);
    } catch (err) {
      this.router.navigate(['/dashboard']);
    } finally {
      this.loading = false;
    }
  }

  async copyCode() {
    if (this.snippet) {
      await navigator.clipboard.writeText(this.snippet.code);
      this.copied = true;
      setTimeout(() => this.copied = false, 2000);
    }
  }

  async deleteSnippet() {
    if (!this.snippet) return;
    if (!confirm('¿Eliminar este snippet?')) return;
    try {
      await this.snippetService.delete(this.snippet.id);
      this.router.navigate(['/dashboard']);
    } catch (err) {
      console.error('Error deleting:', err);
    }
  }
}
