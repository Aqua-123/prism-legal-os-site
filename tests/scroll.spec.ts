import { expect, test } from './fixtures';

test('GSAP smooths wheel scrolling while the header stays pinned', async ({ page }) => {
  await page.goto('/');
  await page.mouse.move(1000, 500);
  await page.mouse.wheel(0, 600);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.scrollY)).toBeLessThan(600);
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(600);
  expect((await page.locator('.site-header').boundingBox())?.y).toBe(0);
  await page.mouse.wheel(0, -200);
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(400);
  await expect(page.locator('.feature-item button').nth(3)).toHaveText('Workflow Automation');
  await expect(page.getByRole('link', { name: 'Get Started', exact: true })).toHaveCount(0);
});

test('anchor scrolling returns to the hero and reduced motion cancels an active scroll', async ({ page }) => {
  await page.goto('/');
  await page.locator('.site-footer').scrollIntoViewIfNeeded();
  await page.getByRole('link', { name: 'Prism home', exact: true }).click();
  await expect(page).toHaveURL(/#main$/);
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(0);
  await expect(page.locator('#main')).toBeFocused();
  await page.mouse.move(1000, 500);
  await page.mouse.wheel(0, 800);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const stopped = await page.evaluate(() => window.scrollY);
  await page.waitForTimeout(900);
  expect(await page.evaluate(() => window.scrollY)).toBe(stopped);
  await page.mouse.wheel(0, 200);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(stopped);
});
