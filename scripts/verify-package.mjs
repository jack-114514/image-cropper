import { mkdtempSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run this script with npm run verify:package.');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
function npm(args, cwd) {
  const result = spawnSync(process.execPath, [npmCli, ...args], { cwd, stdio: 'inherit', windowsHide: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
npm(['pack'], root);
for (const version of ['18.3.1', pkg.devDependencies.react]) {
  const consumer = mkdtempSync(join(tmpdir(), 'image-cropper-consumer-'));
  const tarball = `${pkg.name}-${pkg.version}.tgz`;
  copyFileSync(resolve(root, tarball), join(consumer, tarball));
  writeFileSync(join(consumer, 'package.json'), JSON.stringify({
    private: true, type: 'module', scripts: { build: 'tsc --noEmit && vite build', smoke: 'node smoke.mjs' },
    dependencies: { 'image-cropper': `file:./${tarball}`, react: version, 'react-dom': version },
    devDependencies: { vite: pkg.devDependencies.vite, typescript: pkg.devDependencies.typescript,
      '@types/react': pkg.devDependencies['@types/react'], '@types/react-dom': pkg.devDependencies['@types/react-dom'] },
  }, null, 2));
  writeFileSync(join(consumer, 'tsconfig.json'), JSON.stringify({ compilerOptions: {
    target: 'ES2022', lib: ['ES2022', 'DOM'], module: 'ESNext', moduleResolution: 'Bundler', jsx: 'react-jsx',
    strict: true, skipLibCheck: true, esModuleInterop: true, noEmit: true,
  }, include: ['main.tsx'] }));
  writeFileSync(join(consumer, 'index.html'), '<html><body><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>');
  writeFileSync(join(consumer, 'main.tsx'), `
import { createElement, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { ImageCropper } from 'image-cropper';
import type { ImageCropperHandle, CropResult } from 'image-cropper';
import 'image-cropper/style.css';
function App() {
  const ref = useRef<ImageCropperHandle>(null);
  return <ImageCropper ref={ref} src="" locale="en" aspectRatio={16 / 9}
    onConfirm={async (result: CropResult) => { console.log(result.mimeType, result.selection.width); }} />;
}
createRoot(document.getElementById('root')!).render(createElement(App));
`);
  writeFileSync(join(consumer, 'smoke.mjs'), `
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { ImageCropper, normalizeSelection } from 'image-cropper';
const html = renderToString(createElement(ImageCropper, { src: '', locale: 'en' }));
if (!html.includes('Choose an image first')) throw new Error('Independent consumer render failed.');
if (normalizeSelection({left:0,top:0,width:100,height:100}).width !== 100) throw new Error('Helper export missing.');
console.log('Independent package import and server render passed.');
`);
  npm(['install', '--no-audit', '--no-fund'], consumer);
  npm(['run', 'build'], consumer);
  npm(['run', 'smoke'], consumer);
  console.log(`Fresh consumer passed on React ${version}.`);
}
