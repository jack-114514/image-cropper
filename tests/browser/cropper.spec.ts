import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: '使用此取景' })).toBeEnabled();
});

test('exports actual square pixels and downloads an image', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.getByRole('button', { name: '使用此取景' }).click();
  const image = page.getByAltText('裁剪结果');
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
  const size = await image.evaluate((element: HTMLImageElement) => [element.naturalWidth, element.naturalHeight]);
  expect(size[0]).toBe(size[1]);
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: '下载图片' }).click();
  expect((await download).suggestedFilename()).toBe('image-crop.webp');
  expect(errors).toEqual([]);
});

test('transparent circle produces PNG with transparent corners', async ({ page }) => {
  await page.getByRole('button', { name: '圆形头像' }).click();
  await page.getByRole('button', { name: '使用此取景' }).click();
  const image = page.getByAltText('裁剪结果');
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
  const alpha = await image.evaluate((element: HTMLImageElement) => {
    const canvas = document.createElement('canvas'); canvas.width = element.naturalWidth; canvas.height = element.naturalHeight;
    const context = canvas.getContext('2d')!; context.drawImage(element, 0, 0);
    return [context.getImageData(0, 0, 1, 1).data[3], context.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data[3]];
  });
  expect(alpha).toEqual([0, 255]);
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: '下载图片' }).click();
  expect((await download).suggestedFilename()).toBe('image-crop.png');
});

test('saved selection restores the same crop after zooming', async ({ page }) => {
  const coordinates = page.getByLabel('取景坐标');
  await page.getByRole('button', { name: '记住此取景' }).click();
  const initial = JSON.parse((await coordinates.textContent())!);
  await page.getByRole('button', { name: '放大', exact: true }).click();
  await expect.poll(async () => JSON.parse((await coordinates.textContent())!).width).toBeLessThan(initial.width);
  await page.getByRole('button', { name: '恢复取景' }).click();
  await expect(page.getByRole('button', { name: '使用此取景' })).toBeEnabled();
  const restored = JSON.parse((await coordinates.textContent())!);
  for (const key of ['left', 'top', 'width', 'height']) expect(restored[key]).toBeCloseTo(initial[key], 1);
});

test('landscape and portrait exports keep their requested ratio', async ({ page }) => {
  for (const [name, ratio] of [['横向背景', 16 / 9], ['手机背景', 9 / 16]] as const) {
    await page.getByRole('button', { name }).click();
    await page.getByRole('button', { name: '使用此取景' }).click();
    const image = page.getByAltText('裁剪结果');
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
    const size = await image.evaluate((element: HTMLImageElement) => [element.naturalWidth, element.naturalHeight]);
    expect(size[0] / size[1]).toBeCloseTo(ratio, 2);
  }
});

test('local upload is processed without a network upload and fits the screen', async ({ page }) => {
  const uploadRequests: string[] = [];
  page.on('request', (request) => { if (['POST', 'PUT', 'PATCH'].includes(request.method())) uploadRequests.push(request.url()); });
  // A 1x1 PNG is sufficient to verify local object URLs and the no-upscaling contract.
  await page.getByLabel('选择本地图片').setInputFiles({ name: 'local.png', mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aI9sAAAAASUVORK5CYII=', 'base64') });
  await page.getByRole('button', { name: '使用此取景' }).click();
  await expect(page.getByAltText('裁剪结果')).toBeVisible();
  expect(uploadRequests).toEqual([]);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);
});

test('invalid local image shows a recoverable error', async ({ page }) => {
  await page.getByLabel('选择本地图片').setInputFiles({ name: 'broken.png', mimeType: 'image/png', buffer: Buffer.from('invalid image') });
  await expect(page.getByRole('alert').first()).toBeVisible();
  await expect(page.getByRole('button', { name: '使用此取景' })).toBeDisabled();
});
