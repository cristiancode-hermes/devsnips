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
  private readonly neonAuthUrl = environment.neonAuthUrl;

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    window.location.href = '/';
  }

  getUser(): NeonAuthUser | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      };
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Math.floor(Date.now() / 1000);
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
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        return { success: false, error: err.message || err.error || 'Error al registrarse' };
      }
      const data = await resp.json();
      // Algunas configuraciones devuelven token directo
      if (data?.token) {
        this.setToken(data.token);
        return { success: true };
      }
      // Si no hay token directo, intentar obtener sesión
      if (data?.session?.token) {
        this.setToken(data.session.token);
        return { success: true };
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
      const data = await resp.json();
      if (data?.token) {
        this.setToken(data.token);
        return { success: true };
      }
      if (data?.session?.token) {
        this.setToken(data.session.token);
        return { success: true };
      }
      // Sin token directo, obtenerlo via get-session
      const session = await this.handleAuthCallback();
      return { success: session };
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

  /** Procesa el callback OAuth usando fetch con cookies de sesión */
  async handleAuthCallback(): Promise<boolean> {
    try {
      // Better Auth establece cookie de sesión durante el OAuth
      const resp = await fetch(`${this.neonAuthUrl}/get-session`, {
        credentials: 'include',
      });
      if (!resp.ok) return false;

      const data = await resp.json();
      if (data?.session?.token) {
        this.setToken(data.session.token);
        return true;
      }

      // Si no hay token en la sesión, intentar obtener JWT
      const jwtResp = await fetch(`${this.neonAuthUrl}/token/jwt`, {
        credentials: 'include',
      });
      if (jwtResp.ok) {
        const jwtData = await jwtResp.json();
        if (jwtData?.token) {
          this.setToken(jwtData.token);
          return true;
        }
      }

      // Último recurso: construir token desde user data
      if (data?.user) {
        const user = data.user;
        const minimalToken = btoa(JSON.stringify({
          sub: user.id,
          email: user.email,
          name: user.name,
          picture: user.image,
          exp: Math.floor(Date.now() / 1000) + 3600,
        }));
        this.setToken(minimalToken);
        return true;
      }

      return false;
    } catch (err) {
      console.error('Auth callback error:', err);
      return false;
    }
  }
}
