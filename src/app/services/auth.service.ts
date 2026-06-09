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

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    window.location.href = '/';
  }

  /** Obtiene el usuario desde JWT o desde cache local */
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

    // 2. Fallback: desde cache local (para session tokens de 32 chars)
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

  /** Guarda user data en cache local */
  private saveUser(user: { id?: string; sub?: string; email?: string; name?: string; image?: string; picture?: string }): void {
    if (!user) return;
    localStorage.setItem(this.userKey, JSON.stringify({
      sub: user.id || user.sub || '',
      email: user.email,
      name: user.name,
      picture: user.image || user.picture,
    }));
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

    // Para session tokens Better Auth (32 chars sin puntos): confiar
    if (token.length >= 20 && token.length <= 64) {
      return true;
    }

    return false;
  }

  /** Refresca la sesión desde el servidor vía cookie */
  async refreshSession(): Promise<boolean> {
    try {
      const resp = await fetch(`${this.neonAuthUrl}/get-session`, {
        credentials: 'include',
      });
      if (!resp.ok) return false;

      const data = await resp.json();
      if (data?.session?.token) {
        this.setToken(data.session.token);
      }
      if (data?.user) {
        this.saveUser(data.user);
      }
      return true;
    } catch {
      return false;
    }
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
      // Guardar data directa de la respuesta
      const data = await resp.json().catch(() => ({}));
      if (data?.token) this.setToken(data.token);
      if (data?.user) this.saveUser(data.user);

      // Refrescar sesión desde cookie
      await this.refreshSession().catch(() => {});

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

      // Guardar data directa de la respuesta (session token + user)
      const data = await resp.json().catch(() => ({}));
      if (data?.token) this.setToken(data.token);
      if (data?.user) this.saveUser(data.user);

      // Luego, si la cookie se estableció, obtener sesión completa
      await this.refreshSession().catch(() => {});

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

      if (data?.session?.token) {
        this.setToken(data.session.token);
      }
      if (data?.user) {
        this.saveUser(data.user);
        return true; // tenemos user data
      }

      return !!(data?.session?.token);
    } catch (err) {
      console.error('Auth callback error:', err);
      return false;
    }
  }
}
