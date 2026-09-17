import { expect, test } from './fixtures';

test.use({ launchOptions: { args: ['--enable-unsafe-swiftshader'] } });

test('community field renders and stops moving for reduced motion', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('.community-field');
  await canvas.scrollIntoViewIfNeeded();
  await expect(canvas).toHaveAttribute('data-renderer', 'webgl');
  await expect(canvas).toHaveAttribute('data-rendered', 'true');
  const waveTime = () => canvas.evaluate((el: HTMLCanvasElement) => {
    const gl = el.getContext('webgl')!;
    const program = gl.getParameter(gl.CURRENT_PROGRAM);
    return gl.getUniform(program, gl.getUniformLocation(program, 'waveTime'));
  });
  const before = await waveTime();
  await expect.poll(waveTime).toBeGreaterThan(before);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(canvas).toHaveAttribute('data-progress', '1.000');
  const stopped = await waveTime();
  await page.waitForTimeout(150);
  expect(await waveTime()).toBe(stopped);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.locator('.community-artwork').scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});

test('community keeps a visible background and foreground when WebGL is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
      if (type === 'webgl') return null;
      return Reflect.apply(getContext, this, [type, ...args]);
    } as typeof getContext;
  });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.locator('.community-artwork').scrollIntoViewIfNeeded();
  await expect(page.locator('.community-field')).toHaveAttribute('data-renderer', 'static');
  await expect(page.locator('.community-field-fallback')).toBeVisible();
  await page.locator('.community-foreground').evaluate((image: HTMLImageElement) => image.decode());
  await expect(page.locator('.community-foreground')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});
