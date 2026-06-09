import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../services/auth.service';
import { SnippetService } from '../../services/snippet.service';
import { provideRouter } from '@angular/router';
import { Snippet } from '../../models/snippet';

const mockSnippets: Snippet[] = [
  { id: '1', user_id: 'user_1', title: 'Array Sort', description: 'Sort an array', code: 'arr.sort()', language: 'javascript', tags: ['array', 'sort'], created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: '2', user_id: 'user_1', title: 'Python List', description: 'List comprehension', code: '[x*2 for x in range(10)]', language: 'python', tags: ['list'], created_at: '2026-01-02T00:00:00Z', updated_at: '2026-01-02T00:00:00Z' },
  { id: '3', user_id: 'user_1', title: 'SQL Query', code: 'SELECT * FROM users', language: 'sql', tags: [], created_at: '2026-01-03T00:00:00Z', updated_at: '2026-01-03T00:00:00Z' },
];

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isLoggedIn: () => true } },
        { provide: SnippetService, useValue: { getAll: () => Promise.resolve(mockSnippets) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('displays the page title', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Mis Snippets');
  });

  it('shows loading state by default', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Cargando snippets');
  });

  it('renders snippets when loaded', () => {
    component.snippets = mockSnippets;
    component.filteredSnippets = [...mockSnippets];
    component.loading = false;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('3 snippets');
    expect(fixture.nativeElement.textContent).toContain('Array Sort');
    expect(fixture.nativeElement.textContent).toContain('Python List');
    expect(fixture.nativeElement.textContent).toContain('Nuevo snippet');
    expect(fixture.nativeElement.querySelector('[placeholder*="Buscar"]')).toBeTruthy();
  });

  it('shows empty state when no snippets', () => {
    component.snippets = [];
    component.filteredSnippets = [];
    component.loading = false;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No hay snippets todavía');
    expect(fixture.nativeElement.textContent).toContain('Crear primer snippet');
  });

  describe('filterSnippets', () => {
    beforeEach(() => {
      component.snippets = mockSnippets;
      component.filteredSnippets = [...mockSnippets];
    });

    it('filters by title', () => {
      component.filterSnippets({ target: { value: 'array' } } as unknown as Event);
      expect(component.filteredSnippets.length).toBe(1);
    });

    it('filters by language', () => {
      component.filterSnippets({ target: { value: 'python' } } as unknown as Event);
      expect(component.filteredSnippets.length).toBe(1);
    });

    it('returns all with empty search', () => {
      component.filterSnippets({ target: { value: '' } } as unknown as Event);
      expect(component.filteredSnippets.length).toBe(3);
    });

    it('returns empty when no match', () => {
      component.filterSnippets({ target: { value: 'zzz' } } as unknown as Event);
      expect(component.filteredSnippets.length).toBe(0);
    });

    it('is case insensitive', () => {
      component.filterSnippets({ target: { value: 'ARRAY' } } as unknown as Event);
      expect(component.filteredSnippets.length).toBe(1);
    });
  });
});
