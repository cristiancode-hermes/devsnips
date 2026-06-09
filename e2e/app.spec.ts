import { test, expect } from '@playwright/test';

test.describe('DevSnips - Página Principal', () => {
  test('el HTML contiene la estructura de Angular', async ({ page }) => {
    await page.goto('/');
    const html = await page.content();
    expect(html).toContain('<app-root>');
    expect(html).toContain('DevSnips');
    expect(html).toContain('main-D6VFBP46.js');
  });
});

test.describe('DevSnips - API', () => {
  test('API devuelve 401 sin autenticación', async ({ request }) => {
    const response = await request.get('/api/snippets');
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  test('API devuelve 401 para snippet individual', async ({ request }) => {
    const response = await request.get('/api/snippets/some-id');
    expect(response.status()).toBe(401);
  });
});

test.describe('DevSnips - Rutas SPA', () => {
  test('SPA funciona para todas las rutas', async ({ page }) => {
    const routes = ['/', '/dashboard', '/snippets/new', '/snippets/test-123', '/auth/callback'];
    for (const route of routes) {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
    }
  });
});
