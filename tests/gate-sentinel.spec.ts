import { test } from './mocks/tauri-ipc-mock';
import { expect } from '@playwright/test';

/**
 * Gate self-verification.
 *
 * These tests assert properties of the TEST HARNESS, not of the product.
 * They exist because this suite previously ran against a hand-written mock
 * app in tests/mock-app/ and would have reported 115/115 green with src/
 * deleted entirely (AUDIT.md Finding 1). If the harness ever silently
 * detaches from the real app again, these fail first and loudest.
 */
test.describe('GATE: harness self-verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('GATE_1: the page under test is the real React app, not a static mock', async ({ page }) => {
    // The React app mounts into #root via src/main.tsx. The deleted mock app
    // hand-wrote its DOM directly into <body> with no root container.
    await expect(page.locator('#root')).toBeAttached();
    const rootChildCount = await page.locator('#root > *').count();
    expect(rootChildCount).toBeGreaterThan(0);

    // The built bundle is served from /assets/ by vite preview. A static mock
    // app would have no hashed module bundle.
    const scriptSrcs = await page.locator('script[type="module"]').evaluateAll(
      (els) => els.map((e) => (e as HTMLScriptElement).src)
    );
    expect(scriptSrcs.some((s) => s.includes('/assets/'))).toBe(true);
  });

  test('GATE_2: src/ reaches the backend through the Tauri 2 invoke boundary', async ({ page }) => {
    // Tauri 2's global. If the app were falling through to its localStorage
    // fallback (AUDIT.md Finding 2), invoke would never be called and
    // commandsLog would stay empty.
    const hasInternals = await page.evaluate(
      () => typeof (window as any).__TAURI_INTERNALS__?.invoke === 'function'
    );
    expect(hasInternals).toBe(true);

    // The Tauri 1 global must NOT be what the app depends on.
    const hasLegacyGlobal = await page.evaluate(
      () => typeof (window as any).__TAURI_IPC__ !== 'undefined'
    );
    expect(hasLegacyGlobal).toBe(false);

    // commandsLog is appended to only inside the mock's invoke handler, so a
    // non-empty log proves src/ actually crossed the IPC boundary on boot.
    const log = await page.evaluate(
      () => ((window as any).__MOCK_STATE__?.commandsLog ?? []).map((e: any) => e.cmd)
    );
    expect(log).toContain('load_settings');
    expect(log).toContain('get_vault_files');
  });

  test('GATE_3: rendered content originates from backend data, not hardcoded markup', async ({ page }) => {
    // Mutate the backing store, reload, and confirm the UI follows. A static
    // page or a UI reading hardcoded fixtures would not change.
    await page.evaluate(() => {
      const state = (window as any).__MOCK_STATE__;
      state.files = [
        { name: 'gate_probe.md', path: '/vault/gate_probe.md', is_dir: false, ext: 'md' },
      ];
      state.contents['/vault/gate_probe.md'] = '# Gate Probe';
    });
    await page.reload();

    await expect(page.locator('[data-testid="file-item-gate_probe.md"]')).toBeVisible();
  });
});
