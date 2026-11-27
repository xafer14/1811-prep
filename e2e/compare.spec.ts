import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

const ROUTE = '/compare/';
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const table = (page: Page): Locator => page.getByRole('table');

function row(page: Page, label: string): Locator {
  return table(page)
    .getByRole('row')
    .filter({ has: page.getByRole('rowheader', { name: label, exact: true }) });
}

async function setAge(page: Page, age: string): Promise<void> {
  await page.getByRole('textbox', { name: 'Age', exact: true }).fill(age);
}

async function expectNoViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(results.violations).toEqual([]);
}

test.describe('compare page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTE);
    await expect(table(page)).toBeVisible();
  });

  test('groups military branches and federal agencies side by side', async ({ page }) => {
    const headers = table(page).getByRole('columnheader');
    await expect(headers.filter({ hasText: 'Military branches' })).toHaveAttribute('colspan', '5');
    await expect(headers.filter({ hasText: 'Federal agencies' })).toHaveAttribute('colspan', '6');
    for (const name of [
      'Air Force',
      'Marine Corps',
      'Space Force',
      'Army',
      'Navy',
      'ATF',
      'DEA',
      'FBI',
      'HSI',
      'US Marshals',
      'Secret Service',
    ]) {
      await expect(headers.filter({ hasText: name }).first()).toBeVisible();
    }
    await expect(page.getByText('Not shown yet, because the official numbers')).toBeVisible();
    await expect(page.getByText('Military branches: Coast Guard')).toBeVisible();
    // Organizations shown only in part say what is still missing.
    await expect(page.getByText('Shown only in part')).toBeVisible();
    await expect(page.getByText(/myFitness calculator, not in the manual/).first()).toBeVisible();
    await expect(page.getByText(/MCO 6110.3A/).first()).toBeVisible();
    // Every federal agency now has verified numbers, so no federal list is shown.
    await expect(page.getByText('Federal agencies:')).toHaveCount(0);
  });

  test('shows the minimums for age 25 and male minimums by default', async ({ page }) => {
    await expect(page.getByText('Showing the male minimums for age 25.')).toBeVisible();
    await expect(row(page, '1.5-mile run')).toContainText('12:18 or faster'); // ATF, USMS
    await expect(row(page, '1.5-mile run')).toContainText('14:00 or faster'); // Navy
    await expect(row(page, '1.5-mile run')).toContainText('14:25 or faster'); // HSI
    await expect(row(page, 'Push-ups')).toContainText('at least 14 reps'); // Army
    await expect(row(page, 'Push-ups')).toContainText('at least 33 reps'); // ATF, USMS
    await expect(row(page, 'Two-mile run')).toContainText('19:45 or faster');
    await expect(row(page, 'Body composition')).toContainText('Waist-to-height ratio below 0.55');
    await expect(row(page, 'Also applies')).toContainText(
      '300 points in total (350 for Combat MOS)',
    );
    // Marine Corps (order), Air Force (chart) and Space Force (manual).
    await expect(row(page, 'Three-mile run')).toContainText('27:40 or faster');
    await expect(row(page, 'Two-mile run')).toContainText('19:55 or faster'); // Air Force, 25-29
    await expect(row(page, '2-kilometer walk (medical alternative)')).toContainText(
      '16:16 or faster',
    );
    await expect(row(page, 'Body composition')).toContainText('ratio rounded down to 2 decimals');
    await expect(row(page, 'Body composition')).toContainText('Waist-to-height ratio 0.52 or less'); // Marine Corps
    await expect(row(page, 'Body composition')).toContainText('Waist-to-height ratio 0.55 or less'); // Air Force
    await expect(row(page, 'Also applies')).toContainText('composite score of at least 75');
    await expect(row(page, 'Also applies')).toContainText('at least 150 points in total');
    await expect(row(page, 'Also applies')).toContainText('at least 210 points in total'); // combat arms
    // Tests scored in points show the level worth one point and the total rule.
    await expect(row(page, 'Pull-ups')).toContainText('at least 2 reps'); // FBI, men
    await expect(row(page, 'Pull-ups')).toContainText('Worth 1 point');
    await expect(row(page, 'Sit-ups')).toContainText('at least 38 reps'); // DEA
    await expect(row(page, 'Agility run')).toContainText('0:23.88 or faster'); // Secret Service
    await expect(row(page, 'Also applies')).toContainText('Needs 10 points in total');
    await expect(row(page, 'Also applies')).toContainText(
      'Needs 12 points in total (1.5-mile run points count twice)',
    );
    await expect(row(page, 'Also applies')).toContainText('Needs 20 points in total');
  });

  test('updates when the age, the minimums or the Army combat option change', async ({ page }) => {
    await setAge(page, '35');
    await expect(page.getByText('Showing the male minimums for age 35.')).toBeVisible();
    await expect(row(page, '1.5-mile run')).toContainText('15:00 or faster'); // Navy 35-39
    await expect(row(page, '1.5-mile run')).toContainText('12:51 or faster'); // ATF 30-39

    await setAge(page, '25');
    await page.getByRole('radio', { name: 'Female minimums' }).check();
    await expect(page.getByText('Showing the female minimums for age 25.')).toBeVisible();
    await expect(row(page, '1.5-mile run')).toContainText('14:55 or faster'); // ATF, USMS
    await expect(row(page, 'Push-ups')).toContainText('at least 11 reps'); // Army

    await page.getByRole('checkbox', { name: /combat MOS/ }).check();
    await expect(page.getByText(/with the Army combat MOS standard/)).toBeVisible();
    await expect(row(page, 'Push-ups')).toContainText('at least 14 reps'); // Army, male column
    await expect(row(page, 'Push-ups')).toContainText('at least 16 reps'); // ATF stays female
  });

  test('says so when an age is outside a published band', async ({ page }) => {
    await setAge(page, '19');
    await expect(row(page, '1.5-mile run')).toContainText('No published minimum for this age');
    await expect(row(page, '1.5-mile run')).toContainText('12:45 or faster'); // Navy 17-19
  });

  test('keeps the last valid age and explains an invalid one', async ({ page }) => {
    const age = page.getByRole('textbox', { name: 'Age', exact: true });
    await age.fill('abc');
    await age.blur();
    await expect(page.getByText(/Enter your age in whole years/)).toBeVisible();
    await expect(age).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText('Showing the male minimums for age 25.')).toBeVisible();

    await age.fill('16');
    await expect(page.getByText('This tool is for people 17 and older.')).toBeVisible();

    await age.fill('40');
    await expect(age).not.toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText('Showing the male minimums for age 40.')).toBeVisible();
  });

  test('links every number to its official source', async ({ page }) => {
    const sources = page
      .getByRole('region', { name: 'Sources' })
      .or(page.locator('#sources-title'));
    await expect(sources.first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Official source/ }).first()).toHaveAttribute(
      'href',
      /^https:\/\//,
    );
    await expect(
      page.getByText(/Checked against the official document on 2026-11-24/).first(),
    ).toBeVisible();
  });

  test('keeps the choice on the page: no storage, no cookies, no address data, no other requests', async ({
    page,
    context,
    baseURL,
  }) => {
    const requests: { method: string; url: string }[] = [];
    page.on('request', (request) =>
      requests.push({ method: request.method(), url: request.url() }),
    );

    await setAge(page, '33');
    await page.getByRole('radio', { name: 'Female minimums' }).check();
    await expect(page.getByText('Showing the female minimums for age 33.')).toBeVisible();

    const storage = await page.evaluate(() => ({
      local: window.localStorage.length,
      session: window.sessionStorage.length,
    }));
    expect(storage).toEqual({ local: 0, session: 0 });
    expect(await context.cookies()).toEqual([]);
    const address = new URL(page.url());
    expect(address.search).toBe('');
    expect(address.hash).toBe('');
    for (const request of requests) {
      expect(request.method, request.url).toBe('GET');
      expect(new URL(request.url).origin, request.url).toBe(baseURL);
    }
  });

  test('has no accessibility violations, also after changes', async ({ page }) => {
    await expectNoViolations(page);
    await setAge(page, '19');
    await page.getByRole('radio', { name: 'Female minimums' }).check();
    await page.getByRole('checkbox', { name: /combat MOS/ }).check();
    await expectNoViolations(page);
  });
});

test.describe('compare page in dark mode', () => {
  test.use({ colorScheme: 'dark' });

  test('has no accessibility violations', async ({ page }) => {
    await page.goto(ROUTE);
    await expect(table(page)).toBeVisible();
    await expectNoViolations(page);
  });
});
