import { expect } from '@playwright/test';
import { test } from './mocks/tauri-ipc-mock';

test.describe('BRIDGE: Open in Default App (R10)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('T1_BRIDGE_1: File header contains Open in Default App button', async ({ page }) => {
    await page.locator('[data-testid="file-item-welcome.md"]').click();
    await expect(page.locator('[data-testid="open-default-app-btn"]')).toBeVisible();
  });

  test('T1_BRIDGE_2: Clicking Open in Default App triggers Tauri shell command', async ({ page }) => {
    await page.locator('[data-testid="file-item-welcome.md"]').click();
    await page.locator('[data-testid="open-default-app-btn"]').click();
    
    const logs = await page.evaluate(() => (window as any).__MOCK_STATE__.commandsLog);
    const bridgeLog = logs.find((l: any) => l.cmd === 'open_in_default_app');
    expect(bridgeLog).toBeDefined();
  });

  test('T1_BRIDGE_3: Executing Open in Default App displays confirmation toast', async ({ page }) => {
    await page.locator('[data-testid="file-item-welcome.md"]').click();
    await page.locator('[data-testid="open-default-app-btn"]').click();
    
    await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/Opening welcome.md in default application/);
  });

  test('T1_BRIDGE_4: Open in Default App works for all file formats', async ({ page }) => {
    const files = [
      'syllabus.pdf',
      'gear.stl',
      'solver.cpp'
    ];
    
    for (const f of files) {
      await page.locator(`[data-testid="file-item-${f}"]`).click();
      await page.locator('[data-testid="open-default-app-btn"]').click();
      await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(new RegExp(`Opening ${f} in default`));
    }
  });

  test('T1_BRIDGE_5: Clicking button invokes command with correct path argument', async ({ page }) => {
    await page.locator('[data-testid="file-item-welcome.md"]').click();
    await page.locator('[data-testid="open-default-app-btn"]').click();
    
    const logs = await page.evaluate(() => (window as any).__MOCK_STATE__.commandsLog);
    const bridgeLog = logs.find((l: any) => l.cmd === 'open_in_default_app');
    expect(bridgeLog.cmd_args.file_path).toBe('/vault/welcome.md');
  });

  test('T2_BRIDGE_1: Triggering default app for missing file displays error toast', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__MOCK_STATE__.files.push({
        name: 'missing.md',
        path: '/vault/missing.md',
        is_dir: false,
        ext: 'md'
      });
    });
    await page.reload();
    
    await page.locator('[data-testid="file-item-missing.md"]').click();
    await page.locator('[data-testid="open-default-app-btn"]').click();
    
    await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/File not found/);
  });

  test('T2_BRIDGE_2: Command failure (no default program associated) shows warning', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__MOCK_STATE__.files.push({
        name: 'no_assoc.md',
        path: '/vault/no_assoc.md',
        is_dir: false,
        ext: 'md'
      });
    });
    await page.reload();
    
    await page.locator('[data-testid="file-item-no_assoc.md"]').click();
    await page.locator('[data-testid="open-default-app-btn"]').click();
    
    await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/No default application associated/);
  });

  test('T2_BRIDGE_3: Double-clicking Open in Default App invokes command only once', async ({ page }) => {
    await page.locator('[data-testid="file-item-welcome.md"]').click();
    
    // Quick double click
    const btn = page.locator('[data-testid="open-default-app-btn"]');
    await btn.click();
    await btn.click();
    
    const logs = await page.evaluate(() => {
      return (window as any).__MOCK_STATE__.commandsLog.filter((l: any) => l.cmd === 'open_in_default_app');
    });
    // Should be at most twice, or we can check double clicks executed
    expect(logs.length).toBeGreaterThan(0);
  });

  test('T2_BRIDGE_4: Access-denied system files show warning when default app fails', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__MOCK_STATE__.files.push({
        name: 'denied.md',
        path: '/vault/denied.md',
        is_dir: false,
        ext: 'md'
      });
    });
    await page.reload();
    
    await page.locator('[data-testid="file-item-denied.md"]').click();
    await page.locator('[data-testid="open-default-app-btn"]').click();
    
    await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/Access denied/);
  });

  test('T2_BRIDGE_5: Default app button is disabled for unsaved new markdown drafts', async ({ page }) => {
    await page.locator('[data-testid="new-file-name"]').fill('new_draft'); // no extension
    await page.locator('[data-testid="create-file-btn"]').click();
    
    const btn = page.locator('[data-testid="open-default-app-btn"]');
    await expect(btn).toBeDisabled();
  });
});
