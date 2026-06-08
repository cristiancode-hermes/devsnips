import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SnippetService } from '../../services/snippet.service';
import { AuthService } from '../../services/auth.service';
import { Snippet } from '../../models/snippet';

const LANGUAGES = [
  'text', 'javascript', 'typescript', 'python', 'html', 'css', 'scss',
  'bash', 'sql', 'json', 'yaml', 'markdown', 'dockerfile', 'go', 'rust',
  'java', 'kotlin', 'swift', 'php', 'ruby', 'c', 'cpp', 'csharp',
];

@Component({
  selector: 'app-snippet-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <div class="bg-dark-900 border border-dark-700 rounded-xl p-6 md:p-8">
        <h1 class="text-2xl font-bold text-white mb-8">
          {{ isEditing ? 'Editar snippet' : 'Nuevo snippet' }}
        </h1>

        <form (ngSubmit)="save()" class="space-y-6">
          <!-- Title -->
          <div>
            <label for="title" class="block text-sm font-medium text-dark-300 mb-2">Título *</label>
            <input id="title" name="title" [(ngModel)]="title" required
                   class="w-full bg-dark-950 border border-dark-700 rounded-lg px-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:border-neon-600 transition-colors"
                   placeholder="Ej: Función para ordenar array">
          </div>

          <!-- Description -->
          <div>
            <label for="description" class="block text-sm font-medium text-dark-300 mb-2">Descripción</label>
            <textarea id="description" name="description" [(ngModel)]="description" rows="2"
                      class="w-full bg-dark-950 border border-dark-700 rounded-lg px-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:border-neon-600 transition-colors"
                      placeholder="Breve descripción del snippet"></textarea>
          </div>

          <!-- Language + Tags row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="language" class="block text-sm font-medium text-dark-300 mb-2">Lenguaje *</label>
              <select id="language" name="language" [(ngModel)]="language" required
                      class="w-full bg-dark-950 border border-dark-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-600 transition-colors">
                @for (lang of languages; track lang) {
                  <option [value]="lang">{{ lang }}</option>
                }
              </select>
            </div>
            <div>
              <label for="tags" class="block text-sm font-medium text-dark-300 mb-2">Tags (separadas por coma)</label>
              <input id="tags" name="tags" [(ngModel)]="tagsInput"
                     class="w-full bg-dark-950 border border-dark-700 rounded-lg px-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:border-neon-600 transition-colors"
                     placeholder="algoritmo, util, react">
            </div>
          </div>

          <!-- Code -->
          <div>
            <label for="code" class="block text-sm font-medium text-dark-300 mb-2">Código *</label>
            <textarea id="code" name="code" [(ngModel)]="code" required rows="12"
                      class="w-full bg-dark-950 border border-dark-700 rounded-lg px-4 py-3 text-white font-mono text-sm placeholder-dark-500 focus:outline-none focus:border-neon-600 transition-colors"
                      placeholder="// Escribe tu código aquí..."></textarea>
          </div>

          <!-- Error -->
          @if (error) {
            <div class="bg-red-900/30 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm">
              {{ error }}
            </div>
          }

          <!-- Actions -->
          <div class="flex items-center justify-between pt-4 border-t border-dark-700">
            <a routerLink="/dashboard" class="text-dark-400 hover:text-white transition-colors text-sm">
              ← Cancelar
            </a>
            <button type="submit" [disabled]="saving"
                    class="bg-neon-600 hover:bg-neon-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
              @if (saving) {
                <span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 align-middle"></span>
              }
              {{ isEditing ? 'Guardar cambios' : 'Crear snippet' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: ``
})
export class SnippetFormComponent implements OnInit {
  title = '';
  description = '';
  language = 'typescript';
  code = '';
  tagsInput = '';
  isEditing = false;
  editingId?: string;
  saving = false;
  error = '';
  languages = LANGUAGES;

  constructor(
    private snippetService: SnippetService,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/']);
      return;
    }
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing = true;
      this.editingId = id;
      try {
        const snippet = await this.snippetService.getById(id);
        this.title = snippet.title;
        this.description = snippet.description || '';
        this.language = snippet.language;
        this.code = snippet.code;
        this.tagsInput = snippet.tags.join(', ');
      } catch {
        this.router.navigate(['/dashboard']);
      }
    }
  }

  async save() {
    if (!this.title.trim() || !this.code.trim()) {
      this.error = 'Título y código son obligatorios';
      return;
    }
    this.saving = true;
    this.error = '';
    try {
      const dto = {
        title: this.title.trim(),
        description: this.description.trim() || undefined,
        code: this.code,
        language: this.language,
        tags: this.tagsInput.split(',').map(t => t.trim()).filter(t => t),
      };
      if (this.isEditing && this.editingId) {
        await this.snippetService.update(this.editingId, dto);
      } else {
        await this.snippetService.create(dto);
      }
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.error = err.message || 'Error al guardar';
    } finally {
      this.saving = false;
    }
  }
}
