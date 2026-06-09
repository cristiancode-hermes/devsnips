import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface NeonAuthUser {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
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

  /** Inicia el flujo OAuth con Google vía Better Auth */
  async login(): Promise<void> {
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
        // Si el servidor maneja el redirect automático
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
        // Token mínimo para identificar al usuario (el servidor validará)
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
