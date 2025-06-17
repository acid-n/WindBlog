import { test, expect } from '@playwright/test';

test('homepage loads posts and title', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/.+/);
  await expect(page.locator('article').first()).toBeVisible();
  await expect(page.locator('article img').first()).toBeVisible();
});
