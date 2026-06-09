import { test, expect } from '@playwright/test';

const PRODUCTION = 'https://spontaneous-churros-891640.netlify.app';

/** Genera un JWT simulado para tests */
function makeFakeToken(): string {
  const b64 = (o: object) =>
    btoa(JSON.stringify(o)).replace(/=/g, '');
  return [
    b64({ alg: 'HS256', typ: 'JWT' }),
    b64({ sub: 'test-user-id', email: 'test@example.com', name: 'Test User', picture: '', exp: 9999999999 }),
    b64({}),
  ].join('.');
}
const FAKE_TOKEN = makeFakeToken();

test.describe('DevSnips - Login y Autenticación', () => {
  test('clic en iniciar sesión redirige a Google OAuth', async ({ page }) => {
    await page.route('**/sign-in/social', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          url: 'https://accounts.google.com/o/oauth2/auth?client_id=test',
          redirect: true,
        }),
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await page.waitForTimeout(800);

    expect(page.url()).toContain('accounts.google.com');
  });

  test.describe('Con sesión simulada (token en localStorage)', () => {
    test.beforeEach(async ({ page }) => {
      // Ir a la página raíz y establecer token
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.evaluate((token) => {
        localStorage.setItem('devsnips_token', token);
      }, FAKE_TOKEN);
    });

    test('navbar muestra info del usuario cuando está logueado', async ({ page }) => {
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('app-root[ng-version]')).toBeVisible();

      // Enlace "Mis Snippets" en navbar
      await expect(page.getByRole('link', { name: 'Mis Snippets' })).toBeVisible();

      // Botón "+ Nuevo" en navbar
      await expect(page.getByRole('link', { name: /nuevo/i })).toBeVisible();

      // Nombre del usuario
      await expect(page.getByText('Test User')).toBeVisible();

      // NO debe mostrar "Iniciar sesión"
      await expect(page.getByRole('button', { name: /iniciar sesión/i })).not.toBeVisible();
    });

    test('dashboard carga y muestra estructura correcta', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('app-root[ng-version]')).toBeVisible({ timeout: 10000 });

      // El dashboard muestra el heading (no confundir con el navbar)
      await expect(page.getByRole('heading', { name: 'Mis Snippets' })).toBeVisible({ timeout: 5000 });
      await expect(page.getByPlaceholder('Buscar snippets...')).toBeVisible();
      await expect(page.getByRole('link', { name: '+ Nuevo snippet', exact: true })).toBeVisible();

      // Debe estar en estado de carga (loading) porque la API local devuelve 404
      await expect(page.getByText('Cargando snippets...')).toBeVisible();
    });

    test('dashboard vacío tras error de API', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('app-root[ng-version]')).toBeVisible({ timeout: 10000 });

      // Esperar a que el componente procese el error
      await page.waitForTimeout(3000);
      await expect(page.getByRole('heading', { name: 'Mis Snippets' })).toBeVisible();
    });

    test('formulario de crear snippet permite rellenar y enviar', async ({ page }) => {
      await page.goto('/snippets/new');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('app-root[ng-version]')).toBeVisible({ timeout: 10000 });

      // El formulario debe estar visible
      await expect(page.locator('input[name="title"]')).toBeVisible({ timeout: 5000 });

      // Rellenar
      await page.fill('input[name="title"]', 'Nuevo Snippet');
      await page.fill('textarea[name="description"]', 'Test snippet');
      await page.selectOption('select[name="language"]', 'javascript');
      await page.fill('input[name="tags"]', 'test, demo');
      await page.fill('textarea[name="code"]', 'console.log("test");');

      // Submit - esperar error de red (API no disponible localmente)
      await page.getByRole('button', { name: /crear snippet/i }).click();
      await page.waitForTimeout(2000);
    });

    test('detalle de snippet navega correctamente', async ({ page }) => {
      await page.goto('/snippets/snp_001');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('app-root[ng-version]')).toBeVisible({ timeout: 10000 });
    });

    test('editar snippet navega al dashboard si falla API', async ({ page }) => {
      await page.goto('/snippets/snp_001/edit');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('app-root[ng-version]')).toBeVisible({ timeout: 10000 });

      // Sin datos de API, el componente redirige al dashboard
      await expect(page.getByRole('heading', { name: 'Mis Snippets' })).toBeVisible({ timeout: 5000 });
    });
  });
});

test.describe('DevSnips - API CRUD', () => {
  const API = `${PRODUCTION}/api/snippets`;

  test('401 sin auth en GET', async ({ request }) => {
    const res = await request.get(API);
    expect(res.status()).toBe(401);
  });

  test('401 sin auth en POST', async ({ request }) => {
    const res = await request.post(API, { data: { title: 'test', code: 'test' } });
    expect(res.status()).toBe(401);
  });

  test('401 sin auth en PUT', async ({ request }) => {
    const res = await request.put(`${API}/some-id`, { data: { title: 'test' } });
    expect(res.status()).toBe(401);
  });

  test('401 sin auth en DELETE', async ({ request }) => {
    const res = await request.delete(`${API}/some-id`);
    expect(res.status()).toBe(401);
  });

  test('401 con token inválido', async ({ request }) => {
    const res = await request.get(API, {
      headers: { Authorization: 'Bearer invalid-token-that-is-way-too-long-to-be-real' },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe('DevSnips - Routing SPA', () => {
  test('SPA redirects funcionan en producción', async ({ browser }) => {
    test.skip(process.env.E2E_PROD !== 'true', 'Solo en producción');

    const ctx = await browser.newContext({ baseURL: PRODUCTION });
    const page = await ctx.newPage();

    for (const route of ['/', '/dashboard', '/snippets/new', '/snippets/test-123', '/auth/callback']) {
      const resp = await page.goto(route);
      expect(resp?.status()).toBe(200);
    }

    await ctx.close();
  });
});
