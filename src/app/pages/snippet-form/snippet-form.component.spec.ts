import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SnippetFormComponent } from './snippet-form.component';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SnippetService } from '../../services/snippet.service';
import { Snippet } from '../../models/snippet';

function createToken(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fake`;
}

const mockSnippet: Snippet = {
  id: 'snp_1',
  user_id: 'user_1',
  title: 'Existing Snippet',
  description: 'An existing snippet to edit',
  code: 'console.log("edit me")',
  language: 'javascript',
  tags: ['edit', 'test'],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('SnippetFormComponent', () => {
  let component: SnippetFormComponent;
  let fixture: ComponentFixture<SnippetFormComponent>;
  let authService: AuthService;
  let snippetService: SnippetService;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [SnippetFormComponent],
      providers: [
        AuthService,
        SnippetService,
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SnippetFormComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    snippetService = TestBed.inject(SnippetService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('when NOT logged in', () => {
    beforeEach(() => {
      vi.spyOn(router, 'navigate').mockImplementation(() => Promise.resolve(true));
      fixture.detectChanges();
    });

    it('redirects to home', () => {
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  describe('create mode (no id param)', () => {
    beforeEach(() => {
      const token = createToken({
        sub: 'user_1',
        email: 'test@test.com',
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
      authService.setToken(token);
      vi.spyOn(router, 'navigate').mockImplementation(() => Promise.resolve(true));
      fixture.detectChanges();
    });

    it('displays create title', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Nuevo snippet');
    });

    it('is not in editing mode', () => {
      expect(component.isEditing).toBe(false);
    });

    it('has default language as typescript', () => {
      expect(component.language).toBe('typescript');
    });

    it('has empty fields', () => {
      expect(component.title).toBe('');
      expect(component.code).toBe('');
      expect(component.description).toBe('');
    });

    it('renders all language options', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(component.languages.length).toBeGreaterThan(20);
      expect(component.languages).toContain('python');
      expect(component.languages).toContain('javascript');
      expect(component.languages).toContain('sql');
    });

    it('submit button says Crear snippet', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Crear snippet');
    });
  });

  describe('edit mode (with id param)', () => {
    beforeEach(() => {
      // Re-setup with id parameter
      TestBed.resetTestingModule();
      return TestBed.configureTestingModule({
        imports: [SnippetFormComponent],
        providers: [
          AuthService,
          SnippetService,
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { paramMap: { get: (key: string) => (key === 'id' ? 'snp_1' : null) } } },
          },
        ],
      }).compileComponents().then(() => {
        fixture = TestBed.createComponent(SnippetFormComponent);
        component = fixture.componentInstance;
        authService = TestBed.inject(AuthService);
        snippetService = TestBed.inject(SnippetService);
        router = TestBed.inject(Router);

        const token = createToken({
          sub: 'user_1',
          email: 'test@test.com',
          exp: Math.floor(Date.now() / 1000) + 3600,
        });
        authService.setToken(token);
        vi.spyOn(snippetService, 'getById').mockResolvedValue(mockSnippet);
        vi.spyOn(router, 'navigate').mockImplementation(() => Promise.resolve(true));
      });
    });

    it('loads snippet data on init', async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      expect(component.isEditing).toBe(true);
      expect(component.editingId).toBe('snp_1');
      expect(component.title).toBe('Existing Snippet');
      expect(component.code).toBe('console.log("edit me")');
      expect(component.description).toBe('An existing snippet to edit');
      expect(component.tagsInput).toBe('edit, test');
      expect(component.language).toBe('javascript');
    });

    it('displays edit title', async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Editar snippet');
    });

    it('submit button says Guardar cambios', async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Guardar cambios');
    });

    it('redirects to dashboard if snippet not found', async () => {
      vi.spyOn(snippetService, 'getById').mockRejectedValue(new Error('Not found'));
      fixture.detectChanges();
      await fixture.whenStable();
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });

  describe('save method', () => {
    beforeEach(() => {
      const token = createToken({
        sub: 'user_1',
        email: 'test@test.com',
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
      authService.setToken(token);
      vi.spyOn(router, 'navigate').mockImplementation(() => Promise.resolve(true));
      fixture.detectChanges();
    });

    it('shows error when title is empty', async () => {
      component.title = '';
      component.code = 'some code';
      await component.save();
      expect(component.error).toContain('Título y código son obligatorios');
      expect(component.saving).toBe(false);
    });

    it('shows error when code is empty', async () => {
      component.title = 'Title';
      component.code = '';
      await component.save();
      expect(component.error).toContain('Título y código son obligatorios');
    });

    it('calls create service for new snippet', async () => {
      const createSpy = vi.spyOn(snippetService, 'create').mockResolvedValue({
        id: 'new_id',
        user_id: 'user_1',
        title: 'Test',
        code: 'code',
        language: 'python',
        tags: ['tag1'],
      } as Snippet);

      component.title = 'Test';
      component.code = 'code';
      component.language = 'python';
      component.tagsInput = 'tag1';

      await component.save();

      expect(createSpy).toHaveBeenCalledWith({
        title: 'Test',
        description: undefined,
        code: 'code',
        language: 'python',
        tags: ['tag1'],
      });
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('parses tags from comma-separated input', async () => {
      const createSpy = vi.spyOn(snippetService, 'create').mockResolvedValue({} as Snippet);

      component.title = 'Test';
      component.code = 'code';
      component.tagsInput = '  alpha, beta , gamma  ';

      await component.save();

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: ['alpha', 'beta', 'gamma'],
        }),
      );
    });

    it('handles empty tags input', async () => {
      const createSpy = vi.spyOn(snippetService, 'create').mockResolvedValue({} as Snippet);

      component.title = 'Test';
      component.code = 'code';
      component.tagsInput = '';

      await component.save();

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: [],
        }),
      );
    });

    it('calls update service for existing snippet', async () => {
      const updateSpy = vi.spyOn(snippetService, 'update').mockResolvedValue({} as Snippet);
      component.isEditing = true;
      component.editingId = 'snp_1';
      component.title = 'Updated Title';
      component.code = 'updated code';

      await component.save();

      expect(updateSpy).toHaveBeenCalledWith('snp_1', expect.objectContaining({
        title: 'Updated Title',
        code: 'updated code',
      }));
    });

    it('sets saving to false after error', async () => {
      vi.spyOn(snippetService, 'create').mockRejectedValue(new Error('Network error'));

      component.title = 'Test';
      component.code = 'code';
      await component.save();

      expect(component.saving).toBe(false);
      expect(component.error).toContain('Network error');
    });

    it('handles error without message', async () => {
      vi.spyOn(snippetService, 'create').mockRejectedValue('Unknown error');

      component.title = 'Test';
      component.code = 'code';
      await component.save();

      expect(component.error).toBe('Error al guardar');
    });
  });

  describe('cancel link', () => {
    beforeEach(() => {
      const token = createToken({
        sub: 'user_1',
        email: 'test@test.com',
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
      authService.setToken(token);
      fixture.detectChanges();
    });

    it('shows cancel link to dashboard', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Cancelar');
    });
  });
});
