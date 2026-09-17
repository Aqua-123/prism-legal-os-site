import { expect, test } from './fixtures';

test('heading lines reveal once without changing typography or layout', async ({ page }) => {
  await page.goto('/');
  const heading = page.locator('#lifecycle-title');
  const before = await heading.boundingBox();
  await heading.scrollIntoViewIfNeeded();
  await expect(heading.locator('.heading-line')).toHaveCount(2);
  await expect(heading.locator('.heading-source')).toHaveCSS('opacity', '0');
  await expect(heading.locator('.heading-source')).toHaveCSS('opacity', '1');
  await expect(heading.locator('.heading-mask')).toHaveCount(0);
  const after = await heading.boundingBox();
  expect(after?.width).toBe(before?.width);
  expect(after?.height).toBe(before?.height);
  await expect(heading).toHaveCSS('font-weight', '500');
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(() => heading.evaluate(el => el.getBoundingClientRect().top > innerHeight)).toBe(true);
  await heading.scrollIntoViewIfNeeded();
  await expect(heading.locator('.heading-source')).toHaveCSS('opacity', '1');
  await expect(heading.locator('.heading-mask')).toHaveCount(0);
});

test('card motion follows scroll position and stops when scrolling stops', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const scene = page.locator('.deployment-slot').first();
  const visual = scene.locator('.scroll-visual');
  await scene.evaluate(el => window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top - 850));
  await expect(visual).not.toHaveCSS('transform', 'none');
  const before = await visual.evaluate(el => getComputedStyle(el).transform);
  await page.evaluate(() => window.scrollBy(0, 300));
  await expect.poll(() => visual.evaluate(el => getComputedStyle(el).transform)).not.toBe(before);
  const stopped = await visual.evaluate(el => getComputedStyle(el).transform);
  await page.waitForTimeout(300);
  expect(await visual.evaluate(el => getComputedStyle(el).transform)).toBe(stopped);
});

test('reduced motion keeps text readable and previews manually selectable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await page.goto('/');
  await page.clock.runFor(5000);
  await expect(page.getByRole('tabpanel', { name: 'Workspace', exact: true })).toBeVisible();
  await expect(page.locator('#hero-title .heading-source')).toHaveCSS('opacity', '1');
  await expect(page.locator('.hero-description .line-source')).toHaveCSS('opacity', '1');
  await expect(page.locator('.preview-stage > .scroll-visual')).toHaveCSS('transform', 'none');
  await page.getByRole('tab', { name: 'Prism AI', exact: true }).click();
  await expect(page.getByRole('tabpanel', { name: 'Prism AI', exact: true })).toBeVisible();
});

test('resizing during a text reveal restores readable text without stale line masks', async ({ page }) => {
  await page.goto('/');
  const paragraph = page.locator('.hero-description');
  await expect(paragraph.locator('.line-mask').first()).toBeAttached();
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(paragraph.locator(':scope > .line-source')).toHaveCSS('opacity', '1');
  await expect(paragraph.locator('.line-mask')).toHaveCount(0);
  await expect(paragraph).toHaveText('One Legal OS To Draft, Review, And Take Command Of Every Contract');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
