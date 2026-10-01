import assert from 'node:assert/strict';
import { test } from 'node:test';
import { demoCopy, resolveDemoLocale } from '../demo/i18n.ts';

test('explicit supported URL language overrides a saved or browser language', () => {
  assert.equal(resolveDemoLocale('?lang=en', 'zh-CN', 'zh-CN'), 'en');
  assert.equal(resolveDemoLocale('?lang=zh-CN', 'en', 'en-US'), 'zh-CN');
});

test('valid saved preference wins and unsupported values fall back safely', () => {
  assert.equal(resolveDemoLocale('', 'en', 'zh-CN'), 'en');
  assert.equal(resolveDemoLocale('?lang=invalid', 'zh-CN', 'en-US'), 'zh-CN');
  assert.equal(resolveDemoLocale('?lang=fr', 'invalid', 'zh-TW'), 'zh-CN');
  assert.equal(resolveDemoLocale('', null, 'en-US'), 'en');
  assert.equal(resolveDemoLocale('', null, 'fr-FR'), 'en');
});

test('both languages provide the same nonempty translation keys', () => {
  function keys(value: Record<string, unknown>, prefix = ''): string[] {
    return Object.entries(value).flatMap(([key, entry]) => {
      const path = `${prefix}${key}`;
      if (typeof entry === 'object' && entry !== null) return keys(entry as Record<string, unknown>, `${path}.`);
      assert.equal(typeof entry, 'string');
      assert.ok((entry as string).trim(), path);
      return [path];
    }).sort();
  }
  assert.deepEqual(keys(demoCopy.en), keys(demoCopy['zh-CN']));
});
