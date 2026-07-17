import { expect } from '@playwright/test';
import { test } from './mocks/tauri-ipc-mock';

test.describe('NOTE: Markdown Note Editor & File Explorer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('T1_NOTE_1: Sidebar Explorer Populates File Tree', async ({ page }) => {
    await expect(page.locator('[data-testid="file-item-welcome.md"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-item-homework.md"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-item-syllabus.pdf"]')).toBeVisible();
  });

  test('T1_NOTE_2: Selecting Markdown File Loads into Editor', async ({ page }) => {
    await page.locator('[data-testid="file-item-welcome.md"]').click();
    await expect(page.locator('[data-testid="markdown-textarea"]')).toHaveValue(/# Welcome/);
  });

  test('T1_NOTE_3: Editor File Editing & Save Operation', async ({ page }) => {
    await page.locator('[data-testid="file-item-welcome.md"]').click();
    const textarea = page.locator('[data-testid="markdown-textarea"]');
    await textarea.fill('# Edited welcome file');
    await page.locator('[data-testid="save-button"]').click();
    
    // Check toast notification
    await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/File saved successfully/);

    // Verify stored content in window state
    const savedContent = await page.evaluate(() => (window as any).__MOCK_STATE__.contents['/vault/welcome.md']);
    expect(savedContent).toBe('# Edited welcome file');
  });

  test('T1_NOTE_4: Title/Filename Rendering in Header', async ({ page }) => {
    await page.locator('[data-testid="file-item-homework.md"]').click();
    await expect(page.locator('[data-testid="editor-header-title"]')).toHaveText('homework.md');
  });

  test('T1_NOTE_5: Live Markdown Rendering Toggle (Edit vs Preview)', async ({ page }) => {
    await page.locator('[data-testid="file-item-welcome.md"]').click();
    
    // Toggle to Preview
    await page.locator('[data-testid="preview-toggle"]').click();
    await expect(page.locator('[data-testid="markdown-textarea"]')).toBeHidden();
    await expect(page.locator('[data-testid="markdown-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="markdown-preview"] >> h1')).toHaveText('Welcome');

    // Toggle back to Edit
    await page.locator('[data-testid="preview-toggle"]').click();
    await expect(page.locator('[data-testid="markdown-textarea"]')).toBeVisible();
    await expect(page.locator('[data-testid="markdown-preview"]')).toBeHidden();
  });

  test('T2_NOTE_1: Large Document Performance Stress Test', async ({ page }) => {
    const hugeText = '# Large Doc\n' + 'Line text content\n'.repeat(500);
    await page.evaluate((text) => {
      (window as any).__MOCK_STATE__.contents['/vault/welcome.md'] = text;
    }, hugeText);
    
    await page.locator('[data-testid="file-item-welcome.md"]').click();
    await expect(page.locator('[data-testid="markdown-textarea"]')).toHaveValue(hugeText);
  });

  test('T2_NOTE_2: Concurrent File Modifications Handling', async ({ page }) => {
    await page.locator('[data-testid="file-item-welcome.md"]').click();
    
    // Simulate background file update
    await page.evaluate(() => {
      (window as any).__MOCK_STATE__.contents['/vault/welcome.md'] = '# Updated externally';
    });
    
    // Select again to load new changes
    await page.locator('[data-testid="file-item-welcome.md"]').click();
    await expect(page.locator('[data-testid="markdown-textarea"]')).toHaveValue('# Updated externally');
  });

  test('T2_NOTE_3: Special Characters and Emojis in Filename', async ({ page }) => {
    const specialName = 'notes_#_@_漢_🚀.md';
    const sanitizeForTestId = (s: string) => s.replace(/[^a-zA-Z0-9._-]/g, '_');
    await page.locator('[data-testid="new-file-name"]').fill(specialName);
    await page.locator('[data-testid="create-file-btn"]').click();
    
    await expect(page.locator(`[data-testid="file-item-${sanitizeForTestId(specialName)}"]`)).toBeVisible();
    await expect(page.locator('[data-testid="editor-header-title"]')).toHaveText(specialName);
  });

  test('T2_NOTE_4: Write Action on Locked/Read-Only File', async ({ page }) => {
    // Add a locked file to state
    await page.addInitScript(() => {
      (window as any).__MOCK_STATE__.files.push({
        name: 'locked.md',
        path: '/vault/locked.md',
        is_dir: false,
        ext: 'md'
      });
      (window as any).__MOCK_STATE__.contents['/vault/locked.md'] = '# Read only content';
    });
    await page.reload();
    
    await page.locator('[data-testid="file-item-locked.md"]').click();
    await page.locator('[data-testid="markdown-textarea"]').fill('# Attempting modify');
    await page.locator('[data-testid="save-button"]').click();
    
    // Assert error toast is shown
    await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/Permission denied, unable to save file/);
  });

  test('T2_NOTE_5: Empty Folder & Blank Files Presentation', async ({ page }) => {
    // Empty the vault files list
    await page.addInitScript(() => {
      (window as any).__MOCK_STATE__.files = [];
    });
    await page.reload();
    
    await expect(page.locator('[data-testid="empty-folder-message"]')).toHaveText('No workspace files found');
  });
});
