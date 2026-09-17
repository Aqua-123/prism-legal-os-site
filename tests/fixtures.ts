import { test as base, expect } from '@playwright/test';

// Feature tests use a returning visit; loader.spec.ts exercises first entry.
export const test = base.extend<{ returningVisit: void }>({
  returningVisit: [async ({ page }, use) => {
    await page.addInitScript(() => sessionStorage.setItem('prism-loader-visited', 'true'));
    await use();
  }, { auto: true }],
});
export { expect };
