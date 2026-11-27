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
    const results = page.locator('.results');
    await expect(
      results.locator('.status', { hasText: 'Meets the per-event minimum' }),
    ).toBeVisible();
    await expect(results.getByText(/Enter a result for every event/)).toBeVisible();
    await expect(results.getByText(/the total required/)).toHaveCount(0);

    await page.getByRole('checkbox', { name: /Combat MOS/ }).check();
    await compare(page);
    // The male column needs 14 reps for 60 points, so 12 reps is below the event minimum.
    await expect(
      results.locator('.status', { hasText: 'Below the per-event minimum' }),
    ).toBeVisible();
    await expect(results.getByText(/the 350 points/)).toBeVisible();
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

  test('compares Marine Corps results with the order and says what is not included yet', async ({
    page,
  }) => {
    await choose(page, /U\.S\. Marine Corps/);
    await fillAbout(page, '25', 'Male');
    await page.getByLabel('Pull-ups', { exact: true }).fill('4');
    await page.getByLabel('Plank', { exact: true }).fill('1:20');
    await page.getByLabel('3-mile run').fill('28:00');
    await compare(page);

    const results = page.locator('.results');
    await expect(results.getByText('1 of 3 entered events meet the minimum.')).toBeVisible();
    await expect(results.getByText('Minimum: 5 reps.')).toBeVisible();
    await expect(results.getByText('Minimum: 27:40.')).toBeVisible();
    await expect(results.getByText(/at least 150 points in total/)).toBeVisible();
    await expect(results.getByText('Not included yet for Marine Corps:')).toBeVisible();
    await expect(results.getByText(/MCO 6110.3A/)).toBeVisible();
  });

  test('scores the Air Force assessment by part and says what is missing', async ({ page }) => {
    await choose(page, /U\.S\. Air Force/);
    await fillAbout(page, '25', 'Male');
    await page.getByLabel('Push-ups (1 min)').fill('30');
    await page.getByLabel('2-mile run').fill('20:30'); // slower than the 19:55 minimum
    await compare(page);

    const results = page.locator('.results');
    await expect(results.getByText('2 of 4 parts scored.')).toBeVisible();
    await expect(results.getByText('Below the minimum (scores zero)')).toBeVisible();
    await expect(results.getByText('Needs your height and waist')).toBeVisible();
    await expect(results.getByText(/Enter a result for every part/)).toBeVisible();
    await expect(results.getByText(/composite score of at least 75/)).toBeVisible();
    await expect(results.getByText('Not included yet for Air Force:')).toHaveCount(0);
  });

  test('adds up the Air Force parts and the waist-to-height points', async ({ page }) => {
    await choose(page, /U\.S\. Air Force/);
    await fillAbout(page, '20', 'Male');
    await page.getByLabel('Push-ups (1 min)').fill('67');
    await page.getByLabel('Sit-ups (1 min)').fill('58');
    await page.getByLabel('2-mile run').fill('13:25');
    await page.getByLabel(/^Height \(inches\)/).fill('72');
    await page.getByLabel(/^Waist \(inches\)/).fill('35');
    await compare(page);

    const results = page.locator('.results');
    await expect(results.getByText('4 of 4 parts scored.')).toBeVisible();
    await expect(results.getByText('Points counted so far: 100 of 100.')).toBeVisible();
    await expect(results.getByText(/Meets the total required: 100 of 75 points/)).toBeVisible();
  });

  test('applies the Marine Corps combat arms option and rounds measurements down', async ({
    page,
  }) => {
    await choose(page, /U\.S\. Marine Corps/);
    await fillAbout(page, '25', 'Female');
    await page.getByLabel('Pull-ups', { exact: true }).fill('4');
    await page.getByLabel(/^Height \(inches\)/).fill('70.4');
    await page.getByLabel(/^Waist \(inches\)/).fill('36.6');
    await compare(page);
    const results = page.locator('.results');
    await expect(results.getByText('Minimum: 3 reps.')).toBeVisible(); // female column
    // Raw ratio 0.5199 is under 0.52, but the rounded 36.5 / 70 = 0.5214 is over.
    await expect(results.getByText('Not within the limit')).toBeVisible();
    await expect(results.getByText('a height of 70 in and a waist of 36.5 in')).toBeVisible();

    await page.getByRole('checkbox', { name: /Combat arms PMOS/ }).check();
    await compare(page);
    await expect(results.getByText('Minimum: 5 reps.')).toBeVisible(); // male column
  });

  test('checks the Air Force waist-to-height ratio (0.55 is still within)', async ({ page }) => {
    await choose(page, /U\.S\. Air Force/);
    await fillAbout(page, '30', 'Male');
    await page.getByLabel(/^Height \(inches\)/).fill('72');
    await page.getByLabel(/^Waist \(inches\)/).fill('40');
    await compare(page);
    const results = page.locator('.results');
    await expect(results.getByText('Within the limit')).toBeVisible();
    await expect(results.getByText('It is rounded down to 0.55')).toBeVisible();
    await expect(results.getByText('The limit is 0.55 or less')).toBeVisible();
  });

  test('checks the Space Force waist-to-height ratio and the walk standard', async ({ page }) => {
    await choose(page, /U\.S\. Space Force/);
    await fillAbout(page, '30', 'Female');
    await page.getByLabel(/^Height \(inches\)/).fill('64');
    await page.getByLabel(/^Waist \(inches\)/).fill('35.2');
    await page.getByLabel(/^2-kilometer walk/).fill('17:00');
    await compare(page);

    const results = page.locator('.results');
    await expect(results.getByText('Not within the limit')).toBeVisible(); // 35.2 / 64 = 0.55
    await expect(results.getByText(/26% for men and 36% for women/)).toBeVisible();
    await expect(results.locator('.status').filter({ hasText: 'Meets the minimum' })).toBeVisible();
    await expect(results.getByText('Not included yet for Space Force:')).toBeVisible();
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
