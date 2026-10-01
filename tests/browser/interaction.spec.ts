import { test, expect } from '@playwright/test';

test('circle resizes from its circumference', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '圆形头像' }).click();
  await expect(page.getByRole('button', { name: '使用此取景' })).toBeEnabled();
  const coordinates = page.getByLabel('取景坐标');
  const initial = JSON.parse((await coordinates.textContent())!);
  const ring = page.locator('.image-cropper__circle-ring');
  await ring.scrollIntoViewIfNeeded();
  const rect = (await ring.boundingBox())!;
  const x = rect.x + rect.width * .985;
  const y = rect.y + rect.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(x - rect.width * .1, y, { steps: 5 }); await page.mouse.up();
  await expect.poll(async () => JSON.parse((await coordinates.textContent())!).width).toBeLessThan(initial.width - 1);
});

test('selection at the preview edge keeps panning until released', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: '使用此取景' })).toBeEnabled();
  const zoom = page.getByRole('button', { name: '放大', exact: true });
  for (let n = 0; n < 4; n++) await zoom.click();
  const stencil = page.locator('.advanced-cropper-rectangle-stencil');
  await stencil.scrollIntoViewIfNeeded();
  const rect = (await stencil.boundingBox())!;
  const stage = (await page.locator('.image-cropper__stage').boundingBox())!;
  const coordinates = page.getByLabel('取景坐标');
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.mouse.down();
  await page.mouse.move(stage.x + stage.width + 15, rect.y + rect.height / 2, { steps: 5 });
  const during = JSON.parse((await coordinates.textContent())!);
  await expect.poll(async () => JSON.parse((await coordinates.textContent())!).left).toBeGreaterThan(during.left + 0.05);
  await page.mouse.up();
  const released = JSON.parse((await coordinates.textContent())!);
  // Let several animation frames pass to detect a loop that incorrectly survives pointer-up.
  await page.evaluate(() => new Promise<void>((resolve) => {
    let frames = 0; const tick = () => ++frames > 8 ? resolve() : requestAnimationFrame(tick); requestAnimationFrame(tick);
  }));
  expect(JSON.parse((await coordinates.textContent())!).left).toBeCloseTo(released.left, 4);
});

test('JPEG export reports the actual output type', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: '使用此取景' })).toBeEnabled();
  await page.getByLabel('图片格式').selectOption('image/jpeg');
  await page.getByRole('button', { name: '使用此取景' }).click();
  await expect(page.getByAltText('裁剪结果')).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: '下载图片' }).click();
  expect((await download).suggestedFilename()).toBe('image-crop.jpg');
});
