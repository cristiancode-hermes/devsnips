import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface NeonAuthUser {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'devsnips_token';
  private readonly userKey = 'devsnips_user';
  private readonly neonAuthUrl = environment.neonAuthUrl;

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  /** Genera un JWT simulado (formato header.payload.sig) desde datos de usuario */
  private makeCompatJWT(user: { id?: string; email?: string; name?: string; image?: string }): string {
    const b64url = (s: string) => btoa(s).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = b64url(JSON.stringify({
      sub: user.id || '',
      email: user.email || '',
      name: user.name || '',
      picture: user.image || '',
      exp: Math.floor(Date.now() / 1000) + 86400, // 24h
      iat: Math.floor(Date.now() / 1000),
    }));
    const signature = b64url('compat-sig');
    return `${header}.${payload}.${signature}`;
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    window.location.href = '/';
  }

  getUser(): NeonAuthUser | null {
    // 1. Intentar desde JWT (tokens con dots)
    const token = this.getToken();
    if (token && token.includes('.')) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
          sub: payload.sub,
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
        };
      } catch {
        // fallthrough
      }
    }

    // 2. Fallback: desde cache local (session tokens de 32 chars)
    const cached = localStorage.getItem(this.userKey);
    if (cached) {
      try {
        return JSON.parse(cached) as NeonAuthUser;
      } catch {
        // ignore
      }
    }

    return null;
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // Si es JWT (tiene puntos), verificar exp
    if (token.includes('.')) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp > Math.floor(Date.now() / 1000);
      } catch {
        return false;
      }
    }

    // Session tokens Better Auth (32 chars sin puntos)
    if (token.length >= 20 && token.length <= 64) {
      return true;
    }

    return false;
  }

  /** Registro con email y contraseña */
  async register(name: string, email: string, password: string): Promise<AuthResult> {
    try {
      const resp = await fetch(`${this.neonAuthUrl}/sign-up/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
        credentials: 'include',
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        return { success: false, error: err.message || err.error || 'Error al registrarse' };
      }
      // Guardar datos de la respuesta y generar JWT compatible
      const data = await resp.json().catch(() => ({}));
      if (data?.user) {
        const jwt = this.makeCompatJWT(data.user);
        this.setToken(jwt);
      } else if (data?.token) {
        this.setToken(data.token);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Error de conexión' };
    }
  }

  /** Inicio de sesión con email y contraseña */
  async loginWithEmail(email: string, password: string): Promise<AuthResult> {
    try {
      const resp = await fetch(`${this.neonAuthUrl}/sign-in/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        return { success: false, error: err.message || err.error || 'Credenciales inválidas' };
      }

      // Guardar datos y generar JWT compatible con la API serverless
      const data = await resp.json().catch(() => ({}));
      if (data?.user) {
        const jwt = this.makeCompatJWT(data.user);
        this.setToken(jwt);
      } else if (data?.token) {
        // Fallback: session token directo
        this.setToken(data.token);
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: 'Error de conexión' };
    }
  }

  /** Inicia el flujo OAuth con Google vía Better Auth */
  async loginWithGoogle(): Promise<void> {
    try {
      const resp = await fetch(`${this.neonAuthUrl}/sign-in/social`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'google',
          callbackURL: `${window.location.origin}/auth/callback`,
        }),
      });
      const data = await resp.json();
      if (data?.url) {
        window.location.href = data.url;
      } else if (data?.redirect) {
        window.location.href = this.neonAuthUrl + '/sign-in/social?' + new URLSearchParams({
          provider: 'google',
          callbackURL: window.location.origin + '/auth/callback',
        });
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  }

  /** Procesa el callback OAuth / sesión usando fetch con cookies */
  async handleAuthCallback(): Promise<boolean> {
    try {
      const resp = await fetch(`${this.neonAuthUrl}/get-session`, {
        credentials: 'include',
      });
      if (!resp.ok) return false;

      const data = await resp.json();
      if (data?.user) {
        const jwt = this.makeCompatJWT(data.user);
        this.setToken(jwt);
        return true;
      }
      if (data?.session?.token) {
        this.setToken(data.session.token);
        return true;
      }

      return false;
    } catch (err) {
      console.error('Auth callback error:', err);
      return false;
    }
  }
}
