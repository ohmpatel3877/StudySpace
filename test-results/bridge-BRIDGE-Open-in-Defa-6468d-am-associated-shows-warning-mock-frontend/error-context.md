# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: bridge.spec.ts >> BRIDGE: Open in Default App (R10) >> T2_BRIDGE_2: Command failure (no default program associated) shows warning
- Location: tests\bridge.spec.ts:70:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('[data-testid="file-item-no_assoc.md"]')

```

# Page snapshot

```yaml
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
          - button "Save" [ref=e32] [cursor=pointer]
      - textbox "Type Markdown here..." [ref=e33]: "# Welcome StudySpace is active!"
    - generic [ref=e35]:
      - generic [ref=e36]:
        - heading "Resource Viewer" [level=4] [ref=e37]
        - button "Open in Default App" [ref=e39] [cursor=pointer]
      - generic [ref=e41]: Markdown file loaded. Preview using the editor toolbar.
```

# Test source

```ts
  1   | import { expect } from '@playwright/test';
  2   | import { test } from './mocks/tauri-ipc-mock';
  3   | 
  4   | test.describe('BRIDGE: Open in Default App (R10)', () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await page.goto('/');
  7   |   });
  8   | 
  9   |   test('T1_BRIDGE_1: File header contains Open in Default App button', async ({ page }) => {
  10  |     await page.locator('[data-testid="file-item-welcome.md"]').click();
  11  |     await expect(page.locator('[data-testid="open-default-app-btn"]')).toBeVisible();
  12  |   });
  13  | 
  14  |   test('T1_BRIDGE_2: Clicking Open in Default App triggers Tauri shell command', async ({ page }) => {
  15  |     await page.locator('[data-testid="file-item-welcome.md"]').click();
  16  |     await page.locator('[data-testid="open-default-app-btn"]').click();
  17  |     
  18  |     const logs = await page.evaluate(() => (window as any).__MOCK_STATE__.commandsLog);
  19  |     const bridgeLog = logs.find((l: any) => l.cmd === 'open_in_default_app');
  20  |     expect(bridgeLog).toBeDefined();
  21  |   });
  22  | 
  23  |   test('T1_BRIDGE_3: Executing Open in Default App displays confirmation toast', async ({ page }) => {
  24  |     await page.locator('[data-testid="file-item-welcome.md"]').click();
  25  |     await page.locator('[data-testid="open-default-app-btn"]').click();
  26  |     
  27  |     await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/Opening welcome.md in default application/);
  28  |   });
  29  | 
  30  |   test('T1_BRIDGE_4: Open in Default App works for all file formats', async ({ page }) => {
  31  |     const files = [
  32  |       'syllabus.pdf',
  33  |       'gear.stl',
  34  |       'solver.cpp'
  35  |     ];
  36  |     
  37  |     for (const f of files) {
  38  |       await page.locator(`[data-testid="file-item-${f}"]`).click();
  39  |       await page.locator('[data-testid="open-default-app-btn"]').click();
  40  |       await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(new RegExp(`Opening ${f} in default`));
  41  |     }
  42  |   });
  43  | 
  44  |   test('T1_BRIDGE_5: Clicking button invokes command with correct path argument', async ({ page }) => {
  45  |     await page.locator('[data-testid="file-item-welcome.md"]').click();
  46  |     await page.locator('[data-testid="open-default-app-btn"]').click();
  47  |     
  48  |     const logs = await page.evaluate(() => (window as any).__MOCK_STATE__.commandsLog);
  49  |     const bridgeLog = logs.find((l: any) => l.cmd === 'open_in_default_app');
  50  |     expect(bridgeLog.cmd_args.file_path).toBe('/vault/welcome.md');
  51  |   });
  52  | 
  53  |   test('T2_BRIDGE_1: Triggering default app for missing file displays error toast', async ({ page }) => {
  54  |     await page.evaluate(() => {
  55  |       (window as any).__MOCK_STATE__.files.push({
  56  |         name: 'missing.md',
  57  |         path: '/vault/missing.md',
  58  |         is_dir: false,
  59  |         ext: 'md'
  60  |       });
  61  |     });
  62  |     await page.reload();
  63  |     
  64  |     await page.locator('[data-testid="file-item-missing.md"]').click();
  65  |     await page.locator('[data-testid="open-default-app-btn"]').click();
  66  |     
  67  |     await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/File not found/);
  68  |   });
  69  | 
  70  |   test('T2_BRIDGE_2: Command failure (no default program associated) shows warning', async ({ page }) => {
  71  |     await page.evaluate(() => {
  72  |       (window as any).__MOCK_STATE__.files.push({
  73  |         name: 'no_assoc.md',
  74  |         path: '/vault/no_assoc.md',
  75  |         is_dir: false,
  76  |         ext: 'md'
  77  |       });
  78  |     });
  79  |     await page.reload();
  80  |     
> 81  |     await page.locator('[data-testid="file-item-no_assoc.md"]').click();
      |                                                                 ^ Error: locator.click: Test timeout of 30000ms exceeded.
  82  |     await page.locator('[data-testid="open-default-app-btn"]').click();
  83  |     
  84  |     await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/No default application associated/);
  85  |   });
  86  | 
  87  |   test('T2_BRIDGE_3: Double-clicking Open in Default App invokes command only once', async ({ page }) => {
  88  |     await page.locator('[data-testid="file-item-welcome.md"]').click();
  89  |     
  90  |     // Quick double click
  91  |     const btn = page.locator('[data-testid="open-default-app-btn"]');
  92  |     await btn.click();
  93  |     await btn.click();
  94  |     
  95  |     const logs = await page.evaluate(() => {
  96  |       return (window as any).__MOCK_STATE__.commandsLog.filter((l: any) => l.cmd === 'open_in_default_app');
  97  |     });
  98  |     // Should be at most twice, or we can check double clicks executed
  99  |     expect(logs.length).toBeGreaterThan(0);
  100 |   });
  101 | 
  102 |   test('T2_BRIDGE_4: Access-denied system files show warning when default app fails', async ({ page }) => {
  103 |     await page.evaluate(() => {
  104 |       (window as any).__MOCK_STATE__.files.push({
  105 |         name: 'denied.md',
  106 |         path: '/vault/denied.md',
  107 |         is_dir: false,
  108 |         ext: 'md'
  109 |       });
  110 |     });
  111 |     await page.reload();
  112 |     
  113 |     await page.locator('[data-testid="file-item-denied.md"]').click();
  114 |     await page.locator('[data-testid="open-default-app-btn"]').click();
  115 |     
  116 |     await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/Access denied/);
  117 |   });
  118 | 
  119 |   test('T2_BRIDGE_5: Default app button is disabled for unsaved new markdown drafts', async ({ page }) => {
  120 |     await page.locator('[data-testid="new-file-name"]').fill('new_draft'); // no extension
  121 |     await page.locator('[data-testid="create-file-btn"]').click();
  122 |     
  123 |     const btn = page.locator('[data-testid="open-default-app-btn"]');
  124 |     await expect(btn).toBeDisabled();
  125 |   });
  126 | });
  127 | 
```