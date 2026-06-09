import { test, expect } from '@playwright/test';

const PRODUCTION = 'https://spontaneous-churros-891640.netlify.app';

test.describe('DevSnips - Bootstrapping y Consola', () => {
  test('no debe haber errores en la consola', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('app-root')).not.toBeEmpty();
    expect(errors).toEqual([]);
  });

  test('el app bootstrappea con ng-version y contenido visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const appRoot = page.locator('app-root[ng-version]');
    await expect(appRoot).toBeVisible();

    await expect(page.getByText('DevSnips').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible();
    await expect(page.getByText('Guarda snippets')).toBeVisible();
    await expect(page.getByText('Encuentra rápido')).toBeVisible();
    await expect(page.getByText('Siempre disponible')).toBeVisible();
  });

  test('el bundle incluye polyfills (Zone.js presente)', async ({ page }) => {
    await page.goto('/');
    const html = await page.content();
    expect(html).toContain('ng-version');
    expect(html).toContain('polyfills');
    expect(html).toMatch(/main-\w+\.js/);
  });
});

test.describe('DevSnips - Navegación SPA', () => {
  test('rutas de la SPA devuelven HTML y bootstrappean', async ({ page, baseURL }) => {
    // Local: solo la raíz tiene SPA routing (Python server no hace rewrites)
    const routes = baseURL !== PRODUCTION ? ['/'] : ['/', '/dashboard', '/snippets/new', '/snippets/test-123', '/auth/callback'];

    for (const route of routes) {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expect(page.locator('app-root[ng-version]')).toBeVisible();
    }
  });

  test('dashboard sin sesión redirige a login', async ({ page, baseURL }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Sin token, debe mostrar botón de iniciar sesión
    // Local: puede mostrar 404, skip
    test.skip(baseURL !== PRODUCTION, 'Solo en producción (rewrite SPA)');
    await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible();
  });
});

test.describe('DevSnips - API (contra producción)', () => {
  test('GET /api/snippets devuelve 401 sin auth', async ({ request }) => {
    const res = await request.get(`${PRODUCTION}/api/snippets`);
    expect(res.status()).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });

  test('GET /api/snippets/:id devuelve 401 sin auth', async ({ request }) => {
    const res = await request.get(`${PRODUCTION}/api/snippets/some-id`);
    expect(res.status()).toBe(401);
  });

  test('POST /api/snippets devuelve 401 sin auth', async ({ request }) => {
    const res = await request.post(`${PRODUCTION}/api/snippets`, {
      data: { title: 'test', code: 'test' },
    });
    expect(res.status()).toBe(401);
  });

  test('PUT /api/snippets/:id devuelve 401 sin auth', async ({ request }) => {
    const res = await request.put(`${PRODUCTION}/api/snippets/some-id`, {
      data: { title: 'test' },
    });
    expect(res.status()).toBe(401);
  });

  test('DELETE /api/snippets/:id devuelve 401 sin auth', async ({ request }) => {
    const res = await request.delete(`${PRODUCTION}/api/snippets/some-id`);
    expect(res.status()).toBe(401);
  });
});

test.describe('DevSnips - Assets', () => {
  test('bundles JS cargan sin errores', async ({ page }) => {
    const failed: string[] = [];
    page.on('requestfailed', req => {
      failed.push(req.url());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const jsCssFails = failed.filter(u => u.includes('.js') || u.includes('.css'));
    expect(jsCssFails).toEqual([]);
  });
});
