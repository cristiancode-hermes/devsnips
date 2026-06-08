import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SnippetCardComponent } from '../../components/snippet-card/snippet-card.component';
import { Snippet } from '../../models/snippet';
import { SnippetService } from '../../services/snippet.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SnippetCardComponent, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-white">Mis Snippets</h1>
          <p class="text-dark-400 mt-1">{{ snippets.length }} snippet{{ snippets.length !== 1 ? 's' : '' }} guardados</p>
        </div>
        <a routerLink="/snippets/new"
           class="bg-neon-600 hover:bg-neon-500 text-white px-5 py-2.5 rounded-lg font-medium transition-colors">
          + Nuevo snippet
        </a>
      </div>

      <div class="mb-6">
        <input type="text"
               placeholder="Buscar snippets..."
               (input)="filterSnippets($event)"
               class="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:border-neon-600 transition-colors">
      </div>

      @if (loading) {
        <div class="text-center py-20">
          <div class="inline-block w-8 h-8 border-2 border-neon-500 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-dark-400 mt-4">Cargando snippets...</p>
        </div>
      } @else if (filteredSnippets.length === 0) {
        <div class="text-center py-20 bg-dark-900 border border-dark-700 rounded-xl">
          <div class="text-5xl mb-4">📭</div>
          <p class="text-dark-400 text-lg mb-2">No hay snippets todavía</p>
          <p class="text-dark-500 text-sm mb-6">Crea tu primer snippet para empezar</p>
          <a routerLink="/snippets/new"
             class="bg-neon-600 hover:bg-neon-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors inline-block">
            Crear primer snippet
          </a>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (snippet of filteredSnippets; track snippet.id) {
            <app-snippet-card [snippet]="snippet"></app-snippet-card>
          }
        </div>
      }
    </div>
  `,
  styles: ``
})
export class DashboardComponent implements OnInit {
  snippets: Snippet[] = [];
  filteredSnippets: Snippet[] = [];
  loading = true;

  constructor(
    private snippetService: SnippetService,
    private auth: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/']);
      return;
    }
    try {
      this.snippets = await this.snippetService.getAll();
      this.filteredSnippets = [...this.snippets];
    } catch (err) {
      console.error('Error loading snippets:', err);
    } finally {
      this.loading = false;
    }
  }

  filterSnippets(event: Event) {
    const q = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredSnippets = this.snippets.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q) ||
      s.language.toLowerCase().includes(q) ||
      s.tags.some(t => t.toLowerCase().includes(q)) ||
      s.code.toLowerCase().includes(q)
    );
  }
}
