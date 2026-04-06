/**
 * E2E — Availability request flow
 * Covers: authenticated multi-step form → submission → confirmation + dashboard
 */
import { test, expect } from './fixtures/auth';

/** Returns a date string N days from today in YYYY-MM-DD format */
function futureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

test.describe('Availability request flow', () => {
  test('authenticated user completes multi-step request form and sees confirmation', async ({
    authenticatedPage: page,
  }) => {
    // Navigate to venues, find first, open request page
    await page.goto('/en/venues');

    const firstCard = page.locator('a[href*="/venues/"]').first();
    await firstCard.waitFor({ state: 'visible' });
    const href = await firstCard.getAttribute('href');
    if (!href) throw new Error('No venue link found');

    await page.goto(`/en${href}/request`);
    await expect(page.getByRole('heading', { name: 'Request Availability' })).toBeVisible();

    // Step 1 — dates
    await expect(page.getByText(/Step 1/)).toBeVisible();
    await page.getByLabel('From').fill(futureDate(7));
    await page.getByLabel('To').fill(futureDate(9));
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 2 — guests
    await expect(page.getByText(/Step 2/)).toBeVisible();
    await page.getByLabel('Number of guests').fill('50');
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 3 — event type + submit
    await expect(page.getByText(/Step 3/)).toBeVisible();
    await page.getByLabel('Event type').fill('Corporate');
    await page.getByRole('button', { name: 'Send Request' }).click();

    // Confirmation screen
    await expect(page.getByRole('heading', { name: 'Request Sent' })).toBeVisible();
    await expect(page.getByText('Your availability request has been submitted')).toBeVisible();
  });

  test('step 1 validates that end date is after start date', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/en/venues');

    const firstCard = page.locator('a[href*="/venues/"]').first();
    await firstCard.waitFor({ state: 'visible' });
    const href = await firstCard.getAttribute('href');
    if (!href) throw new Error('No venue link found');

    await page.goto(`/en${href}/request`);

    await page.getByLabel('From').fill(futureDate(9));
    await page.getByLabel('To').fill(futureDate(7)); // end before start
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByText('End date must be after start date')).toBeVisible();
  });

  test('submitted request appears in the requests dashboard', async ({
    authenticatedPage: page,
  }) => {
    // Submit a request
    await page.goto('/en/venues');
    const firstCard = page.locator('a[href*="/venues/"]').first();
    await firstCard.waitFor({ state: 'visible' });
    const href = await firstCard.getAttribute('href');
    if (!href) throw new Error('No venue link found');

    await page.goto(`/en${href}/request`);
    await page.getByLabel('From').fill(futureDate(14));
    await page.getByLabel('To').fill(futureDate(16));
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByLabel('Number of guests').fill('30');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByLabel('Event type').fill('Birthday');
    await page.getByRole('button', { name: 'Send Request' }).click();
    await expect(page.getByRole('heading', { name: 'Request Sent' })).toBeVisible();

    // Navigate to requests dashboard and verify
    await page.goto('/en/dashboard/requests');
    await expect(page.getByRole('heading', { name: 'My Requests' })).toBeVisible();
    // At least one request card should be present
    const requestCards = page.locator('[class*="border"][class*="surface"]');
    await expect(requestCards.first()).toBeVisible();
  });
});
