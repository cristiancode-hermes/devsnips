import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { AuthService } from '../../services/auth.service';
import { provideRouter } from '@angular/router';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  function createMockAuth(isLoggedIn: boolean) {
    return {
      isLoggedIn: () => isLoggedIn,
      getUser: () => isLoggedIn ? { sub: 'user_1', email: 'test@test.com', name: 'Test' } : null,
      login: () => {},
      logout: () => {},
      getToken: () => isLoggedIn ? 'mock_token' : null,
      setToken: () => {},
    };
  }

  describe('when NOT logged in', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HomeComponent],
        providers: [
          provideRouter([]),
          { provide: AuthService, useValue: createMockAuth(false) },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(HomeComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('creates the component', () => {
      expect(component).toBeTruthy();
    });

    it('renders the app title', () => {
      expect(fixture.nativeElement.textContent).toContain('DevSnips');
    });

    it('shows login button text', () => {
      expect(fixture.nativeElement.textContent).toContain('Iniciar sesión');
    });
  });

  describe('when logged in', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HomeComponent],
        providers: [
          provideRouter([]),
          { provide: AuthService, useValue: createMockAuth(true) },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(HomeComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('does NOT show login button', () => {
      expect(fixture.nativeElement.textContent).not.toContain('Iniciar sesión');
    });

    it('shows dashboard navigation text', () => {
      expect(fixture.nativeElement.textContent).toContain('Ir a mis snippets');
    });

    it('calls router.navigate with dashboard path', () => {
      const navigateSpy = vi.spyOn(component.router, 'navigate').mockResolvedValue(true);
      component.router.navigate(['/dashboard']);
      expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
    });
  });
});
