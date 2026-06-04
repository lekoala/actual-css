import { test, expect } from '@playwright/test';

test('kitchen sink visual snapshot', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('kitchen-sink.png', { fullPage: true });
});

test('narrow viewport visual snapshot', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1200 });
  await page.goto('/');
  await expect(page).toHaveScreenshot('kitchen-sink-mobile.png', { fullPage: true });
});
