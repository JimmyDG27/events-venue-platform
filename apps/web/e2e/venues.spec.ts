/**
 * E2E — Venue discovery flows
 * Covers: home page search, venues listing + filtering, venue detail page
 */
import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('loads and shows the search bar', async ({ page }) => {
    await page.goto('/en');
    await expect(page.getByLabel('Event type')).toBeVisible();
    await expect(page.getByLabel('Location')).toBeVisible();
    await expect(page.getByLabel('Guests')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Search Venues' })).toBeVisible();
  });

  test('search bar navigates to venues listing with filters', async ({ page }) => {
    await page.goto('/en');

    await page.getByLabel('Event type').fill('Wedding');
    await page.getByLabel('Location').fill('London');
    await page.getByRole('button', { name: 'Search Venues' }).click();

    await page.waitForURL('**/venues**');
    const url = page.url();
    expect(url).toContain('eventType=Wedding');
    expect(url).toContain('location=London');
  });

  test('shows featured venues section when API has data', async ({ page }) => {
    await page.goto('/en');
    // The Featured Venues section either shows cards or "No venues available"
    await expect(
      page.getByRole('heading', { name: 'Featured Venues' }).or(
        page.getByText('No venues available at the moment.')
      )
    ).toBeVisible();
  });
});

test.describe('Venues listing', () => {
  test('renders the listing page with filters panel', async ({ page }) => {
    await page.goto('/en/venues');
    await expect(page.getByRole('heading', { name: 'Venues' })).toBeVisible();
    // Filters panel
    await expect(page.getByLabel('Location')).toBeVisible();
    await expect(page.getByLabel('Event type')).toBeVisible();
    await expect(page.getByLabel('Minimum capacity')).toBeVisible();
  });

  test('applying a filter updates the URL', async ({ page }) => {
    await page.goto('/en/venues');

    await page.getByLabel('Location').fill('Shoreditch');
    await page.getByRole('button', { name: /Search|Filter/i }).first().click();

    await page.waitForURL('**/venues**');
    expect(page.url()).toContain('location=Shoreditch');
  });

  test('shows venue cards or empty state', async ({ page }) => {
    await page.goto('/en/venues');
    // Either cards appear or the empty-state message
    const cards = page.locator('a[href*="/venues/"]');
    const empty = page.getByText('No venues match your search');

    await expect(cards.first().or(empty)).toBeVisible();
  });
});

test.describe('Venue detail', () => {
  test('navigating from listing to detail shows venue info', async ({ page }) => {
    await page.goto('/en/venues');

    // Click the first venue card link
    const firstCard = page.locator('a[href*="/venues/"]').first();
    await firstCard.waitFor({ state: 'visible' });
    await firstCard.click();

    // Should be on a venue detail page
    await page.waitForURL('**/venues/**');

    // Detail page shows action buttons
    await expect(page.getByRole('button', { name: 'Request Availability' })
      .or(page.getByRole('link', { name: 'Request Availability' }))).toBeVisible();
    await expect(page.getByRole('button', { name: 'Schedule a Viewing' })).toBeVisible();
  });

  test('unauthenticated request availability redirects to login', async ({ page }) => {
    await page.goto('/en/venues');

    const firstCard = page.locator('a[href*="/venues/"]').first();
    await firstCard.waitFor({ state: 'visible' });
    const href = await firstCard.getAttribute('href');
    if (!href) throw new Error('No venue link found');

    await page.goto(`/en${href}/request`);
    // The RequestForm redirects unauthenticated users to login
    await page.waitForURL('**/auth/login**');
    expect(page.url()).toContain('return=');
  });
});
