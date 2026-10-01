import { test, expect } from '@playwright/test';

test('English upload, transparent export and downloads work', async ({ page }) => {
  const uploads: string[] = [];
  page.on('request', (request) => { if (['POST', 'PUT', 'PATCH'].includes(request.method())) uploads.push(request.url()); });
  await page.goto('/?lang=en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: 'Find the right frame.' })).toBeVisible();
  await page.getByLabel('Choose a local image').setInputFiles({ name: 'local.png', mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aI9sAAAAASUVORK5CYII=', 'base64') });
  await page.getByRole('button', { name: 'Circle avatar' }).click();
  await expect(page.getByLabel('Transparent circle PNG')).toBeChecked();
  await page.getByRole('button', { name: 'Use this crop' }).click();
  await expect(page.getByAltText('Cropped image')).toBeVisible();
  const imageDownload = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download image' }).click();
  expect((await imageDownload).suggestedFilename()).toBe('image-crop.png');
  const jsonDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download coordinates' }).click();
  expect((await jsonDownload).suggestedFilename()).toBe('crop-selection.json');
  expect(uploads).toEqual([]);
});

test('language switching preserves crop, preview and restoration', async ({ page }) => {
  await page.goto('/?lang=en');
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await page.getByRole('button', { name: 'Remember this crop' }).click();
  const initial = await page.getByLabel('Crop coordinates').textContent();
  await page.getByRole('button', { name: 'Use this crop' }).click();
  const preview = await page.getByAltText('Cropped image').getAttribute('src');
  const source = await page.locator('.advanced-cropper img').first().getAttribute('src');
  await page.getByRole('button', { name: '中文', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  expect(await page.getByLabel('取景坐标').textContent()).toBe(initial);
  expect(await page.getByAltText('裁剪结果').getAttribute('src')).toBe(preview);
  expect(await page.locator('.advanced-cropper img').first().getAttribute('src')).toBe(source);
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await page.getByRole('button', { name: 'Restore crop' }).click();
  await expect(page.getByRole('button', { name: 'Use this crop' })).toBeEnabled();
  const restored = JSON.parse((await page.getByLabel('Crop coordinates').textContent())!);
  for (const key of ['left', 'top', 'width', 'height']) expect(restored[key]).toBeCloseTo(JSON.parse(initial!)[key], 1);
});

test('stored preference survives reload and URL language overrides it', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await expect(page).toHaveURL(/lang=en/);
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Use this crop' })).toBeEnabled();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.goto('/?lang=zh-CN');
  await expect(page.getByRole('button', { name: '使用此取景' })).toBeEnabled();
});

test('existing component and upload errors translate when switching', async ({ page }) => {
  await page.goto('/?lang=zh-CN');
  await page.getByLabel('选择本地图片').setInputFiles({ name: 'broken.png', mimeType: 'image/png', buffer: Buffer.from('invalid') });
  await expect(page.locator('.image-cropper__error')).toBeVisible();
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await expect(page.locator('.image-cropper__error')).toContainText('Cannot load this image.');
  await expect(page.locator('.demo__error')).toContainText('Image processing failed.');
  await page.getByLabel('Choose a local image').setInputFiles({ name: 'text.txt', mimeType: 'text/plain', buffer: Buffer.from('invalid') });
  await expect(page.locator('.demo__error')).toHaveText('Choose a JPEG, PNG, WebP or GIF image.');
  await page.getByRole('button', { name: '中文', exact: true }).click();
  await expect(page.locator('.demo__error')).toHaveText('请选择 JPEG、PNG、WebP 或 GIF 图片。');
});

test('English layout fits desktop and mobile without Chinese text', async ({ page }, info) => {
  await page.goto('/?lang=en');
  await expect(page.getByRole('button', { name: 'Use this crop' })).toBeEnabled();
  await expect(page.locator('.advanced-cropper-wrapper__fade')).toHaveCSS('opacity', '1');
  expect((await page.locator('body').innerText()).replace('中文', '')).not.toMatch(/[\u3400-\u9fff]/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.screenshot({ path: `test-results/${info.project.name}-english.png`, fullPage: true });
  await page.getByRole('button', { name: 'Remember this crop' }).click();
  await expect(page.getByRole('button', { name: 'Restore crop' })).toBeEnabled();
});

test.describe('browser language defaults', () => {
  test.use({ locale: 'en-US' });
  test('English browsers open the English demo without a query', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('button', { name: 'Use this crop' })).toBeEnabled();
  });
});
