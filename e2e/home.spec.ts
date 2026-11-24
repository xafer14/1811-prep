import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const ROUTES = ['/'];

for (const route of ROUTES) {
  test.describe(`route ${route}`, () => {
    test('has no axe violations (WCAG 2.2 AA)', async ({ page }) => {
      await page.goto(route);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(results.violations).toEqual([]);
    });

    test('shows a heading and the non-affiliation disclaimer', async ({ page }) => {
      await page.goto(route);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByText(/not affiliated with/i)).toBeVisible();
    });

    test('sends no requests to other origins (ADR 0004)', async ({ page, baseURL }) => {
      const foreign: string[] = [];
      page.on('request', (request) => {
        const url = new URL(request.url());
        if (!['data:', 'blob:', 'about:'].includes(url.protocol) && url.origin !== baseURL) {
          foreign.push(request.url());
        }
      });
      await page.goto(route, { waitUntil: 'networkidle' });
      expect(foreign).toEqual([]);
    });

    test('ships a CSP and has no console errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await page.goto(route);
      const csp = page.locator('meta[http-equiv="content-security-policy" i]');
      await expect(csp).toHaveCount(1);
      expect(errors).toEqual([]);
    });
  });
}
