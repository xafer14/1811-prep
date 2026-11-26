import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const ROUTE = '/readiness/';
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function choose(page: Page, organization: RegExp): Promise<void> {
  await page.getByRole('radio', { name: organization }).check();
}

async function fillAbout(page: Page, age: string, minimums: 'Male' | 'Female'): Promise<void> {
  await page.getByRole('textbox', { name: 'Age', exact: true }).fill(age);
  await page.getByRole('radio', { name: `${minimums} minimums`, exact: true }).check();
}

async function compare(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Compare with the official minimums/ }).click();
}

async function expectNoViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(results.violations).toEqual([]);
}

test.describe('readiness tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTE);
    await expect(page.getByRole('button', { name: /Compare with/ })).toBeVisible();
  });

  test('lists military branches and federal agencies in separate groups', async ({ page }) => {
    const military = page.getByRole('group', { name: 'Military branches' });
    const federal = page.getByRole('group', { name: 'Federal agencies' });
    await expect(military.getByRole('radio', { name: /U\.S\. Army/ })).toBeVisible();
    await expect(military.getByRole('radio', { name: /U\.S\. Navy/ })).toBeVisible();
    await expect(federal.getByRole('radio', { name: /Bureau of Alcohol/ })).toBeVisible();
    await expect(federal.getByRole('radio', { name: /U\.S\. Marshals/ })).toBeVisible();
    await expect(federal.getByRole('radio', { name: /Homeland Security/ })).toBeVisible();
    await expect(
      federal.getByRole('radio', { name: /Federal Bureau of Investigation/ }),
    ).toBeVisible();
    await expect(federal.getByRole('radio', { name: /Drug Enforcement/ })).toBeVisible();
    await expect(federal.getByRole('radio', { name: /Secret Service/ })).toBeVisible();
    // Choosing from either group still selects exactly one organization.
    await federal.getByRole('radio', { name: /U\.S\. Marshals/ }).check();
    await expect(military.getByRole('radio', { name: /U\.S\. Army/ })).not.toBeChecked();
    await expect(page.getByText('Military branches:')).toBeVisible();
    await expect(page.getByText('Federal agencies:')).toHaveCount(0);
  });

  test('compares ATF results event by event with a plain count', async ({ page }) => {
    await choose(page, /Bureau of Alcohol/);
    await fillAbout(page, '25', 'Male');
    await page.getByLabel('Sit-ups (1 min)').fill('45');
    await page.getByLabel('Push-ups (1 min)').fill('30');
    await page.getByLabel('1.5-mile run').fill('12:00');
    await compare(page);

    const heading = page.getByRole('heading', { name: /Results for/ });
    await expect(heading).toBeFocused();
    await expect(
      page.locator('.results').getByText('2 of 3 entered events meet the minimum.'),
    ).toBeVisible();
    await expect(page.locator('.results').getByText('3 reps short of the minimum.')).toBeVisible();
    await expect(
      page.locator('.results').getByText('18 seconds ahead of the minimum.'),
    ).toBeVisible();
    await expect(page.locator('.results').getByText(/Last Updated: October 1, 2026/)).toBeVisible();
    // The results never give an overall verdict.
    await expect(page.locator('.results').getByText(/\b(pass(ed)?|ready)\b/i)).toHaveCount(0);
  });

  test('shows errors in a summary that takes focus, and clears them as the user fixes them', async ({
    page,
  }) => {
    await compare(page);
    const summary = page.locator('.error-summary');
    await expect(summary).toBeFocused();
    await expect(summary.getByText('Enter your age.')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Age', exact: true })).toHaveAttribute(
      'aria-invalid',
      'true',
    );

    await page.getByRole('textbox', { name: 'Age', exact: true }).fill('16');
    await compare(page);
    await expect(summary.getByText('This tool is for people 17 and older.')).toBeVisible();

    await page.getByRole('textbox', { name: 'Age', exact: true }).fill('24');
    await expect(page.getByRole('textbox', { name: 'Age', exact: true })).not.toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  test('asks for at least one result', async ({ page }) => {
    await fillAbout(page, '25', 'Female');
    await compare(page);
    await expect(page.locator('.error-summary')).toContainText('Enter at least one test result');
  });

  test('applies the Army combat variant (male column for everyone)', async ({ page }) => {
    await choose(page, /U\.S\. Army/);
    await fillAbout(page, '25', 'Female');
    await page.getByLabel('Hand-release push-ups (2 min)').fill('12');
    await compare(page);
    await expect(page.locator('.results').getByText('Minimum: 11 reps.')).toBeVisible();
    await expect(page.locator('.results').getByText('Not the whole requirement.')).toBeVisible();

    await page.getByRole('checkbox', { name: /Combat MOS/ }).check();
    await compare(page);
    await expect(
      page.locator('.results').getByText('Your result: 12 reps. Minimum: 14 reps.'),
    ).toBeVisible();
  });

  test('scores the FBI test in points and compares the total with the requirement', async ({
    page,
  }) => {
    await choose(page, /Federal Bureau of Investigation/);
    await fillAbout(page, '30', 'Male');
    await page.getByLabel(/^Pull-ups or chin-ups/).fill('8');
    await page.getByLabel('300-meter sprint').fill('47.9');
    await page.getByLabel('Push-ups (untimed)').fill('40');
    await page.getByLabel('1.5-mile run').fill('12:24');
    await compare(page);

    const results = page.locator('.results');
    await expect(results.getByText('4 of 4 events scored.')).toBeVisible();
    await expect(results.getByText('Points counted so far: 12.')).toBeVisible();
    await expect(results.getByText(/It earns 4 points/).first()).toBeVisible();
    await expect(results.getByText(/It earns 1 point\./)).toBeVisible();
    await expect(results.getByText('Meets the total required: 12 of 10 points')).toBeVisible();
    await expect(results.getByText(/pass(ed)?|ready/i)).toHaveCount(0);
  });

  test('counts the DEA run points twice and says when the total is short', async ({ page }) => {
    await choose(page, /Drug Enforcement Administration/);
    await fillAbout(page, '30', 'Male');
    await page.getByLabel('Sit-ups (1 min)').fill('38');
    await page.getByLabel('Push-ups', { exact: true }).fill('33');
    await page.getByLabel(/^1\.5-mile run/).fill('12:14');
    await compare(page);

    const results = page.locator('.results');
    await expect(results.getByText(/counted twice in the total: 4/)).toBeVisible();
    await expect(results.getByText('Below the total required: 7 of 12 points')).toBeVisible();
    await expect(
      results.getByText(/Applicants under announcements before July 2026/),
    ).toBeVisible();
  });

  test('flags a zero in the Secret Service test and waits for every event before the total', async ({
    page,
  }) => {
    await choose(page, /Secret Service/);
    await fillAbout(page, '28', 'Female');
    await page.getByLabel('Push-ups', { exact: true }).fill('44');
    await compare(page);
    const results = page.locator('.results');
    await expect(results.getByText(/Enter a result for every event/)).toBeVisible();

    await page.getByLabel('Sit-ups', { exact: true }).fill('50');
    await page.getByLabel('Illinois agility run').fill('19.43');
    await page.getByLabel('1.5-mile run').fill('23:00');
    await compare(page);
    await expect(
      results.locator('.status').filter({ hasText: 'Below the per-event minimum' }),
    ).toBeVisible();
    await expect(results.getByText('Meets the total required: 23 of 20 points')).toBeVisible();
  });

  test('checks the Navy waist-to-height ratio and explains what happens next', async ({ page }) => {
    await choose(page, /U\.S\. Navy/);
    await fillAbout(page, '25', 'Male');
    await page.getByLabel(/^Height \(inches\)/).fill('70');
    await page.getByLabel(/^Waist \(inches\)/).fill('38.5');
    await page.getByLabel(/^Weight, optional/).fill('180');
    await compare(page);
    await expect(page.locator('.results').getByText('Not within the limit')).toBeVisible();
    await expect(page.locator('.results').getByText(/Step 2 is required/)).toBeVisible();
    await expect(page.locator('.results').getByText(/BMI does not measure fitness/)).toBeVisible();
  });

  test('converts typed measurements when the units change', async ({ page }) => {
    await choose(page, /U\.S\. Navy/);
    await page.getByLabel(/^Height \(inches\)/).fill('70');
    await page.getByRole('radio', { name: /Metric/ }).check();
    await expect(page.getByLabel(/^Height \(centimeters\)/)).toHaveValue('177.8');
  });

  test('keeps every entry on the page: no storage, no cookies, no address data, no other requests', async ({
    page,
    context,
    baseURL,
  }) => {
    const requests: { method: string; url: string }[] = [];
    page.on('request', (request) =>
      requests.push({ method: request.method(), url: request.url() }),
    );

    await choose(page, /U\.S\. Navy/);
    await fillAbout(page, '27', 'Male');
    await page.getByLabel(/^Height \(inches\)/).fill('70');
    await page.getByLabel(/^Waist \(inches\)/).fill('33');
    await page.getByLabel(/^Weight, optional/).fill('170');
    await page.getByLabel('Push-ups (2 min)').fill('40');
    await compare(page);
    await expect(page.getByRole('heading', { name: /Results for/ })).toBeVisible();

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

  test('has no accessibility violations: empty, with errors, and with results', async ({
    page,
  }) => {
    await expectNoViolations(page);

    await compare(page);
    await expect(page.locator('.error-summary')).toBeVisible();
    await expectNoViolations(page);

    await choose(page, /Bureau of Alcohol/);
    await fillAbout(page, '25', 'Male');
    await page.getByLabel('Sit-ups (1 min)').fill('45');
    await page.getByLabel('Push-ups (1 min)').fill('30');
    await compare(page);
    await expect(page.getByRole('heading', { name: /Results for/ })).toBeVisible();
    await expectNoViolations(page);
  });
});

test.describe('readiness tool in dark mode', () => {
  test.use({ colorScheme: 'dark' });

  test('has no accessibility violations with errors and results', async ({ page }) => {
    await page.goto(ROUTE);
    await compare(page);
    await expect(page.locator('.error-summary')).toBeVisible();
    await expectNoViolations(page);

    await choose(page, /U\.S\. Navy/);
    await fillAbout(page, '25', 'Male');
    await page.getByLabel(/^Height \(inches\)/).fill('70');
    await page.getByLabel(/^Waist \(inches\)/).fill('38.5');
    await compare(page);
    await expect(page.getByRole('heading', { name: /Results for/ })).toBeVisible();
    await expectNoViolations(page);
  });
});
