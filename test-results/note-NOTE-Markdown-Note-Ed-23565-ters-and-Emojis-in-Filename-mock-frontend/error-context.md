# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: note.spec.ts >> NOTE: Markdown Note Editor & File Explorer >> T2_NOTE_3: Special Characters and Emojis in Filename
- Location: tests\note.spec.ts:77:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="file-item-notes_#_@_漢_🚀.md"]')
Expected: visible
Error: strict mode violation: locator('[data-testid="file-item-notes_#_@_漢_🚀.md"]') resolved to 2 elements:
    1) <div class="file-item selected" data-testid="file-item-notes_#_@_漢_🚀.md">notes_#_@_漢_🚀.md</div> aka getByTestId('file-item-notes_#_@_漢_🚀.md').first()
    2) <div class="file-item selected" data-testid="file-item-notes_#_@_漢_🚀.md">notes_#_@_漢_🚀.md</div> aka getByTestId('file-item-notes_#_@_漢_🚀.md').nth(1)

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('[data-testid="file-item-notes_#_@_漢_🚀.md"]')

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
          - generic [ref=e23] [cursor=pointer]: notes_#_@_漢_🚀.md
          - generic [ref=e24] [cursor=pointer]: notes_#_@_漢_🚀.md
        - generic [ref=e25]:
          - textbox "newfile.md" [ref=e26]
          - button "Add" [active] [ref=e27] [cursor=pointer]
    - generic [ref=e28]:
      - generic [ref=e29]:
        - generic [ref=e30]:
          - heading "notes_#_@_漢_🚀.md" [level=4] [ref=e31]
          - generic [ref=e32]:
            - button "Preview" [ref=e33] [cursor=pointer]
            - button "Save" [ref=e34] [cursor=pointer]
        - textbox "Type Markdown here..." [ref=e35]
      - generic [ref=e37]:
        - generic [ref=e38]:
          - heading "Resource Viewer" [level=4] [ref=e39]
          - button "Open in Default App" [ref=e41] [cursor=pointer]
        - generic [ref=e43]: Markdown file loaded. Preview using the editor toolbar.
  - generic [ref=e45]: File notes_#_@_漢_🚀.md created.
