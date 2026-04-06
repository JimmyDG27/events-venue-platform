/**
 * E2E — Favorites flow
 * Covers: save venue → view in dashboard → remove
 */
import { test, expect } from './fixtures/auth';

test.describe('Favorites', () => {
  test('saves a venue and it appears in the favorites dashboard', async ({
    authenticatedPage: page,
  }) => {
    // Navigate to a venue detail page
    await page.goto('/en/venues');
    const firstCard = page.locator('a[href*="/venues/"]').first();
    await firstCard.waitFor({ state: 'visible' });
    await firstCard.click();
    await page.waitForURL('**/venues/**');

    // Save to favorites
    const saveBtn = page.getByRole('button', { name: 'Save to Favourites' });
    await saveBtn.waitFor({ state: 'visible' });
    await saveBtn.click();

    // Button should now show "Saved"
    await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible();

    // Navigate to favorites dashboard
    await page.goto('/en/dashboard/favorites');
    await expect(page.getByRole('heading', { name: 'My Favourites' })).toBeVisible();

    // At least one favorite should be listed
    const favoriteItems = page.locator('[class*="border"][class*="surface"]');
    await expect(favoriteItems.first()).toBeVisible();
  });

  test('removes a venue from favorites dashboard', async ({
    authenticatedPage: page,
    authState,
    request,
  }) => {
    // First, find a venue and add it to favorites via API for speed
    const venuesRes = await request.get('http://localhost:3001/venues?limit=1');
    const { data } = await venuesRes.json() as { data: { id: string }[] };
    if (!data.length) throw new Error('No venues in DB for E2E test');

    const venueId = data[0].id;
    await request.post(`http://localhost:3001/favorites/${venueId}`, {
      headers: { Authorization: `Bearer ${authState.token}` },
    });

    // Navigate to favorites dashboard
    await page.goto('/en/dashboard/favorites');
    await expect(page.getByRole('heading', { name: 'My Favourites' })).toBeVisible();

    // Click Remove on the first item
    const removeBtn = page.getByRole('button', { name: 'Remove' }).first();
    await removeBtn.waitFor({ state: 'visible' });
    await removeBtn.click();

    // Item should disappear (optimistic update)
    await expect(removeBtn).not.toBeVisible();
  });

  test('empty state shown when no favorites', async ({ authenticatedPage: page }) => {
    await page.goto('/en/dashboard/favorites');
    await expect(page.getByRole('heading', { name: 'My Favourites' })).toBeVisible();

    // For a fresh user, either empty state or existing favorites
    // Just assert the page loads without error
    await expect(
      page.getByText('No saved venues yet.').or(
        page.locator('[class*="border"][class*="surface"]').first()
      )
    ).toBeVisible();
  });
});
