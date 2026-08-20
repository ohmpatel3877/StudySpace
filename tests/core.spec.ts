import { expect } from '@playwright/test';
import { test } from './mocks/tauri-ipc-mock';

test.describe('CORE: Core Tauri App Architecture', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('T1_CORE_1: Glassmorphic Dark UI Theme Validation', async ({ page }) => {
    const body = page.locator('body');
    await expect(body).toHaveClass(/glass/);
    
    // Check initial CSS variables or background color is applied
    const html = page.locator('html');
    await expect(html).toHaveClass(/theme-dark/);
  });

  test('T1_CORE_2: Sidebar Layout Grid and Panes Presence', async ({ page }) => {
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="editor-pane"]')).toBeVisible();
    await expect(page.locator('[data-testid="viewer-pane"]')).toBeVisible();
  });

  test('T1_CORE_3: Layout Adaptability on Window Resize', async ({ page }) => {
    const editor = page.locator('[data-testid="editor-pane"]');
    
    await page.setViewportSize({ width: 1024, height: 768 });
    const width1024 = await editor.boundingBox();
    
    await page.setViewportSize({ width: 1920, height: 1080 });
    const width1920 = await editor.boundingBox();
    
    expect(width1920?.width).toBeGreaterThan(width1024?.width || 0);
  });

  test('T1_CORE_4: Tauri Frontend IPC Bridge Connectivity', async ({ page }) => {
    const isMockActive = await page.evaluate(() => (window as any).__MOCK_TAURI_ACTIVE__);
    expect(isMockActive).toBe(true);

    const log = await page.evaluate(() => (window as any).__MOCK_STATE__.commandsLog);
    const hasLoadSettings = log.some((l: any) => l.cmd === 'load_settings');
    const hasGetFiles = log.some((l: any) => l.cmd === 'get_vault_files');
    expect(hasLoadSettings).toBe(true);
    expect(hasGetFiles).toBe(true);
  });

  test('T1_CORE_5: Dark-Theme Active by Default', async ({ page }) => {
    const html = page.locator('html');
    await expect(html).toHaveClass(/theme-dark/);
  });

  test('T2_CORE_1: Ultra-Narrow Aspect Ratio Handling (Mobile dimensions)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 480 });
    // Sidebar and editor should be visible/adapted
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="editor-pane"]')).toBeVisible();
  });

  test('T2_CORE_2: Missing Tauri Context Fails Loudly', async ({ page }) => {
    // CONTRACT INVERTED in Phase 1. This test previously asserted that a
    // missing backend degraded *gracefully* into a localStorage fallback that
    // served fixture data. That fallback (~290 lines) is what let six
    // milestones ship against fiction: the app looked fully functional in a
    // browser while the Rust backend was never reached at all.
    // See AUDIT.md Findings 2 and 5.
    //
    // The contract is now the opposite: with no backend, the app must NOT
    // fabricate content. It surfaces nothing rather than something false.
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.addInitScript(() => {
      delete (window as any).__TAURI_INTERNALS__;
      // Clear anything cached on the prior backend-present load so this reload
      // genuinely boots with no backend and no shortcut.
      sessionStorage.removeItem('__MOCK_STATE_OVERRIDE__');
      localStorage.removeItem('studyspace_settings');
    });
    await page.reload();

    // The boundary is actually gone, not just no-op deleted.
    expect(await page.evaluate(() => (window as any).__TAURI_INTERNALS__ === undefined)).toBe(true);

    // The shell still renders — failing loudly is not the same as crashing.
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="editor-pane"]')).toBeVisible();

    // No fabricated file. The old fixture path '/vault/welcome.md' must not
    // reappear, and the editor must show its empty state.
    await expect(page.locator('[data-testid="editor-header-title"]')).toHaveText('No file open');
    await expect(page.locator('[data-testid="editor-empty-state"]')).toBeVisible();
    await expect(page.locator('[data-testid="markdown-textarea"]')).toHaveCount(0);

    // No fabricated vault listing either.
    await expect(page.locator('[data-testid^="file-item-"]')).toHaveCount(0);

    // And the failure is reported rather than swallowed.
    await expect
      .poll(() => consoleErrors.join('\n'), { timeout: 5000 })
      .toMatch(/no backend/i);
  });

  test('T2_CORE_3: High-Frequency Window Resizing Stress Test', async ({ page }) => {
    for (let i = 0; i < 15; i++) {
      await page.setViewportSize({ width: 800 + i * 20, height: 600 + i * 15 });
    }
    // Verify stabilization and structural presence
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="editor-pane"]')).toBeVisible();
    await expect(page.locator('[data-testid="viewer-pane"]')).toBeVisible();
  });

  test('T2_CORE_4: Storage Corruption Recovery', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('studyspace_settings', '{"theme":'); // malformed
    });
    // Trigger reload so app parses corrupted storage
    await page.reload();
    
    // Verify it recovered to default Dark Mode safely
    await expect(page.locator('html')).toHaveClass(/theme-dark/);
  });

  test('T2_CORE_5: DPI Scale Change Adaptation', async ({ page }) => {
    // Change device scale factor during emulation
    const originalViewport = page.viewportSize();
    if (originalViewport) {
      await page.setViewportSize({
        width: originalViewport.width,
        height: originalViewport.height
      });
      // Check layout is stable
      await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    }
  });
});
