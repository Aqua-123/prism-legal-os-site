import { expect, test } from '@playwright/test';

test('Prism entry reveals the page, unlocks interaction, and only plays once per session', async ({ page }) => {
  await page.goto('/');
  const loader = page.getByRole('status', { name: 'Loading Prism Legal OS' });
  await expect(loader).toBeVisible();
  await expect(loader).toContainText('Prism Legal OS');
  await expect(loader).toContainText('By FuturixAI');
  await expect(page.locator('.site-content')).toHaveAttribute('inert', '');
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
  await expect.poll(() => page.locator('.site-loader-logo').evaluate(el => {
    const logo = el.getBoundingClientRect();
    const mask = el.parentElement!.getBoundingClientRect();
    return logo.top >= mask.top && logo.bottom <= mask.bottom;
  })).toBe(true);
  await page.mouse.wheel(0, 400);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await expect(loader).toHaveCount(0, { timeout: 8000 });
  await expect(page.locator('.site-content')).not.toHaveAttribute('inert', '');
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  await expect(page.locator('#hero-title .heading-source')).toHaveCSS('opacity', '1');
  await page.getByRole('tab', { name: 'Prism AI', exact: true }).click();
  await expect(page.getByRole('tabpanel', { name: 'Prism AI', exact: true })).toBeVisible();
  await page.reload();
  await expect(loader).toHaveCount(0);
  await expect(page.locator('.site-content')).not.toHaveAttribute('inert', '');
});

test('mobile entry fits and Escape restores the page immediately', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await expect(page.locator('.site-loader')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
  await page.keyboard.press('Escape');
  await expect(page.locator('.site-loader')).toHaveCount(0);
  await expect(page.locator('.site-content')).not.toHaveAttribute('inert', '');
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
});

test('reduced motion bypasses entry and cancels an active entry', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.site-loader')).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.site-loader')).toHaveCount(0);
  await expect(page.locator('.site-content')).not.toHaveAttribute('inert', '');
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await expect(page.locator('.site-loader')).toHaveCount(0);
  await expect(page.locator('#hero-title .heading-source')).toHaveCSS('opacity', '1');
});
