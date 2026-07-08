import { expect } from '@playwright/test';
import { test } from './mocks/tauri-ipc-mock';

test.describe('T4: Real-World Application Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('T4_SCENARIO_1: Late-Night Study Session Setup (CORE + NOTE + VIEW + THEME)', async ({ page }) => {
    // 1. Settings -> AMOLED Mode
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="theme-select"]').selectOption('AMOLED Mode');
    await page.locator('[data-testid="save-settings-btn"]').click();
    
    // 2. Load homework.md
    await page.locator('[data-testid="tab-workspace"]').click();
    await page.locator('[data-testid="file-item-homework.md"]').click();
    await expect(page.locator('[data-testid="editor-header-title"]')).toHaveText('homework.md');

    // 3. Drag resizer
    const resizer = page.locator('[data-testid="split-pane-resizer"]');
    const resizerBox = await resizer.boundingBox();
    if (resizerBox) {
      await page.mouse.move(resizerBox.x + resizerBox.width / 2, resizerBox.y + resizerBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(resizerBox.x - 50, resizerBox.y + resizerBox.height / 2);
      await page.mouse.up();
    }

    // 4. Load gear.stl
    await page.locator('[data-testid="file-item-gear.stl"]').click();
    await expect(page.locator('[data-testid="cad-viewer"]')).toBeVisible();

    // 5. Toggle editor preview
    await page.locator('[data-testid="file-item-homework.md"]').click();
    await page.locator('[data-testid="preview-toggle"]').click(); // Preview
    await expect(page.locator('[data-testid="markdown-preview"]')).toBeVisible();
    
    await page.locator('[data-testid="preview-toggle"]').click(); // Edit
    const textarea = page.locator('[data-testid="markdown-textarea"]');
    await textarea.fill('Late night conclusion text.');
    await page.locator('[data-testid="save-button"]').click();

    // 6. Reload and check persistence
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/theme-amoled/);
    await page.locator('[data-testid="file-item-homework.md"]').click();
    await expect(page.locator('[data-testid="markdown-textarea"]')).toHaveValue('Late night conclusion text.');
  });

  test('T4_SCENARIO_2: Weekly Coursework Planning & Code Analysis (SYNC + NOTE + VIEW + TOGGLE)', async ({ page }) => {
    // 1. D2L Sync
    await page.locator('[data-testid="tab-d2l"]').click();
    await page.locator('[data-testid="d2l-sync-button"]').click();
    await expect(page.locator('[data-testid="d2l-event-item"]')).toHaveCount(2);

    // 2. Select file & copy reference
    await page.locator('[data-testid="tab-workspace"]').click();
    await page.locator('[data-testid="file-item-homework.md"]').click();
    
    await page.locator('[data-testid="tab-d2l"]').click();
    await page.locator('.btn-copy-event').last().click(); // physics report
    
    // 3. Load solver.cpp code highlighting
    await page.locator('[data-testid="tab-workspace"]').click();
    await page.locator('[data-testid="file-item-solver.cpp"]').click();
    await expect(page.locator('[data-testid="code-viewer"]')).toBeVisible();

    // 4. Edit homework.md note
    await page.locator('[data-testid="file-item-homework.md"]').click();
    const textarea = page.locator('[data-testid="markdown-textarea"]');
    await textarea.type('\nAdded code commentary.');
    await page.locator('[data-testid="save-button"]').click();

    // 5. Disable D2L Sync
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="toggle-d2l-sync"]').click(); // disable
    await page.locator('[data-testid="save-settings-btn"]').click();
    
    // 6. Verify D2L tab disappears but files are intact
    await expect(page.locator('[data-testid="tab-d2l"]')).toBeHidden();
    await page.locator('[data-testid="tab-workspace"]').click();
    await expect(page.locator('[data-testid="file-item-homework.md"]')).toBeVisible();
  });

  test('T4_SCENARIO_3: Distraction-free Markdown Writing Space (CORE + NOTE + TOGGLE + THEME)', async ({ page }) => {
    // 1. Settings -> Disable D2L & CAD
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="toggle-cad-viewer"]').click();
    await page.locator('[data-testid="toggle-d2l-sync"]').click();
    
    // 2. Select Colored Glass theme
    await page.locator('[data-testid="theme-select"]').selectOption('Colored Glass Mode');
    await page.locator('[data-testid="save-settings-btn"]').click();
    await expect(page.locator('html')).toHaveClass(/theme-colored-glass/);

    // 3. Create history_essay.md
    await page.locator('[data-testid="tab-workspace"]').click();
    await page.locator('[data-testid="new-file-name"]').fill('history_essay.md');
    await page.locator('[data-testid="create-file-btn"]').click();
    await expect(page.locator('[data-testid="editor-header-title"]')).toHaveText('history_essay.md');

    // 4. Fill paragraphs
    const essayContent = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.\n\nFourth paragraph.\n\nFifth paragraph.';
    await page.locator('[data-testid="markdown-textarea"]').fill(essayContent);
    
    // 5. Preview
    await page.locator('[data-testid="preview-toggle"]').click();
    await expect(page.locator('[data-testid="markdown-preview"]')).toContainText('First paragraph.');
    await page.locator('[data-testid="preview-toggle"]').click();
    await page.locator('[data-testid="save-button"]').click();

    // 6. Reload and verify settings persist
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/theme-colored-glass/);
    await expect(page.locator('[data-testid="tab-d2l"]')).toBeHidden();
    await page.locator('[data-testid="file-item-history_essay.md"]').click();
    await expect(page.locator('[data-testid="markdown-textarea"]')).toHaveValue(essayContent);
  });

  test('T4_SCENARIO_4: Project Presentation Asset Check (CORE + NOTE + VIEW + THEME)', async ({ page }) => {
    // 1. Click syllabus.pdf
    await page.locator('[data-testid="file-item-syllabus.pdf"]').click();
    await expect(page.locator('[data-testid="pdf-iframe"]')).toBeVisible();

    // 2. Open homework.md
    await page.locator('[data-testid="file-item-homework.md"]').click();

    // 3. Theme Light Mode
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="theme-select"]').selectOption('Light Mode');
    await page.locator('[data-testid="save-settings-btn"]').click();
    await expect(page.locator('html')).toHaveClass(/theme-light/);

    // 4. Select gear.stl
    await page.locator('[data-testid="tab-workspace"]').click();
    await page.locator('[data-testid="file-item-gear.stl"]').click();
    await expect(page.locator('[data-testid="cad-viewer"]')).toBeVisible();

    // 5. Back to PDF
    await page.locator('[data-testid="file-item-syllabus.pdf"]').click();
    await expect(page.locator('[data-testid="pdf-iframe"]')).toBeVisible();

    // 6. Save delivery note
    await page.locator('[data-testid="file-item-homework.md"]').click();
    const textarea = page.locator('[data-testid="markdown-textarea"]');
    await textarea.fill('Presentation review comment.');
    await page.locator('[data-testid="save-button"]').click();
  });

  test('T4_SCENARIO_5: Fresh User Initialization & Settings Workspace Setup (CORE + THEME + TOGGLE + SYNC + NOTE + IMPORT)', async ({ page }) => {
    // Clear state
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();

    // 1. Verify default values
    await expect(page.locator('html')).toHaveClass(/theme-dark/);
    await expect(page.locator('[data-testid="tab-d2l"]')).toBeVisible();

    // 2. Select AMOLED Mode & Disable CAD Viewer & Import external location
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="theme-select"]').selectOption('AMOLED Mode');
    await page.locator('[data-testid="toggle-cad-viewer"]').click(); // Disable CAD
    await page.locator('[data-testid="d2l-feed-url-input"]').fill('https://d2l.myuniversity.edu/feed_fresh.ics');
    
    // Import location
    await page.locator('[data-testid="import-type-select"]').selectOption('local');
    await page.locator('[data-testid="import-path-input"]').fill('/ext/my_local_folder');
    await page.locator('[data-testid="import-submit-btn"]').click();
    await expect(page.locator('[data-testid="imported-locations-list"]')).toContainText('/ext/my_local_folder');
    
    await page.locator('[data-testid="save-settings-btn"]').click();

    // 3. Verify CAD disappears from explorer but imported files show
    await page.locator('[data-testid="tab-workspace"]').click();
    await expect(page.locator('[data-testid="file-item-gear.stl-disabled"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-item-external_my_local_folder_note.md"]')).toBeVisible();

    // 4. Sync calendar
    await page.locator('[data-testid="tab-d2l"]').click();
    await page.locator('[data-testid="d2l-sync-button"]').click();
    await expect(page.locator('[data-testid="d2l-event-item"]')).toHaveCount(2);

    // 5. Create new note
    await page.locator('[data-testid="tab-workspace"]').click();
    await page.locator('[data-testid="new-file-name"]').fill('Semester_Goals.md');
    await page.locator('[data-testid="create-file-btn"]').click();
    await page.locator('[data-testid="markdown-textarea"]').fill('# Semester Goals\n- Get straight As');
    await page.locator('[data-testid="save-button"]').click();

    // 6. Reload and check
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/theme-amoled/);
    await expect(page.locator('[data-testid="file-item-gear.stl-disabled"]')).toBeVisible();
    
    // Verify external files still visible
    await expect(page.locator('[data-testid="file-item-external_my_local_folder_note.md"]')).toBeVisible();
    
    await page.locator('[data-testid="tab-settings"]').click();
    await expect(page.locator('[data-testid="d2l-feed-url-input"]')).toHaveValue('https://d2l.myuniversity.edu/feed_fresh.ics');
    await expect(page.locator('[data-testid="imported-locations-list"]')).toContainText('/ext/my_local_folder');
  });
});
