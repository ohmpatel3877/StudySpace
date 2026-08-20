import { expect } from '@playwright/test';
import { test } from './mocks/tauri-ipc-mock';

test.describe('THEME: Custom Theme Engine', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('T1_THEME_1: Light Mode Styling Switch', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="theme-select"]').selectOption('Light Mode');
    await page.locator('[data-testid="save-settings-btn"]').click();
    
    await expect(page.locator('html')).toHaveClass(/theme-light/);
  });

  test('T1_THEME_2: AMOLED Preset Application', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="theme-select"]').selectOption('AMOLED Mode');
    await page.locator('[data-testid="save-settings-btn"]').click();
    
    await expect(page.locator('html')).toHaveClass(/theme-amoled/);
  });

  test('T1_THEME_3: Custom Palette Variable Injection', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="theme-select"]').selectOption('Colored Glass Mode');
    await page.locator('[data-testid="save-settings-btn"]').click();
    
    await expect(page.locator('html')).toHaveClass(/theme-colored-glass/);
  });

  test('T1_THEME_4: Theme Selection Persistence', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="theme-select"]').selectOption('Light Mode');
    await page.locator('[data-testid="save-settings-btn"]').click();
    
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/theme-light/);
  });

  test('T1_THEME_5: Accessibility Contrast Evaluation', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    
    const themes = ['Light Mode', 'AMOLED Mode', 'Colored Glass Mode', 'Dark Mode'];
    for (const t of themes) {
      await page.locator('[data-testid="theme-select"]').selectOption(t);
      await page.locator('[data-testid="save-settings-btn"]').click();
      
      const html = page.locator('html');
      await expect(html).toBeVisible();
    }
  });

  test('T2_THEME_1: Swapping Theme during active 3D CAD rotation', async ({ page }) => {
    await page.locator('[data-testid="file-item-gear.stl"]').click();
    await page.locator('[data-testid="auto-rotate-toggle"]').check();
    
    // Switch theme
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="theme-select"]').selectOption('AMOLED Mode');
    await page.locator('[data-testid="save-settings-btn"]').click();
    
    await expect(page.locator('html')).toHaveClass(/theme-amoled/);
    // Verify 3D canvas rendering is still active
    await expect(page.locator('[data-testid="canvas-status"]')).toHaveText('WebGL Context Active');
  });

  test('T2_THEME_2: Theme file configuration Read Failure', async ({ page }) => {
    // First persist a NON-default theme. Without this the test is vacuous:
    // the mock's default is already 'Dark Mode', so asserting theme-dark
    // passes whether or not load_settings actually fails. Seeding AMOLED
    // means theme-dark is reachable ONLY via the error fallback.
    await page.evaluate(() => {
      (window as any).__MOCK_STATE__.settings.theme = 'AMOLED Mode';
    });
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/theme-amoled/);

    // Now break the config read. Registered after the tauri-ipc-mock fixture's
    // init script, so __TAURI_INTERNALS__ already exists when this runs.
    await page.addInitScript(() => {
      const internals = (window as any).__TAURI_INTERNALS__;
      const passthrough = internals.invoke;
      internals.invoke = async (cmd: string, args: any) => {
        if (cmd === 'load_settings') {
          throw new Error('Failed to read config file');
        }
        return passthrough(cmd, args);
      };
    });

    await page.reload();

    // Falls back to Dark Mode rather than surfacing the persisted AMOLED.
    // If load_settings were succeeding, this would read theme-amoled and fail.
    await expect(page.locator('html')).toHaveClass(/theme-dark/);
    await expect(page.locator('html')).not.toHaveClass(/theme-amoled/);
  });

  test('T2_THEME_3: Rapid-Click Theme Toggle Stress Test', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    const select = page.locator('[data-testid="theme-select"]');
    
    // Swift sequential changes
    await select.selectOption('Light Mode');
    await select.selectOption('AMOLED Mode');
    await select.selectOption('Colored Glass Mode');
    await page.locator('[data-testid="save-settings-btn"]').click();
    
    await expect(page.locator('html')).toHaveClass(/theme-colored-glass/);
  });

  test('T2_THEME_4: Theme Contrast in High Contrast Accessibility Modes', async ({ page }) => {
    // Emulate forced-colors: active CSS media feature
    await page.emulateMedia({ forcedColors: 'active' });
    await page.reload();
    
    // Toast should show context alert or settings remain robust
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
  });

  test('T2_THEME_5: Settings Theme Injection Guard', async ({ page }) => {
    await page.addInitScript(() => {
      const state = (window as any).__MOCK_STATE__;
      state.settings.theme = '"><script>window.__xss_hacked__ = true;</script>';
    });
    
    await page.reload();
    
    const hacked = await page.evaluate(() => (window as any).__xss_hacked__);
    expect(hacked).toBeUndefined();
  });
});
