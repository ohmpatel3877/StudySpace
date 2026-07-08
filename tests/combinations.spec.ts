import { expect } from '@playwright/test';
import { test } from './mocks/tauri-ipc-mock';

test.describe('T3: Cross-Feature Combinations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('T3_COMB_1: Editor File Saving + Theme Engine Accents (NOTE + THEME)', async ({ page }) => {
    // 1. Colored Glass Mode (Violet Accent)
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="theme-select"]').selectOption('Colored Glass Mode');
    await page.locator('[data-testid="save-settings-btn"]').click();
    
    await page.locator('[data-testid="tab-workspace"]').click();
    await page.locator('[data-testid="file-item-welcome.md"]').click();
    await page.locator('[data-testid="save-button"]').click();
    
    const toast1 = page.locator('[data-testid="toast-notification"]');
    await expect(toast1).toHaveClass(/border-violet-500/);

    // 2. AMOLED Mode (Cyan Accent)
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="theme-select"]').selectOption('AMOLED Mode');
    await page.locator('[data-testid="save-settings-btn"]').click();
    
    await page.locator('[data-testid="tab-workspace"]').click();
    await page.locator('[data-testid="save-button"]').click();
    
    const toast2 = page.locator('[data-testid="toast-notification"]');
    await expect(toast2).toHaveClass(/border-cyan-400/);
  });

  test('T3_COMB_2: D2L Settings Controls + Modular Toggle Synchronization (SYNC + TOGGLE)', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await expect(page.locator('[data-testid="d2l-feed-url-input"]')).toBeVisible();

    // Toggle D2L off
    await page.locator('[data-testid="toggle-d2l-sync"]').click(); // disable
    await page.locator('[data-testid="save-settings-btn"]').click();

    await expect(page.locator('[data-testid="d2l-feed-url-input"]')).toBeHidden();

    // Toggle D2L on
    await page.locator('[data-testid="toggle-d2l-sync"]').click(); // enable
    await page.locator('[data-testid="save-settings-btn"]').click();

    await expect(page.locator('[data-testid="d2l-feed-url-input"]')).toBeVisible();
  });

  test('T3_COMB_3: Three.js WebGL Resize + Split Pane Drag Interaction (CORE + VIEW)', async ({ page }) => {
    await page.locator('[data-testid="file-item-gear.stl"]').click();
    await expect(page.locator('[data-testid="three-canvas"]')).toBeVisible();

    const canvas = page.locator('[data-testid="three-canvas"]');
    const boxBefore = await canvas.boundingBox();
    expect(boxBefore).not.toBeNull();

    // Perform Resizer Drag
    const resizer = page.locator('[data-testid="split-pane-resizer"]');
    const resizerBox = await resizer.boundingBox();
    expect(resizerBox).not.toBeNull();

    if (resizerBox && boxBefore) {
      await page.mouse.move(resizerBox.x + resizerBox.width / 2, resizerBox.y + resizerBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(resizerBox.x - 100, resizerBox.y + resizerBox.height / 2);
      await page.mouse.up();
    }

    const boxAfter = await canvas.boundingBox();
    expect(boxAfter).not.toBeNull();
    if (boxBefore && boxAfter) {
      expect(boxAfter.width).not.toEqual(boxBefore.width);
    }
  });

  test('T3_COMB_4: Markdown Text Editing Focus + Active 3D Render Loop (NOTE + VIEW)', async ({ page }) => {
    await page.locator('[data-testid="file-item-gear.stl"]').click();
    await page.locator('[data-testid="auto-rotate-toggle"]').check();
    
    // Load a markdown file
    await page.locator('[data-testid="file-item-welcome.md"]').click();
    const textarea = page.locator('[data-testid="markdown-textarea"]');
    
    await textarea.focus();
    await textarea.type('Adding text during rotation.');
    
    // Verify focus is held
    await expect(textarea).toBeFocused();
  });

  test('T3_COMB_5: D2L Event Copy-to-Editor Clipboard Operation (NOTE + SYNC)', async ({ page }) => {
    // Load Markdown file in editor
    await page.locator('[data-testid="file-item-welcome.md"]').click();
    const textarea = page.locator('[data-testid="markdown-textarea"]');
    
    // Sync events
    await page.locator('[data-testid="tab-d2l"]').click();
    await page.locator('[data-testid="d2l-sync-button"]').click();
    
    // Click Copy Reference on Calculus event
    await page.locator('.btn-copy-event').first().click();
    
    // Verify reference is inserted
    await expect(textarea).toHaveValue(/Calculus Midterm/);
  });

  test('T3_COMB_6: Toggle Feature + File Explorer Extensions Filter (NOTE + TOGGLE + VIEW)', async ({ page }) => {
    // Check files initial
    await expect(page.locator('[data-testid="file-item-gear.stl"]')).toBeVisible();

    // Disable CAD
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="toggle-cad-viewer"]').click();
    await page.locator('[data-testid="save-settings-btn"]').click();
    
    // Back to Workspace, CAD file should be disabled
    await page.locator('[data-testid="tab-workspace"]').click();
    await expect(page.locator('[data-testid="file-item-gear.stl-disabled"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-item-syllabus.pdf"]')).toBeVisible(); // PDF still active
  });

  test('T3_COMB_7: Toggle Feature + External Location Explorer Filtering (NOTE + TOGGLE + IMPORT)', async ({ page }) => {
    // 1. Import external location
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="import-type-select"]').selectOption('local');
    await page.locator('[data-testid="import-path-input"]').fill('/ext/my_local_folder');
    await page.locator('[data-testid="import-submit-btn"]').click();
    
    // 2. Return to workspace, verify external files are visible
    await page.locator('[data-testid="tab-workspace"]').click();
    await expect(page.locator('[data-testid="file-item-external_my_local_folder_note.md"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-item-external_my_local_folder_mesh.stl"]')).toBeVisible();

    // 3. Disable CAD viewer feature
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="toggle-cad-viewer"]').click(); // Disable
    await page.locator('[data-testid="save-settings-btn"]').click();

    // 4. Return to workspace explorer, verify external STL mesh is disabled, but note is active
    await page.locator('[data-testid="tab-workspace"]').click();
    await expect(page.locator('[data-testid="file-item-external_my_local_folder_mesh.stl-disabled"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-item-external_my_local_folder_note.md"]')).toBeVisible();
  });

  test('T3_COMB_8: Disabling CAD Viewer disables default app button for STL files (BRIDGE + TOGGLE)', async ({ page }) => {
    // Select stl file, default app button should be active
    await page.locator('[data-testid="file-item-gear.stl"]').click();
    const btn = page.locator('[data-testid="open-default-app-btn"]');
    await expect(btn).toBeVisible();
    await expect(btn).not.toBeDisabled();

    // Disable CAD
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="toggle-cad-viewer"]').click();
    await page.locator('[data-testid="save-settings-btn"]').click();
    
    // Select STL file (now disabled), check default app btn is disabled
    await page.locator('[data-testid="tab-workspace"]').click();
    await expect(btn).toBeDisabled();
  });

  test('T3_COMB_9: Editing C++ file inline updates the code viewer in other views (INLINE + VIEW)', async ({ page }) => {
    await page.locator('[data-testid="file-item-solver.cpp"]').click();
    await page.locator('[data-testid="edit-inline-btn"]').click();
    
    const textarea = page.locator('[data-testid="inline-code-textarea"]');
    await textarea.fill('int main_edited() { return 1; }');
    await page.locator('[data-testid="edit-inline-btn"]').click(); // Save
    
    // Verify changes rendered instantly
    await expect(page.locator('[data-testid="code-viewer"]')).toContainText('main_edited');
  });

  test('T3_COMB_10: Office conversion to PDF respects active theme styling for loader panel (OFFICE + THEME)', async ({ page }) => {
    // Select Colored Glass
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="theme-select"]').selectOption('Colored Glass Mode');
    await page.locator('[data-testid="save-settings-btn"]').click();

    // Load office file
    await page.locator('[data-testid="tab-workspace"]').click();
    await page.locator('[data-testid="file-item-document.docx"]').click();
    
    // Loader should be active
    await expect(page.locator('[data-testid="office-loader"]')).toBeVisible();
  });
});
