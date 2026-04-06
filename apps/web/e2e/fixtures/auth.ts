import { test as base, type Page } from '@playwright/test';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface TestUser {
  name: string;
  email: string;
  password: string;
}

interface AuthState {
  token: string;
  user: { id: string; name: string; email: string };
}

interface Fixtures {
  testUser: TestUser;
  authState: AuthState;
  /** A page with localStorage pre-seeded with a valid JWT. */
  authenticatedPage: Page;
}

export const test = base.extend<Fixtures>({
  testUser: async ({}, use) => {
    const ts = Date.now();
    await use({
      name: `E2E User ${ts}`,
      email: `e2e_${ts}@test.local`,
      password: 'Password123!',
    });
  },

  authState: async ({ testUser, request }, use) => {
    const res = await request.post(`${API_URL}/auth/register`, {
      data: testUser,
    });
    if (!res.ok()) {
      throw new Error(
        `E2E auth setup: failed to register test user — ${res.status()} ${await res.text()}`,
      );
    }
    const body = (await res.json()) as {
      accessToken: string;
      user: { id: string; name: string; email: string };
    };
    await use({ token: body.accessToken, user: body.user });
  },

  authenticatedPage: async ({ page, authState }, use) => {
    // Inject localStorage before React hydration so AuthContext picks it up.
    await page.addInitScript(
      ({ token, user }) => {
        localStorage.setItem('access_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
      },
      { token: authState.token, user: authState.user },
    );
    await use(page);
  },
});

export { expect } from '@playwright/test';
