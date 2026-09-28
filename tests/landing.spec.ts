import { test, expect } from './fixtures';

test('previews cycle every four seconds and manual selection resets the timer', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
  await page.goto('/');
  const workspace = page.getByRole('tab', { name: 'Workspace', exact: true });
  await expect(workspace).toHaveAttribute('aria-selected', 'true');
  // Establish a fresh four-second period, including when reselecting the active tab.
  await workspace.click();
  await page.clock.fastForward(3999);
  await expect(workspace).toHaveAttribute('aria-selected', 'true');
  await page.clock.fastForward(1);
  await expect(page.getByRole('tabpanel', { name: 'Prism AI' })).toBeVisible();
  await page.clock.fastForward(4000);
  await expect(page.getByRole('tabpanel', { name: 'Contract Intelligence' })).toBeVisible();
  await page.clock.fastForward(4000);
  await expect(page.getByRole('tabpanel', { name: 'Workspace', exact: true })).toBeVisible();
  await page.clock.fastForward(3500);
  await workspace.click();
  await page.clock.fastForward(3999);
  await expect(workspace).toHaveAttribute('aria-selected', 'true');
  await page.clock.fastForward(1);
  await expect(page.getByRole('tabpanel', { name: 'Prism AI' })).toBeVisible();
});

test('tabs switch the product preview without moving the page', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('tab', { name: 'Workspace', exact: true })).toHaveAttribute('aria-selected', 'true');
  const stage = page.locator('.preview-stage');
  const initial = await stage.boundingBox();
  for (const label of ['Prism AI', 'Contract Intelligence', 'Workspace']) {
    await page.getByRole('tab', { name: label, exact: true }).click();
    const panel = page.getByRole('tabpanel', { name: label, exact: true });
    await expect(panel).toBeVisible();
    await expect(page.getByRole('tabpanel')).toHaveCount(1);
    await expect(panel.locator('.product-preview')).toHaveJSProperty('complete', true);
    expect(await panel.locator('.product-preview').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
    expect((await stage.boundingBox())?.height).toBe(initial?.height);
  }
  expect(errors).toEqual([]);
});

test('keyboard navigation wraps and respects Home and End', async ({ page }) => {
  await page.goto('/');
  const workspace = page.getByRole('tab', { name: 'Workspace', exact: true });
  await workspace.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('tab', { name: 'Contract Intelligence' })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(workspace).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tabpanel', { name: 'Prism AI' })).toBeVisible();
  await page.keyboard.press('End');
  await expect(page.getByRole('tabpanel', { name: 'Contract Intelligence' })).toBeVisible();
  await page.keyboard.press('Home');
  await expect(workspace).toBeFocused();
  await expect(workspace).toHaveAttribute('aria-selected', 'true');
});

test('calls to action point to the project and its team', async ({ page }) => {
  await page.goto('/');
  const github = 'https://github.com/FuturixAI-and-Quantum-Works/Prism-Legal-OS';
  await expect(page.getByRole('link', { name: 'GitHub', exact: true })).toHaveAttribute('href', github);
  await expect(page.getByRole('link', { name: 'View Prism on GitHub', exact: true })).toHaveAttribute('href', github);
  await expect(page.getByRole('link', { name: 'Talk to Us', exact: true })).toHaveAttribute('href', 'https://www.futurixai.com/contact');
  await expect(page.getByRole('link', { name: 'Explore on GitHub', exact: true })).toHaveAttribute('href', github);
  await expect(page.getByRole('link', { name: 'Talk to Our Team', exact: true })).toHaveAttribute('href', 'https://www.futurixai.com/contact');
  const githubLinks = page.locator('a[href*="github.com"]');
  await expect(githubLinks).toHaveCount(13);
  const hrefs = await githubLinks.evaluateAll((nodes) => nodes.map((node) => (node as HTMLAnchorElement).getAttribute('href')));
  expect(hrefs.every((href) => href === github)).toBe(true);
});

test('mobile layout fits the viewport and all three tabs work', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  for (const label of ['Workspace', 'Prism AI', 'Contract Intelligence']) {
    await page.getByRole('tab', { name: label, exact: true }).click();
    await expect(page.getByRole('tabpanel', { name: label, exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  }
  const firstStep = page.locator('.step-organize');
  await firstStep.focus();
  await expect(firstStep.getByRole('tooltip')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});

test('feature accordion switches descriptions and previews with mouse and keyboard', async ({ page }) => {
  await page.goto('/');
  const section = page.getByRole('region', { name: 'Introducing Prism', exact: true });
  await section.getByRole('button', { name: 'Collaboration', exact: true }).click();
  await expect(section.getByRole('region', { name: 'Collaboration', exact: true })).toContainText('Bring the whole team into the conversation.');
  await expect(section.getByRole('region')).toHaveCount(1);
  await expect(section.locator('.feature-preview .trail-foreground')).toHaveAttribute('src', '/assets/feature-3-foreground.svg');
  await section.getByRole('button', { name: 'Contract Management', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(section.getByRole('region', { name: 'Contract Management', exact: true })).toBeVisible();
  await page.setViewportSize({ width: 375, height: 812 });
  await section.getByRole('button', { name: 'Workflow Automation', exact: true }).click();
  const panel = section.getByRole('region', { name: 'Workflow Automation', exact: true });
  await expect(panel.getByRole('img')).toBeVisible();
  await panel.getByRole('img').evaluate((img: HTMLImageElement) => img.decode());
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
