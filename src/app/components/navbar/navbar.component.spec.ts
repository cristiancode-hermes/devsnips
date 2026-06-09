import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from './navbar.component';
import { AuthService } from '../../services/auth.service';
import { provideRouter } from '@angular/router';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: () => false,
            getUser: () => null,
            loginWithGoogle: () => {},
            loginWithEmail: () => Promise.resolve({ success: false, error: '' }),
            register: () => Promise.resolve({ success: false, error: '' }),
            handleAuthCallback: () => Promise.resolve(false),
            refreshSession: () => Promise.resolve(false),
            logout: () => {},
            getToken: () => null,
            setToken: () => {},
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('renders the DevSnips logo', () => {
    expect(fixture.nativeElement.textContent).toContain('DevSnips');
  });

  describe('when NOT logged in', () => {
    it('does NOT show dashboard link', () => {
      expect(fixture.nativeElement.textContent).not.toContain('Mis Snippets');
    });

    it('does NOT show logout button', () => {
      expect(fixture.nativeElement.textContent).not.toContain('Salir');
    });
  });

  describe('when logged in', () => {
    beforeEach(async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [NavbarComponent],
        providers: [
          provideRouter([]),
          {
            provide: AuthService,
            useValue: {
              isLoggedIn: () => true,
              getUser: () => ({
                sub: 'user_1',
                email: 'dev@test.com',
                name: 'Dev User',
                picture: 'https://example.com/avatar.png',
              }),
              loginWithGoogle: () => {},
              loginWithEmail: () => Promise.resolve({ success: false, error: '' }),
              register: () => Promise.resolve({ success: false, error: '' }),
              handleAuthCallback: () => Promise.resolve(false),
              refreshSession: () => Promise.resolve(false),
              logout: () => {},
              getToken: () => 'mock_token',
              setToken: () => {},
            },
          },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(NavbarComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('shows dashboard link', () => {
      expect(fixture.nativeElement.textContent).toContain('Mis Snippets');
    });

    it('shows new snippet button', () => {
      expect(fixture.nativeElement.textContent).toContain('Nuevo');
    });

    it('shows user name and logout button', () => {
      expect(fixture.nativeElement.textContent).toContain('Dev User');
      expect(fixture.nativeElement.textContent).toContain('Salir');
    });

    it('renders user avatar image', () => {
      const img = fixture.nativeElement.querySelector('img');
      expect(img).toBeTruthy();
      expect(img!.getAttribute('src')).toBe('https://example.com/avatar.png');
    });
  });

  describe('when logged in without picture', () => {
    beforeEach(async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [NavbarComponent],
        providers: [
          provideRouter([]),
          {
            provide: AuthService,
            useValue: {
              isLoggedIn: () => true,
              getUser: () => ({
                sub: 'user_2',
                email: 'minimal@test.com',
              }),
              loginWithGoogle: () => {},
              loginWithEmail: () => Promise.resolve({ success: false, error: '' }),
              register: () => Promise.resolve({ success: false, error: '' }),
              handleAuthCallback: () => Promise.resolve(false),
              refreshSession: () => Promise.resolve(false),
              logout: () => {},
              getToken: () => 'mock_token',
              setToken: () => {},
            },
          },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(NavbarComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('shows email when name is absent', () => {
      expect(fixture.nativeElement.textContent).toContain('minimal@test.com');
    });

    it('does not render img if no picture', () => {
      const img = fixture.nativeElement.querySelector('img');
      expect(img).toBeFalsy();
    });
  });
});
