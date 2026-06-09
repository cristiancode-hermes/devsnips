import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  template: `
    <div class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <div class="inline-block w-10 h-10 border-2 border-neon-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p class="text-dark-400">Iniciando sesión...</p>
      </div>
    </div>
  `,
  styles: ``
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private auth: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    // Primero intentar query params (token directo del OAuth)
    this.route.queryParams.subscribe(async params => {
      const token = params['token'] || params['access_token'];
      if (token) {
        this.auth.setToken(token);
        this.router.navigate(['/dashboard']);
        return;
      }
    });

    // Si no hay token en URL, intentar con sesión (cookies)
    const success = await this.auth.handleAuthCallback();
    if (success) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/']);
    }
  }
}
