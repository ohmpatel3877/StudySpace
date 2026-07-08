# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: combinations.spec.ts >> T3: Cross-Feature Combinations >> T3_COMB_1: Editor File Saving + Theme Engine Accents (NOTE + THEME)
- Location: tests\combinations.spec.ts:9:3

# Error details

```
Error: expect(locator).toHaveClass(expected) failed

Locator: locator('[data-testid="toast-notification"]')
Expected pattern: /border-violet-500/
Error: strict mode violation: locator('[data-testid="toast-notification"]') resolved to 2 elements:
    1) <div class="toast border-violet-500" data-testid="toast-notification">Configurations saved successfully.</div> aka getByText('Configurations saved')
    2) <div class="toast border-violet-500" data-testid="toast-notification">File saved successfully.</div> aka getByText('File saved successfully.')

Call log:
  - Expect "toHaveClass" with timeout 5000ms
  - waiting for locator('[data-testid="toast-notification"]')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - heading "StudySpace" [level=3] [ref=e4]
      - button "Workspace" [ref=e5] [cursor=pointer]
      - button "D2L Calendar" [ref=e6] [cursor=pointer]
      - button "Settings" [ref=e7] [cursor=pointer]
      - separator [ref=e8]
      - generic [ref=e9]:
        - heading "Files" [level=5] [ref=e10]
        - generic [ref=e11]:
          - generic [ref=e12] [cursor=pointer]: welcome.md
          - generic [ref=e13] [cursor=pointer]: homework.md
          - generic [ref=e14] [cursor=pointer]: syllabus.pdf
          - generic [ref=e15] [cursor=pointer]: gear.stl
          - generic [ref=e16] [cursor=pointer]: solver.cpp
          - generic [ref=e17] [cursor=pointer]: document.docx
          - generic [ref=e18] [cursor=pointer]: spreadsheet.xlsx
          - generic [ref=e19] [cursor=pointer]: presentation.pptx
          - generic [ref=e20] [cursor=pointer]: zero.docx
          - generic [ref=e21] [cursor=pointer]: corrupt.docx
          - generic [ref=e22] [cursor=pointer]: large.pptx
        - generic [ref=e23]:
          - textbox "newfile.md" [ref=e24]
          - button "Add" [ref=e25] [cursor=pointer]
    - generic [ref=e26]:
      - generic [ref=e27]:
        - generic [ref=e28]:
          - heading "welcome.md" [level=4] [ref=e29]
          - generic [ref=e30]:
            - button "Preview" [ref=e31] [cursor=pointer]
            - button "Save" [active] [ref=e32] [cursor=pointer]
        - textbox "Type Markdown here..." [ref=e33]: "# Welcome StudySpace is active!"
      - generic [ref=e35]:
        - generic [ref=e36]:
          - heading "Resource Viewer" [level=4] [ref=e37]
          - button "Open in Default App" [ref=e39] [cursor=pointer]
        - generic [ref=e41]: Markdown file loaded. Preview using the editor toolbar.
  - generic [ref=e42]:
    - generic [ref=e43]: Configurations saved successfully.
    - generic [ref=e44]: File saved successfully.
```

# Test source

