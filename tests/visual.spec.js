import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const demoPath = path.resolve(__dirname, '../demo/index.html');
const componentsPath = path.resolve(__dirname, '../demo/components/index.html');

test('kitchen sink visual snapshot', async ({ page }) => {
  await page.goto('file://' + demoPath);
  await expect(page).toHaveScreenshot('kitchen-sink.png', { fullPage: true });
});

test('narrow viewport visual snapshot', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1200 });
  await page.goto('file://' + demoPath);
  await expect(page).toHaveScreenshot('kitchen-sink-mobile.png', { fullPage: true });
});

test('split button dropdown is anchored', async ({ page }) => {
  await page.goto('file://' + demoPath);

  const trigger = page.getByLabel('More save actions');
  const menu = page.locator('#recipes .dropdown-menu');

  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  await expect(menu).toBeVisible();

  const anchorBox = await trigger.boundingBox();
  const menuBox = await menu.boundingBox();
  expect(anchorBox).not.toBeNull();
  expect(menuBox).not.toBeNull();

  expect(menuBox.y).toBeGreaterThanOrEqual(anchorBox.y + anchorBox.height - 1);
  expect(menuBox.y).toBeLessThan(anchorBox.y + anchorBox.height + 16);
  expect(Math.abs(menuBox.x + menuBox.width - (anchorBox.x + anchorBox.width))).toBeLessThan(8);
});

test('components overview page', async ({ page }) => {
  await page.goto('file://' + componentsPath);
  await expect(page).toHaveScreenshot('components-overview.png', { fullPage: true });
});

test('square theme disables rounded corners', async ({ page }) => {
  await page.goto('file://' + demoPath);
  await page.locator('#theme-switcher').selectOption('square');

  const cardRadius = await page.locator('#dashboard .card').first().evaluate((element) => {
    return getComputedStyle(element).borderRadius;
  });
  const buttonRadius = await page.locator('.btn.primary').first().evaluate((element) => {
    return getComputedStyle(element).borderRadius;
  });

  expect(cardRadius).toBe('0px');
  expect(buttonRadius).toBe('0px');
});
