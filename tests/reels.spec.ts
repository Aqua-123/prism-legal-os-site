import { test, expect } from './fixtures';

test('stats roll through digits, settle to the final value, and keep their width', async ({ page }) => {
  await page.goto('/');
  const number = page.locator('.rolling-number').first();
  const width = (await number.boundingBox())!.width;
  await number.scrollIntoViewIfNeeded();
  await expect(number).toHaveClass(/is-rolling/);
  const strip = number.locator('.number-strip').first();
  const before = await strip.evaluate(el => getComputedStyle(el).transform);
  await expect.poll(() => strip.evaluate(el => getComputedStyle(el).transform)).not.toBe(before);
  await expect(number.locator('.sr-only')).toHaveText('80%');
  expect((await number.boundingBox())!.width).toBe(width);
  await expect(number).not.toHaveClass(/is-rolling/);
  await expect(number.locator('.number-final')).toHaveText(['8', '0']);
  await expect(number.locator('.number-suffix')).toHaveText('%');
  expect((await number.boundingBox())!.width).toBe(width);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('.rolling-number').last().scrollIntoViewIfNeeded();
  await expect(page.locator('.is-rolling')).toHaveCount(0);
  await expect(page.locator('.rolling-number').last().locator('.sr-only')).toHaveText('1000+');
});

test('an industry bumps when activated, then rests while scrolling within that industry', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const section = page.locator('.industries');
  await expect(section).toHaveClass(/industries-scroll-driven/);
  const range = await section.evaluate(el => ({
    start: scrollY + el.parentElement!.getBoundingClientRect().top - document.querySelector('.site-header')!.getBoundingClientRect().height,
    distance: el.parentElement!.offsetHeight - (el as HTMLElement).offsetHeight,
  }));
  await page.evaluate(r => window.scrollTo(0, r.start + r.distance * .5), range);
  const active = section.locator('.industry-card').nth(2);
  await expect(active).toHaveClass(/industry-active/);
  await expect(active).not.toHaveCSS('transform', 'none');
  await expect(active).toHaveCSS('transform', 'none');
  await page.evaluate(r => window.scrollTo(0, r.start + r.distance * .51), range);
  await expect.poll(() => active.evaluate(el => el.getAnimations().filter(animation => animation.playState === 'running').length)).toBe(0);
  await expect(active).toHaveCSS('transform', 'none');
});
