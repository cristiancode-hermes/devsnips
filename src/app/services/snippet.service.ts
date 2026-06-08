import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Snippet, CreateSnippetDto, UpdateSnippetDto } from '../models/snippet';

@Injectable({ providedIn: 'root' })
export class SnippetService {
  private baseUrl = environment.apiUrl + '/snippets';

  async getAll(): Promise<Snippet[]> {
    const res = await fetch(this.baseUrl, { headers: this.headers() });
    if (!res.ok) throw new Error('Failed to fetch snippets');
    return res.json();
  }

  async getById(id: string): Promise<Snippet> {
    const res = await fetch(`${this.baseUrl}/${id}`, { headers: this.headers() });
    if (!res.ok) throw new Error('Snippet not found');
    return res.json();
  }

  async create(dto: CreateSnippetDto): Promise<Snippet> {
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { ...this.headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error('Failed to create snippet');
    return res.json();
  }

  async update(id: string, dto: UpdateSnippetDto): Promise<Snippet> {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { ...this.headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error('Failed to update snippet');
    return res.json();
  }

  async delete(id: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: this.headers(),
    });
    if (!res.ok) throw new Error('Failed to delete snippet');
  }

  private headers(): Record<string, string> {
    const token = localStorage.getItem('devsnips_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}
