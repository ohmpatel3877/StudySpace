# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: theme.spec.ts >> THEME: Custom Theme Engine >> T1_THEME_4: Theme Selection Persistence
- Location: tests\theme.spec.ts:33:3

# Error details

```
Error: expect(locator).toHaveClass(expected) failed

Locator: locator('html')
Expected pattern: /theme-light/
Received string:  "theme-dark"
Timeout: 5000ms

Call log:
  - Expect "toHaveClass" with timeout 5000ms
  - waiting for locator('html')
    13 × locator resolved to <html lang="en" class="theme-dark">…</html>
       - unexpected value "theme-dark"

```

```yaml
- document:
  - heading "StudySpace" [level=3]
  - button "Workspace"
  - button "D2L Calendar"
  - button "Settings"
  - separator
  - heading "Files" [level=5]
  - text: welcome.md homework.md syllabus.pdf gear.stl solver.cpp document.docx spreadsheet.xlsx presentation.pptx zero.docx corrupt.docx large.pptx
  - textbox "newfile.md"
  - button "Add"
  - heading "welcome.md" [level=4]
  - button "Preview"
  - button "Save"
  - textbox "Type Markdown here...": "# Welcome StudySpace is active!"
  - heading "Resource Viewer" [level=4]
  - button "Open in Default App"
  - text: Markdown file loaded. Preview using the editor toolbar.
```

# Test source

```ts
  1   | import { expect } from '@playwright/test';
  2   | import { test } from './mocks/tauri-ipc-mock';
  3   | 
  4   | test.describe('THEME: Custom Theme Engine', () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await page.goto('/');
  7   |   });
  8   | 
  9   |   test('T1_THEME_1: Light Mode Styling Switch', async ({ page }) => {
  10  |     await page.locator('[data-testid="tab-settings"]').click();
  11  |     await page.locator('[data-testid="theme-select"]').selectOption('Light Mode');
  12  |     await page.locator('[data-testid="save-settings-btn"]').click();
  13  |     
  14  |     await expect(page.locator('html')).toHaveClass(/theme-light/);
  15  |   });
  16  | 
  17  |   test('T1_THEME_2: AMOLED Preset Application', async ({ page }) => {
  18  |     await page.locator('[data-testid="tab-settings"]').click();
  19  |     await page.locator('[data-testid="theme-select"]').selectOption('AMOLED Mode');
  20  |     await page.locator('[data-testid="save-settings-btn"]').click();
  21  |     
  22  |     await expect(page.locator('html')).toHaveClass(/theme-amoled/);
  23  |   });
  24  | 
  25  |   test('T1_THEME_3: Custom Palette Variable Injection', async ({ page }) => {
  26  |     await page.locator('[data-testid="tab-settings"]').click();
  27  |     await page.locator('[data-testid="theme-select"]').selectOption('Colored Glass Mode');
  28  |     await page.locator('[data-testid="save-settings-btn"]').click();
  29  |     
  30  |     await expect(page.locator('html')).toHaveClass(/theme-colored-glass/);
  31  |   });
  32  | 
  33  |   test('T1_THEME_4: Theme Selection Persistence', async ({ page }) => {
  34  |     await page.locator('[data-testid="tab-settings"]').click();
  35  |     await page.locator('[data-testid="theme-select"]').selectOption('Light Mode');
  36  |     await page.locator('[data-testid="save-settings-btn"]').click();
  37  |     
  38  |     await page.reload();
> 39  |     await expect(page.locator('html')).toHaveClass(/theme-light/);
      |                                        ^ Error: expect(locator).toHaveClass(expected) failed
  40  |   });
  41  | 
  42  |   test('T1_THEME_5: Accessibility Contrast Evaluation', async ({ page }) => {
  43  |     await page.locator('[data-testid="tab-settings"]').click();
  44  |     
  45  |     const themes = ['Light Mode', 'AMOLED Mode', 'Colored Glass Mode', 'Dark Mode'];
  46  |     for (const t of themes) {
  47  |       await page.locator('[data-testid="theme-select"]').selectOption(t);
  48  |       await page.locator('[data-testid="save-settings-btn"]').click();
  49  |       
  50  |       const html = page.locator('html');
  51  |       await expect(html).toBeVisible();
  52  |     }
  53  |   });
  54  | 
  55  |   test('T2_THEME_1: Swapping Theme during active 3D CAD rotation', async ({ page }) => {
  56  |     await page.locator('[data-testid="file-item-gear.stl"]').click();
  57  |     await page.locator('[data-testid="auto-rotate-toggle"]').check();
  58  |     
  59  |     // Switch theme
  60  |     await page.locator('[data-testid="tab-settings"]').click();
  61  |     await page.locator('[data-testid="theme-select"]').selectOption('AMOLED Mode');
  62  |     await page.locator('[data-testid="save-settings-btn"]').click();
  63  |     
  64  |     await expect(page.locator('html')).toHaveClass(/theme-amoled/);
  65  |     // Verify 3D canvas rendering is still active
  66  |     await expect(page.locator('[data-testid="canvas-status"]')).toHaveText('WebGL Context Active');
  67  |   });
  68  | 
  69  |   test('T2_THEME_2: Theme file configuration Read Failure', async ({ page }) => {
  70  |     // Mock load_settings failure
  71  |     await page.addInitScript(() => {
  72  |       (window as any).__TAURI_IPC__ = async (message: any) => {
  73  |         if (message.cmd === 'load_settings') {
  74  |           return (window as any)[message.error]('Failed to read config file');
  75  |         }
  76  |         return (window as any)[message.callback](null);
  77  |       };
  78  |     });
  79  |     
  80  |     await page.reload();
  81  |     
  82  |     // Check that it defaulted to Dark Mode class
  83  |     await expect(page.locator('html')).toHaveClass(/theme-dark/);
  84  |   });
  85  | 
  86  |   test('T2_THEME_3: Rapid-Click Theme Toggle Stress Test', async ({ page }) => {
  87  |     await page.locator('[data-testid="tab-settings"]').click();
  88  |     const select = page.locator('[data-testid="theme-select"]');
  89  |     
  90  |     // Swift sequential changes
  91  |     await select.selectOption('Light Mode');
  92  |     await select.selectOption('AMOLED Mode');
  93  |     await select.selectOption('Colored Glass Mode');
  94  |     await page.locator('[data-testid="save-settings-btn"]').click();
  95  |     
  96  |     await expect(page.locator('html')).toHaveClass(/theme-colored-glass/);
  97  |   });
  98  | 
  99  |   test('T2_THEME_4: Theme Contrast in High Contrast Accessibility Modes', async ({ page }) => {
  100 |     // Emulate forced-colors: active CSS media feature
  101 |     await page.emulateMedia({ forcedColors: 'active' });
  102 |     await page.reload();
  103 |     
  104 |     // Toast should show context alert or settings remain robust
  105 |     await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
  106 |   });
  107 | 
  108 |   test('T2_THEME_5: Settings Theme Injection Guard', async ({ page }) => {
  109 |     await page.addInitScript(() => {
  110 |       const state = (window as any).__MOCK_STATE__;
  111 |       state.settings.theme = '"><script>window.__xss_hacked__ = true;</script>';
  112 |     });
  113 |     
  114 |     await page.reload();
  115 |     
  116 |     const hacked = await page.evaluate(() => (window as any).__xss_hacked__);
  117 |     expect(hacked).toBeUndefined();
  118 |   });
  119 | });
  120 | 
```