import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthCallbackComponent } from './auth-callback.component';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

describe('AuthCallbackComponent', () => {
  let component: AuthCallbackComponent;
  let fixture: ComponentFixture<AuthCallbackComponent>;
  let authService: AuthService;
  let router: Router;

  function createMockRoute(queryParams: Record<string, string>) {
    return {
      queryParams: { subscribe: (fn: (p: Record<string, string>) => void) => fn(queryParams) },
    };
  }

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AuthCallbackComponent],
      providers: [
        AuthService,
        { provide: ActivatedRoute, useValue: createMockRoute({}) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthCallbackComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('shows loading state', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Iniciando sesión');
  });

  describe('with token in query params', () => {
    beforeEach(async () => {
      // Reset with token
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [AuthCallbackComponent],
        providers: [
          AuthService,
          { provide: ActivatedRoute, useValue: createMockRoute({ token: 'my_jwt_token' }) },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(AuthCallbackComponent);
      component = fixture.componentInstance;
      authService = TestBed.inject(AuthService);
      router = TestBed.inject(Router);
      vi.spyOn(router, 'navigate').mockImplementation(() => Promise.resolve(true));
      fixture.detectChanges();
    });

    it('stores the token', () => {
      expect(authService.getToken()).toBe('my_jwt_token');
    });

    it('navigates to dashboard', () => {
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });

  describe('with access_token in query params', () => {
    beforeEach(async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [AuthCallbackComponent],
        providers: [
          AuthService,
          { provide: ActivatedRoute, useValue: createMockRoute({ access_token: 'access_jwt' }) },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(AuthCallbackComponent);
      component = fixture.componentInstance;
      authService = TestBed.inject(AuthService);
      router = TestBed.inject(Router);
      vi.spyOn(router, 'navigate').mockImplementation(() => Promise.resolve(true));
      fixture.detectChanges();
    });

    it('stores the access_token', () => {
      expect(authService.getToken()).toBe('access_jwt');
    });

    it('navigates to dashboard', () => {
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });

  describe('without token', () => {
    beforeEach(async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [AuthCallbackComponent],
        providers: [
          AuthService,
          { provide: ActivatedRoute, useValue: createMockRoute({}) },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(AuthCallbackComponent);
      component = fixture.componentInstance;
      authService = TestBed.inject(AuthService);
      router = TestBed.inject(Router);
      vi.spyOn(router, 'navigate').mockImplementation(() => Promise.resolve(true));
      // Mock fetch para que handleAuthCallback no falle
      globalThis.fetch = async () => ({ ok: false, json: async () => ({}) }) as Response;
      fixture.detectChanges();
    });

    afterEach(() => {
      // @ts-ignore
      delete globalThis.fetch;
    });

    it('does not store any token', () => {
      expect(authService.getToken()).toBeNull();
    });

    it('navigates to home', () => {
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });
  });
});
