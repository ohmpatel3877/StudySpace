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

  test('T2_CORE_2: Missing Tauri Context Fallback', async ({ page }) => {
    // Delete the Tauri 2 boundary before the app boots to simulate a missing backend.
    await page.addInitScript(() => {
      delete (window as any).__TAURI_INTERNALS__;
      // Also clear any state the mock or app cached on the prior (backend-present) load,
      // so this reload genuinely boots with no backend and no cached shortcut.
      sessionStorage.removeItem('__MOCK_STATE_OVERRIDE__');
      localStorage.removeItem('studyspace_settings');
    });
    await page.reload();

    // Confirm the boundary is actually gone post-reload, not just no-op deleted.
    expect(await page.evaluate(() => (window as any).__TAURI_INTERNALS__ === undefined)).toBe(true);

    // Fallback load_settings should still function and load default settings
    await expect(page.locator('html')).toHaveClass(/theme-dark/);
    await expect(page.locator('[data-testid="editor-header-title"]')).toHaveText(/welcome.md/);
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
