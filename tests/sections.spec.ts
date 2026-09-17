import { test, expect } from './fixtures';

test('industry carousel supports arrows, keyboard bounds, and a synchronized ruler', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const track = page.getByRole('group', { name: 'Industries carousel' });
  const previous = page.getByRole('button', { name: 'Previous industries' });
  const next = page.getByRole('button', { name: 'Next industries' });
  await expect(previous).toBeDisabled();
  await next.click();
  await expect.poll(() => track.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
  await expect(previous).toBeEnabled();
  await track.focus();
  await page.keyboard.press('End');
  await expect(next).toBeDisabled();
  await expect(page.locator('.industry-ruler > span').last()).toHaveClass('is-current');
  await page.keyboard.press('Home');
  await expect(previous).toBeDisabled();
  await expect(page.locator('.industry-ruler > span').first()).toHaveClass('is-current');
  await page.keyboard.press('ArrowRight');
  await expect(previous).toBeEnabled();
  await previous.click();
  await expect(previous).toBeDisabled();
});

test('mobile can reach every industry and closing links without page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const track = page.getByRole('group', { name: 'Industries carousel' });
  for (const link of await track.getByRole('link').all()) {
    await link.focus();
    await expect(link).toBeInViewport({ ratio: .9 });
    await expect(link).toHaveAttribute('href', 'https://www.futurixai.com/contact');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
  }
  const closing = page.locator('.closing-cta');
  await closing.scrollIntoViewIfNeeded();
  await expect(closing.getByRole('link', { name: 'View Github' })).toHaveAttribute('href', 'https://github.com/FuturixAI-and-Quantum-Works/Prism-Legal-OS');
  await expect(closing.getByRole('link', { name: 'Talk to Sales' })).toHaveAttribute('href', 'https://www.futurixai.com/contact');
  await page.getByRole('link', { name: 'Prism home', exact: true }).click();
  await expect(page).toHaveURL(/#main$/);
  await expect(page.locator('.hero')).toBeInViewport();
});

test('laptop page scrolling advances the pinned industries and their color highlight', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const section = page.locator('.industries');
  await expect(section).toHaveClass(/industries-scroll-driven/);
  const range = await section.evaluate(el => {
    const spacer = el.parentElement!;
    const header = document.querySelector('.site-header')!.getBoundingClientRect().height;
    return { start: scrollY + spacer.getBoundingClientRect().top - header, distance: spacer.offsetHeight - (el as HTMLElement).offsetHeight, header };
  });
  let previousLeft = -1;
  for (const index of [0, 1, 2, 3, 4]) {
    await page.evaluate(({ range, index }) => window.scrollTo(0, range.start + range.distance * index / 4), { range, index });
    await expect(section.locator('.industry-card').nth(index)).toHaveClass(/industry-active/);
    await expect(section.locator('.industry-card img').nth(index)).toHaveCSS('filter', /saturate\(0?\.?9[89]|saturate\(1\)/);
    expect((await section.boundingBox())!.y).toBeCloseTo(range.header, 0);
    const left = await section.locator('.industry-track').evaluate(el => el.scrollLeft);
    expect(left).toBeGreaterThan(previousLeft);
    previousLeft = left;
  }
  await page.evaluate(range => window.scrollTo(0, range.start + range.distance + 300), range);
  await expect.poll(async () => (await section.boundingBox())!.y).toBeLessThan(0);
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(section).not.toHaveClass(/industries-scroll-driven/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});

test('dark surfaces expand with scroll and finish full width at the page bottom', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const surface = page.locator('.results-surface');
  await surface.evaluate(el => window.scrollTo(0, scrollY + el.getBoundingClientRect().top - innerHeight * .85));
  await expect(surface).toHaveCSS('clip-path', /inset\(0% [1-6]/);
  await surface.evaluate(el => window.scrollTo(0, scrollY + el.getBoundingClientRect().top - innerHeight * .2));
  await expect(surface).toHaveCSS('clip-path', 'inset(0%)');
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(page.locator('.closing-surface')).toHaveCSS('clip-path', 'inset(0%)');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(surface).toHaveCSS('clip-path', 'none');
  await expect(page.locator('.closing-surface')).toHaveCSS('clip-path', 'none');
  await expect(page.locator('.industries')).not.toHaveClass(/industries-scroll-driven/);
});
