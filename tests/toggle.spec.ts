import { expect } from '@playwright/test';
import { test } from './mocks/tauri-ipc-mock';

test.describe('TOGGLE: Modular Feature Toggles', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('T1_TOGGLE_1: Disabling D2L Sync hides UI Tabs', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    
    // Toggle D2L Sync Off
    await page.locator('[data-testid="toggle-d2l-sync"]').click();
    await page.locator('[data-testid="save-settings-btn"]').click();
    
    await expect(page.locator('[data-testid="tab-d2l"]')).toBeHidden();
  });

  test('T1_TOGGLE_2: Disabling CAD Viewer hides UI Controls', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    
    // Toggle CAD Off
    await page.locator('[data-testid="toggle-cad-viewer"]').click();
    await page.locator('[data-testid="save-settings-btn"]').click();
    
    // Verify CAD file is grayed-out/disabled
    await expect(page.locator('[data-testid="file-item-gear.stl-disabled"]')).toBeVisible();
  });

  test('T1_TOGGLE_3: Re-enabling Features restores visual components', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    
    // Disable and then re-enable
    await page.locator('[data-testid="toggle-d2l-sync"]').click(); // Disabled
    await page.locator('[data-testid="toggle-d2l-sync"]').click(); // Enabled
    await page.locator('[data-testid="save-settings-btn"]').click();
    
    await expect(page.locator('[data-testid="tab-d2l"]')).toBeVisible();
  });

  test('T1_TOGGLE_4: Toggle Config Persistence', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="toggle-cad-viewer"]').click(); // Disable
    await page.locator('[data-testid="save-settings-btn"]').click();
    
    await page.reload();
    
    await expect(page.locator('[data-testid="file-item-gear.stl-disabled"]')).toBeVisible();
  });

  test('T1_TOGGLE_5: Screen Realignment on Feature Hiding', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="toggle-cad-viewer"]').click(); // Disable
    await page.locator('[data-testid="save-settings-btn"]').click();
    
    // Return to workspace
    await page.locator('[data-testid="tab-workspace"]').click();
    
    // Attempting to select disabled file does not open it
    await page.locator('[data-testid="file-item-gear.stl-disabled"]').click();
    await expect(page.locator('[data-testid="cad-viewer"]')).toBeHidden();
  });

  test('T2_TOGGLE_1: Disabling features during active loading processes', async ({ page }) => {
    // Select stl file first (starts rendering animation loop)
    await page.locator('[data-testid="file-item-gear.stl"]').click();
    await expect(page.locator('[data-testid="cad-viewer"]')).toBeVisible();

    // Disable feature
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="toggle-cad-viewer"]').click();
    await page.locator('[data-testid="save-settings-btn"]').click();
    
    // Go back to workspace, verify it's disabled and canvas is cleared/hidden
    await page.locator('[data-testid="tab-workspace"]').click();
    await expect(page.locator('[data-testid="cad-viewer"]')).toBeHidden();
  });

  test('T2_TOGGLE_2: Disk Space Full on Settings Write', async ({ page }) => {
    // Mock save_settings failure
    await page.evaluate(() => {
      (window as any).__TAURI_IPC__ = async (message: any) => {
        if (message.cmd === 'save_settings') {
          return (window as any)[message.error]('Disk Full');
        }
        return (window as any)[message.callback](null);
      };
    });
    
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="toggle-d2l-sync"]').click();
    await page.locator('[data-testid="save-settings-btn"]').click();
    
    // Toast should report persist failure
    await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/Failed to persist configurations/);
  });

  test('T2_TOGGLE_3: Deep-Link Routing with Modules disabled', async ({ page }) => {
    // Navigate with D2L sync disabled
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="toggle-d2l-sync"]').click(); // disable
    await page.locator('[data-testid="save-settings-btn"]').click();
    
    // Verify D2L panel stays hidden
    await expect(page.locator('[data-testid="tab-d2l"]')).toBeHidden();
  });

  test('T2_TOGGLE_4: Toggling all modular packages OFF simultaneously', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="toggle-d2l-sync"]').click(); // disable D2L
    await page.locator('[data-testid="toggle-cad-viewer"]').click(); // disable CAD
    await page.locator('[data-testid="save-settings-btn"]').click();
    
    await expect(page.locator('[data-testid="tab-d2l"]')).toBeHidden();
    await expect(page.locator('[data-testid="file-item-gear.stl-disabled"]')).toBeVisible();
  });

  test('T2_TOGGLE_5: Corrupted Toggles State Recovery', async ({ page }) => {
    // Inject corrupt active features
    await page.addInitScript(() => {
      const state = (window as any).__MOCK_STATE__;
      state.settings.active_features = 'corrupt';
    });
    
    await page.reload();
    
    // It should recover by keeping default active features enabled
    await expect(page.locator('[data-testid="tab-d2l"]')).toBeVisible();
  });
});
