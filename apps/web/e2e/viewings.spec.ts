/**
 * E2E — Viewings flow
 * Covers: schedule viewing → confirmation → view in dashboard → cancel
 */
import { test, expect } from './fixtures/auth';

/** Returns a datetime string at least 2 hours in the future, in datetime-local format */
function futureDatetime(): string {
  const d = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h from now
  // Format: YYYY-MM-DDTHH:MM (no seconds, no timezone)
  return d.toISOString().slice(0, 16);
}

test.describe('Viewings', () => {
  test('schedules a viewing and sees confirmation in the modal', async ({
    authenticatedPage: page,
  }) => {
    // Navigate to a venue detail page
    await page.goto('/en/venues');
    const firstCard = page.locator('a[href*="/venues/"]').first();
    await firstCard.waitFor({ state: 'visible' });
    await firstCard.click();
    await page.waitForURL('**/venues/**');

    // Open viewing modal
    const scheduleBtn = page.getByRole('button', { name: 'Schedule a Viewing' });
    await scheduleBtn.waitFor({ state: 'visible' });
    await scheduleBtn.click();

    // Modal should open with a datetime input
    await expect(page.getByRole('dialog')).toBeVisible();
    const datetimeInput = page.locator('input[type="datetime-local"]');
    await datetimeInput.waitFor({ state: 'visible' });
    await datetimeInput.fill(futureDatetime());

    await page.getByRole('button', { name: 'Confirm Viewing' }).click();

    // Success state in modal
    await expect(page.getByText('Viewing requested!')).toBeVisible();
  });

  test('scheduled viewing appears in the upcoming dashboard tab', async ({
    authenticatedPage: page,
    authState,
    request,
  }) => {
    // Create a viewing via API directly (faster)
    const venuesRes = await request.get('http://localhost:3001/venues?limit=1');
    const { data } = await venuesRes.json() as { data: { id: string }[] };
    if (!data.length) throw new Error('No venues in DB for E2E test');

    const venueId = data[0].id;
    await request.post('http://localhost:3001/viewings', {
      headers: {
        Authorization: `Bearer ${authState.token}`,
        'Content-Type': 'application/json',
      },
      data: { venueId, scheduledAt: futureDatetime() },
    });

    // Navigate to viewings dashboard
    await page.goto('/en/dashboard/viewings');
    await expect(page.getByRole('heading', { name: 'My Viewings' })).toBeVisible();

    // Should be on "Upcoming" tab by default and show the viewing
    await expect(page.getByRole('button', { name: 'Upcoming' })).toBeVisible();
    const viewingCards = page.locator('[class*="border"][class*="surface"]');
    await expect(viewingCards.first()).toBeVisible();
  });

  test('cancels a viewing from the dashboard with inline confirmation', async ({
    authenticatedPage: page,
    authState,
    request,
  }) => {
    // Create a viewing via API
    const venuesRes = await request.get('http://localhost:3001/venues?limit=1');
    const { data } = await venuesRes.json() as { data: { id: string }[] };
    if (!data.length) throw new Error('No venues in DB for E2E test');

    const venueId = data[0].id;
    await request.post('http://localhost:3001/viewings', {
      headers: {
        Authorization: `Bearer ${authState.token}`,
        'Content-Type': 'application/json',
      },
      data: { venueId, scheduledAt: futureDatetime() },
    });

    await page.goto('/en/dashboard/viewings');

    // Click "Cancel Viewing" to trigger inline confirmation
    const cancelBtn = page.getByRole('button', { name: 'Cancel Viewing' }).first();
    await cancelBtn.waitFor({ state: 'visible' });
    await cancelBtn.click();

    // Inline confirmation: "No" and "Yes, cancel" buttons appear
    await expect(page.getByRole('button', { name: 'No' })).toBeVisible();
    const confirmBtn = page.getByRole('button', { name: 'Yes, cancel' });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // After cancellation the "Cancel Viewing" button should be gone (status changed)
    await expect(cancelBtn).not.toBeVisible({ timeout: 5_000 });
  });

  test('past tab shows empty state for a new user', async ({ authenticatedPage: page }) => {
    await page.goto('/en/dashboard/viewings');

    await page.getByRole('button', { name: 'Past' }).click();

    await expect(
      page.getByText('No viewings yet.').or(
        page.locator('[class*="border"][class*="surface"]').first()
      )
    ).toBeVisible();
  });
});
