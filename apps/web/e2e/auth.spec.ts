/**
 * E2E — Auth flows
 * Covers: register, login, profile settings, notification preferences, logout
 */
import { test, expect } from '@playwright/test';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function uniqueEmail() {
  return `e2e_auth_${Date.now()}@test.local`;
}

test.describe('Registration', () => {
  test('registers a new account and redirects to dashboard', async ({ page }) => {
    const email = uniqueEmail();

    await page.goto('/en/auth/register');
    await expect(page.getByRole('heading', { name: 'Create Your Account' })).toBeVisible();

    await page.getByLabel('Full name').fill('Test Register User');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password').fill('Password123!');
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Should land on the requests dashboard after registration
    await page.waitForURL('**/dashboard/requests');
    await expect(page.getByRole('heading', { name: 'My Requests' })).toBeVisible();
  });

  test('shows validation errors for empty form', async ({ page }) => {
    await page.goto('/en/auth/register');
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page.getByText('Full name is required')).toBeVisible();
    await expect(page.getByText('Email address is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('shows error for duplicate email', async ({ page, request }) => {
    const email = uniqueEmail();
    // Pre-create the user via API
    await request.post(`${API_URL}/auth/register`, {
      data: { name: 'Existing', email, password: 'Password123!' },
    });

    await page.goto('/en/auth/register');
    await page.getByLabel('Full name').fill('Duplicate User');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password').fill('Password123!');
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page.getByText('An account with this email already exists')).toBeVisible();
  });
});

test.describe('Login', () => {
  test('logs in with valid credentials and redirects to dashboard', async ({ page, request }) => {
    const email = uniqueEmail();
    await request.post(`${API_URL}/auth/register`, {
      data: { name: 'Login Test User', email, password: 'Password123!' },
    });

    await page.goto('/en/auth/login');
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();

    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password').fill('Password123!');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await page.waitForURL('**/dashboard/requests');
    // Navbar should show "My Account"
    await expect(page.getByRole('link', { name: 'My Account' })).toBeVisible();
  });

  test('shows error for wrong password', async ({ page, request }) => {
    const email = uniqueEmail();
    await request.post(`${API_URL}/auth/register`, {
      data: { name: 'Wrong Pass', email, password: 'Password123!' },
    });

    await page.goto('/en/auth/login');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password').fill('WrongPassword!');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByText('Invalid email or password')).toBeVisible();
  });
});

test.describe('Logout', () => {
  test('logs out and redirects to home, clearing auth state', async ({ page, request }) => {
    const email = uniqueEmail();
    const res = await request.post(`${API_URL}/auth/register`, {
      data: { name: 'Logout User', email, password: 'Password123!' },
    });
    const { accessToken, user } = await res.json() as { accessToken: string; user: { id: string; name: string; email: string } };

    await page.addInitScript(({ token, u }) => {
      localStorage.setItem('access_token', token);
      localStorage.setItem('auth_user', JSON.stringify(u));
    }, { token: accessToken, u: user });

    await page.goto('/en');
    await expect(page.getByRole('link', { name: 'My Account' })).toBeVisible();

    await page.getByRole('button', { name: 'Sign Out' }).click();
    await page.waitForURL('**/en');

    // Navbar should show Sign In again
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible();
  });
});

test.describe('Profile settings', () => {
  test('updates phone number and sees success message', async ({ page, request }) => {
    const email = uniqueEmail();
    const res = await request.post(`${API_URL}/auth/register`, {
      data: { name: 'Profile User', email, password: 'Password123!' },
    });
    const { accessToken, user } = await res.json() as { accessToken: string; user: { id: string; name: string; email: string } };

    await page.addInitScript(({ token, u }) => {
      localStorage.setItem('access_token', token);
      localStorage.setItem('auth_user', JSON.stringify(u));
    }, { token: accessToken, u: user });

    await page.goto('/en/dashboard/profile');
    await expect(page.getByRole('heading', { name: 'Profile Settings' })).toBeVisible();

    await page.getByLabel('Phone number').fill('+44 7700 900000');
    await page.getByRole('button', { name: 'Save Changes' }).click();

    await expect(page.getByText('Profile updated successfully.')).toBeVisible();
  });

  test('toggles notification preferences and sees saved confirmation', async ({ page, request }) => {
    const email = uniqueEmail();
    const res = await request.post(`${API_URL}/auth/register`, {
      data: { name: 'Notif User', email, password: 'Password123!' },
    });
    const { accessToken, user } = await res.json() as { accessToken: string; user: { id: string; name: string; email: string } };

    await page.addInitScript(({ token, u }) => {
      localStorage.setItem('access_token', token);
      localStorage.setItem('auth_user', JSON.stringify(u));
    }, { token: accessToken, u: user });

    await page.goto('/en/dashboard/profile');

    // Toggle the "Marketing emails" checkbox
    const marketingCheckbox = page.getByRole('checkbox', { name: /Marketing emails/i });
    await marketingCheckbox.waitFor({ state: 'visible' });
    await marketingCheckbox.click();

    await expect(page.getByText('Preferences saved.')).toBeVisible();
  });
});
