import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SnippetDetailComponent } from './snippet-detail.component';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SnippetService } from '../../services/snippet.service';
import { provideRouter } from '@angular/router';
import { Snippet } from '../../models/snippet';

const mockSnippet: Snippet = {
  id: 'snp_1',
  user_id: 'user_1',
  title: 'My Snippet',
  description: 'A cool snippet',
  code: 'const x = 42;',
  language: 'javascript',
  tags: ['demo'],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('SnippetDetailComponent', () => {
  let component: SnippetDetailComponent;
  let fixture: ComponentFixture<SnippetDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnippetDetailComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isLoggedIn: () => true } },
        { provide: SnippetService, useValue: { getById: () => Promise.resolve(mockSnippet), delete: () => Promise.resolve() } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: (key: string) => key === 'id' ? 'snp_1' : null } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SnippetDetailComponent);
    component = fixture.componentInstance;
  });

  it('starts in loading state', () => {
    expect(component.loading).toBe(true);
  });

  it('renders snippet when loaded', () => {
    component.snippet = mockSnippet;
    component.loading = false;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('My Snippet');
    expect(fixture.nativeElement.textContent).toContain('javascript');
    expect(fixture.nativeElement.textContent).toContain('A cool snippet');
    expect(fixture.nativeElement.textContent).toContain('demo');
    expect(fixture.nativeElement.textContent).toContain('const x = 42;');
    expect(fixture.nativeElement.textContent).toContain('Editar');
    expect(fixture.nativeElement.textContent).toContain('Eliminar');
    expect(fixture.nativeElement.textContent).toContain('Copiar');
    expect(fixture.nativeElement.textContent).toContain('Volver a mis snippets');
  });

  it('copies code to clipboard', async () => {
    component.snippet = mockSnippet;
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    await component.copyCode();
    expect(writeText).toHaveBeenCalledWith('const x = 42;');
  });

  it('deleteSnippet does nothing when confirm is cancelled', () => {
    component.snippet = mockSnippet;
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const snippetService = TestBed.inject(SnippetService);
    const deleteSpy = vi.spyOn(snippetService, 'delete');
    component.deleteSnippet();
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('calls delete service on confirm', async () => {
    component.snippet = mockSnippet;
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const snippetService = TestBed.inject(SnippetService);
    vi.spyOn(snippetService, 'delete').mockResolvedValue(undefined);
    await component.deleteSnippet();
    expect(snippetService.delete).toHaveBeenCalledWith('snp_1');
  });
});
