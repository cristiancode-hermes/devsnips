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
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch {
      return false;
    }
  }

  /** Redirect a Neon Auth login */
  login(): void {
    const redirectUri = `${window.location.origin}/auth/callback`;
    const authUrl = `${environment.neonAuthUrl}/login?redirect_to=${encodeURIComponent(redirectUri)}`;
    window.location.href = authUrl;
  }
}