```ts
  1   | import { expect } from '@playwright/test';
  2   | import { test } from './mocks/tauri-ipc-mock';
  3   | 
  4   | test.describe('T3: Cross-Feature Combinations', () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await page.goto('/');
  7   |   });
  8   | 
  9   |   test('T3_COMB_1: Editor File Saving + Theme Engine Accents (NOTE + THEME)', async ({ page }) => {
  10  |     // 1. Colored Glass Mode (Violet Accent)
  11  |     await page.locator('[data-testid="tab-settings"]').click();
  12  |     await page.locator('[data-testid="theme-select"]').selectOption('Colored Glass Mode');
  13  |     await page.locator('[data-testid="save-settings-btn"]').click();
  14  |     
  15  |     await page.locator('[data-testid="tab-workspace"]').click();
  16  |     await page.locator('[data-testid="file-item-welcome.md"]').click();
  17  |     await page.locator('[data-testid="save-button"]').click();
  18  |     
  19  |     const toast1 = page.locator('[data-testid="toast-notification"]');
> 20  |     await expect(toast1).toHaveClass(/border-violet-500/);
      |                          ^ Error: expect(locator).toHaveClass(expected) failed
  21  | 
  22  |     // 2. AMOLED Mode (Cyan Accent)
  23  |     await page.locator('[data-testid="tab-settings"]').click();
  24  |     await page.locator('[data-testid="theme-select"]').selectOption('AMOLED Mode');
  25  |     await page.locator('[data-testid="save-settings-btn"]').click();
  26  |     
  27  |     await page.locator('[data-testid="tab-workspace"]').click();
  28  |     await page.locator('[data-testid="save-button"]').click();
  29  |     
  30  |     const toast2 = page.locator('[data-testid="toast-notification"]');
  31  |     await expect(toast2).toHaveClass(/border-cyan-400/);
  32  |   });
  33  | 
  34  |   test('T3_COMB_2: D2L Settings Controls + Modular Toggle Synchronization (SYNC + TOGGLE)', async ({ page }) => {
  35  |     await page.locator('[data-testid="tab-settings"]').click();
  36  |     await expect(page.locator('[data-testid="d2l-feed-url-input"]')).toBeVisible();
  37  | 
  38  |     // Toggle D2L off
  39  |     await page.locator('[data-testid="toggle-d2l-sync"]').click(); // disable
  40  |     await page.locator('[data-testid="save-settings-btn"]').click();
  41  | 
  42  |     await expect(page.locator('[data-testid="d2l-feed-url-input"]')).toBeHidden();
  43  | 
  44  |     // Toggle D2L on
  45  |     await page.locator('[data-testid="toggle-d2l-sync"]').click(); // enable
  46  |     await page.locator('[data-testid="save-settings-btn"]').click();
  47  | 
  48  |     await expect(page.locator('[data-testid="d2l-feed-url-input"]')).toBeVisible();
  49  |   });
  50  | 
  51  |   test('T3_COMB_3: Three.js WebGL Resize + Split Pane Drag Interaction (CORE + VIEW)', async ({ page }) => {
  52  |     await page.locator('[data-testid="file-item-gear.stl"]').click();
  53  |     await expect(page.locator('[data-testid="three-canvas"]')).toBeVisible();
  54  | 
  55  |     const canvas = page.locator('[data-testid="three-canvas"]');
  56  |     const boxBefore = await canvas.boundingBox();
  57  |     expect(boxBefore).not.toBeNull();
  58  | 
  59  |     // Perform Resizer Drag
  60  |     const resizer = page.locator('[data-testid="split-pane-resizer"]');
  61  |     const resizerBox = await resizer.boundingBox();
  62  |     expect(resizerBox).not.toBeNull();
  63  | 
  64  |     if (resizerBox && boxBefore) {
  65  |       await page.mouse.move(resizerBox.x + resizerBox.width / 2, resizerBox.y + resizerBox.height / 2);
  66  |       await page.mouse.down();
  67  |       await page.mouse.move(resizerBox.x - 100, resizerBox.y + resizerBox.height / 2);
  68  |       await page.mouse.up();
  69  |     }
  70  | 
  71  |     const boxAfter = await canvas.boundingBox();
  72  |     expect(boxAfter).not.toBeNull();
  73  |     if (boxBefore && boxAfter) {
  74  |       expect(boxAfter.width).not.toEqual(boxBefore.width);
  75  |     }
  76  |   });
  77  | 
  78  |   test('T3_COMB_4: Markdown Text Editing Focus + Active 3D Render Loop (NOTE + VIEW)', async ({ page }) => {
  79  |     await page.locator('[data-testid="file-item-gear.stl"]').click();
  80  |     await page.locator('[data-testid="auto-rotate-toggle"]').check();
  81  |     
  82  |     // Load a markdown file
  83  |     await page.locator('[data-testid="file-item-welcome.md"]').click();
  84  |     const textarea = page.locator('[data-testid="markdown-textarea"]');
  85  |     
  86  |     await textarea.focus();
  87  |     await textarea.type('Adding text during rotation.');
  88  |     
  89  |     // Verify focus is held
  90  |     await expect(textarea).toBeFocused();
  91  |   });
  92  | 
  93  |   test('T3_COMB_5: D2L Event Copy-to-Editor Clipboard Operation (NOTE + SYNC)', async ({ page }) => {
  94  |     // Load Markdown file in editor
  95  |     await page.locator('[data-testid="file-item-welcome.md"]').click();
  96  |     const textarea = page.locator('[data-testid="markdown-textarea"]');
  97  |     
  98  |     // Sync events
  99  |     await page.locator('[data-testid="tab-d2l"]').click();
  100 |     await page.locator('[data-testid="d2l-sync-button"]').click();
  101 |     
  102 |     // Click Copy Reference on Calculus event
  103 |     await page.locator('.btn-copy-event').first().click();
  104 |     
  105 |     // Verify reference is inserted
  106 |     await expect(textarea).toHaveValue(/Calculus Midterm/);
  107 |   });
  108 | 
  109 |   test('T3_COMB_6: Toggle Feature + File Explorer Extensions Filter (NOTE + TOGGLE + VIEW)', async ({ page }) => {
  110 |     // Check files initial
  111 |     await expect(page.locator('[data-testid="file-item-gear.stl"]')).toBeVisible();
  112 | 
  113 |     // Disable CAD
  114 |     await page.locator('[data-testid="tab-settings"]').click();
  115 |     await page.locator('[data-testid="toggle-cad-viewer"]').click();
  116 |     await page.locator('[data-testid="save-settings-btn"]').click();
  117 |     
  118 |     // Back to Workspace, CAD file should be disabled
  119 |     await page.locator('[data-testid="tab-workspace"]').click();
  120 |     await expect(page.locator('[data-testid="file-item-gear.stl-disabled"]')).toBeVisible();
```