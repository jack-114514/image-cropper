import { test, expect } from '@playwright/test';

test('editor layout and lower-page buttons remain usable', async ({ page }, info) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: '使用此取景' })).toBeEnabled();
  await expect(page.locator('.advanced-cropper-wrapper__fade')).toHaveCSS('opacity', '1');
  await page.screenshot({ path: `test-results/${info.project.name}-overview.png`, fullPage: true });
  const remember = page.getByRole('button', { name: '记住此取景' });
  await remember.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => window.innerWidth)).toBe(page.viewportSize()!.width);
  await remember.click({ timeout: 5000 });
  await expect(page.getByRole('button', { name: '恢复取景' })).toBeEnabled();
});
