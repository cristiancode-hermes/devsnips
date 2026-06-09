import { AuthService, NeonAuthUser } from './auth.service';

// Mock token utilities
function createToken(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fake_signature`;
}

const mockUserPayload = {
  sub: 'user_abc123',
  email: 'test@example.com',
  name: 'Test User',
  picture: 'https://example.com/avatar.png',
  exp: Math.floor(Date.now() / 1000) + 3600,
  iat: Math.floor(Date.now() / 1000),
};

const expiredPayload = {
  ...mockUserPayload,
  exp: Math.floor(Date.now() / 1000) - 3600,
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    service = new AuthService();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('getToken / setToken', () => {
    it('returns null when no token stored', () => {
      expect(service.getToken()).toBeNull();
    });

    it('stores and retrieves a token', () => {
      service.setToken('my_test_token');
      expect(service.getToken()).toBe('my_test_token');
    });

    it('stores token in localStorage under devsnips_token', () => {
      service.setToken('token123');
      expect(localStorage.getItem('devsnips_token')).toBe('token123');
    });
  });

  describe('isLoggedIn', () => {
    it('returns false when no token', () => {
      expect(service.isLoggedIn()).toBe(false);
    });

    it('returns true with a valid non-expired token', () => {
      service.setToken(createToken(mockUserPayload));
      expect(service.isLoggedIn()).toBe(true);
    });

    it('returns false with an expired token', () => {
      service.setToken(createToken(expiredPayload));
      expect(service.isLoggedIn()).toBe(false);
    });

    it('returns false with a malformed token', () => {
      service.setToken('not-a-valid-jwt');
      expect(service.isLoggedIn()).toBe(false);
    });

    it('returns false with empty string token', () => {
      service.setToken('');
      expect(service.isLoggedIn()).toBe(false);
    });

    it('returns false when token has no exp claim', () => {
      service.setToken(createToken({ sub: 'user_abc' }));
      expect(service.isLoggedIn()).toBe(false);
    });
  });

  describe('getUser', () => {
    it('returns null when no token', () => {
      expect(service.getUser()).toBeNull();
    });

    it('decodes user info from valid token', () => {
      service.setToken(createToken(mockUserPayload));
      const user = service.getUser();
      expect(user).not.toBeNull();
      expect(user!.sub).toBe('user_abc123');
      expect(user!.email).toBe('test@example.com');
      expect(user!.name).toBe('Test User');
      expect(user!.picture).toBe('https://example.com/avatar.png');
    });

    it('returns null with malformed token', () => {
      service.setToken('bad.token');
      expect(service.getUser()).toBeNull();
    });

    it('returns user even with expired token (getUser does not check exp)', () => {
      service.setToken(createToken(expiredPayload));
      const user = service.getUser();
      expect(user).not.toBeNull();
      expect(user!.sub).toBe('user_abc123');
    });
  });

  describe('logout', () => {
    it('removes token from localStorage', () => {
      service.setToken('some_token');
      service.logout();
      expect(service.getToken()).toBeNull();
      expect(localStorage.getItem('devsnips_token')).toBeNull();
    });
  });

  describe('loginWithGoogle', () => {
    const neonAuthUrl = 'https://ep-old-star-abhpdbpp.neonauth.eu-west-2.aws.neon.tech/neondb/auth';

    beforeEach(() => {
      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: { origin: 'https://devsnips.test', href: '' },
        writable: true,
      });
      // Mock fetch para el POST a sign-in/social
      globalThis.fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            url: 'https://accounts.google.com/o/oauth2/auth?client_id=test',
            redirect: true,
          }),
        } as Response;
      };
    });

    afterEach(() => {
      // @ts-ignore
      delete globalThis.fetch;
    });

    it('hace POST a /sign-in/social y redirige a Google', async () => {
      await service.loginWithGoogle();
      expect(window.location.href).toContain('accounts.google.com');
    });
  });

  describe('handleAuthCallback', () => {
    beforeEach(() => {
      globalThis.fetch = async (url: RequestInfo | URL) => {
        const urlStr = url.toString();
        if (urlStr.includes('/get-session')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              session: { token: 'session-token-123' },
              user: { id: 'user_abc', email: 'test@example.com', name: 'Test' },
            }),
          } as Response;
        }
        return { ok: false, status: 404, json: async () => ({}) } as Response;
      };
    });

    afterEach(() => {
      // @ts-ignore
      delete globalThis.fetch;
    });

    it('obtiene sesión y guarda el token', async () => {
      const result = await service.handleAuthCallback();
      expect(result).toBe(true);
      expect(service.getToken()).toBe('session-token-123');
    });
  });

  describe('NeonAuthUser interface', () => {
    it('allows partial user data', () => {
      const minimal: NeonAuthUser = { sub: 'minimal_user' };
      expect(minimal.sub).toBe('minimal_user');
      expect(minimal.email).toBeUndefined();
    });
  });
});