```

# Test source

```ts
  1   | import { expect } from '@playwright/test';
  2   | import { test } from './mocks/tauri-ipc-mock';
  3   | 
  4   | test.describe('NOTE: Markdown Note Editor & File Explorer', () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await page.goto('/');
  7   |   });
  8   | 
  9   |   test('T1_NOTE_1: Sidebar Explorer Populates File Tree', async ({ page }) => {
  10  |     await expect(page.locator('[data-testid="file-item-welcome.md"]')).toBeVisible();
  11  |     await expect(page.locator('[data-testid="file-item-homework.md"]')).toBeVisible();
  12  |     await expect(page.locator('[data-testid="file-item-syllabus.pdf"]')).toBeVisible();
  13  |   });
  14  | 
  15  |   test('T1_NOTE_2: Selecting Markdown File Loads into Editor', async ({ page }) => {
  16  |     await page.locator('[data-testid="file-item-welcome.md"]').click();
  17  |     await expect(page.locator('[data-testid="markdown-textarea"]')).toHaveValue(/# Welcome/);
  18  |   });
  19  | 
  20  |   test('T1_NOTE_3: Editor File Editing & Save Operation', async ({ page }) => {
  21  |     await page.locator('[data-testid="file-item-welcome.md"]').click();
  22  |     const textarea = page.locator('[data-testid="markdown-textarea"]');
  23  |     await textarea.fill('# Edited welcome file');
  24  |     await page.locator('[data-testid="save-button"]').click();
  25  |     
  26  |     // Check toast notification
  27  |     await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/File saved successfully/);
  28  | 
  29  |     // Verify stored content in window state
  30  |     const savedContent = await page.evaluate(() => (window as any).__MOCK_STATE__.contents['/vault/welcome.md']);
  31  |     expect(savedContent).toBe('# Edited welcome file');
  32  |   });
  33  | 
  34  |   test('T1_NOTE_4: Title/Filename Rendering in Header', async ({ page }) => {
  35  |     await page.locator('[data-testid="file-item-homework.md"]').click();
  36  |     await expect(page.locator('[data-testid="editor-header-title"]')).toHaveText('homework.md');
  37  |   });
  38  | 
  39  |   test('T1_NOTE_5: Live Markdown Rendering Toggle (Edit vs Preview)', async ({ page }) => {
  40  |     await page.locator('[data-testid="file-item-welcome.md"]').click();
  41  |     
  42  |     // Toggle to Preview
  43  |     await page.locator('[data-testid="preview-toggle"]').click();
  44  |     await expect(page.locator('[data-testid="markdown-textarea"]')).toBeHidden();
  45  |     await expect(page.locator('[data-testid="markdown-preview"]')).toBeVisible();
  46  |     await expect(page.locator('[data-testid="markdown-preview"] >> h1')).toHaveText('Welcome');
  47  | 
  48  |     // Toggle back to Edit
  49  |     await page.locator('[data-testid="preview-toggle"]').click();
  50  |     await expect(page.locator('[data-testid="markdown-textarea"]')).toBeVisible();
  51  |     await expect(page.locator('[data-testid="markdown-preview"]')).toBeHidden();
  52  |   });
  53  | 
  54  |   test('T2_NOTE_1: Large Document Performance Stress Test', async ({ page }) => {
  55  |     const hugeText = '# Large Doc\n' + 'Line text content\n'.repeat(500);
  56  |     await page.evaluate((text) => {
  57  |       (window as any).__MOCK_STATE__.contents['/vault/welcome.md'] = text;
  58  |     }, hugeText);
  59  |     
  60  |     await page.locator('[data-testid="file-item-welcome.md"]').click();
  61  |     await expect(page.locator('[data-testid="markdown-textarea"]')).toHaveValue(hugeText);
  62  |   });
  63  | 
  64  |   test('T2_NOTE_2: Concurrent File Modifications Handling', async ({ page }) => {
  65  |     await page.locator('[data-testid="file-item-welcome.md"]').click();
  66  |     
  67  |     // Simulate background file update
  68  |     await page.evaluate(() => {
  69  |       (window as any).__MOCK_STATE__.contents['/vault/welcome.md'] = '# Updated externally';
  70  |     });
  71  |     
  72  |     // Select again to load new changes
  73  |     await page.locator('[data-testid="file-item-welcome.md"]').click();
  74  |     await expect(page.locator('[data-testid="markdown-textarea"]')).toHaveValue('# Updated externally');
  75  |   });
  76  | 
  77  |   test('T2_NOTE_3: Special Characters and Emojis in Filename', async ({ page }) => {
  78  |     const specialName = 'notes_#_@_漢_🚀.md';
  79  |     await page.locator('[data-testid="new-file-name"]').fill(specialName);
  80  |     await page.locator('[data-testid="create-file-btn"]').click();
  81  |     
> 82  |     await expect(page.locator(`[data-testid="file-item-${specialName}"]`)).toBeVisible();
      |                                                                            ^ Error: expect(locator).toBeVisible() failed
  83  |     await expect(page.locator('[data-testid="editor-header-title"]')).toHaveText(specialName);
  84  |   });
  85  | 
  86  |   test('T2_NOTE_4: Write Action on Locked/Read-Only File', async ({ page }) => {
  87  |     // Add a locked file to state
  88  |     await page.addInitScript(() => {
  89  |       (window as any).__MOCK_STATE__.files.push({
  90  |         name: 'locked.md',
  91  |         path: '/vault/locked.md',
  92  |         is_dir: false,
  93  |         ext: 'md'
  94  |       });
  95  |       (window as any).__MOCK_STATE__.contents['/vault/locked.md'] = '# Read only content';
  96  |     });
  97  |     await page.reload();
  98  |     
  99  |     await page.locator('[data-testid="file-item-locked.md"]').click();
  100 |     await page.locator('[data-testid="markdown-textarea"]').fill('# Attempting modify');
  101 |     await page.locator('[data-testid="save-button"]').click();
  102 |     
  103 |     // Assert error toast is shown
  104 |     await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/Permission denied, unable to save file/);
  105 |   });
  106 | 
  107 |   test('T2_NOTE_5: Empty Folder & Blank Files Presentation', async ({ page }) => {
  108 |     // Empty the vault files list
  109 |     await page.addInitScript(() => {
  110 |       (window as any).__MOCK_STATE__.files = [];
  111 |     });
  112 |     await page.reload();
  113 |     
  114 |     await expect(page.locator('[data-testid="empty-folder-message"]')).toHaveText('No workspace files found');
  115 |   });
  116 | });
  117 | 
```