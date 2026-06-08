import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SlicePipe } from '@angular/common';
import { Snippet } from '../../models/snippet';

@Component({
  selector: 'app-snippet-card',
  standalone: true,
  imports: [RouterLink, SlicePipe],
  template: `
    <div class="bg-dark-900 border border-dark-700 rounded-xl p-5 hover:border-neon-700 transition-all group">
      <div class="flex items-start justify-between mb-3">
        <h3 class="font-semibold text-lg text-white group-hover:text-neon-400 transition-colors">
          {{ snippet.title }}
        </h3>
        <span class="text-xs font-mono bg-dark-800 text-dark-300 px-2 py-1 rounded">
          {{ snippet.language }}
        </span>
      </div>

      @if (snippet.description) {
        <p class="text-dark-400 text-sm mb-3 line-clamp-2">{{ snippet.description }}</p>
      }

      <pre class="bg-dark-950 rounded-lg p-3 overflow-x-auto text-xs mb-3 max-h-24"><code>{{ snippet.code | slice:0:200 }}</code></pre>

      <div class="flex items-center justify-between">
        <div class="flex gap-1 flex-wrap">
          @for (tag of snippet.tags; track tag) {
            <span class="text-xs bg-dark-800 text-dark-400 px-2 py-0.5 rounded-full">{{ tag }}</span>
          }
        </div>
        <a [routerLink]="['/snippets', snippet.id]"
           class="text-neon-500 hover:text-neon-400 text-sm font-medium">
          Ver más →
        </a>
      </div>
    </div>
  `,
  styles: ``
})
export class SnippetCardComponent {
  @Input() snippet!: Snippet;
}
