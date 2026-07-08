# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: inline.spec.ts >> INLINE: C/C++ Inline Editing (R9) >> T2_INLINE_3: Inline edit on permission-denied file displays toast error
- Location: tests\inline.spec.ts:78:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('[data-testid="file-item-locked.cpp"]')

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
  4   | test.describe('INLINE: C/C++ Inline Editing (R9)', () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await page.goto('/');
  7   |   });
  8   | 
  9   |   test('T1_INLINE_1: Viewer panel for C/C++ files includes an Edit Inline button', async ({ page }) => {
  10  |     await page.locator('[data-testid="file-item-solver.cpp"]').click();
  11  |     await expect(page.locator('[data-testid="edit-inline-btn"]')).toBeVisible();
  12  |   });
  13  | 
  14  |   test('T1_INLINE_2: Clicking Edit Inline renders a textarea with source code', async ({ page }) => {
  15  |     await page.locator('[data-testid="file-item-solver.cpp"]').click();
  16  |     await page.locator('[data-testid="edit-inline-btn"]').click();
  17  |     
  18  |     await expect(page.locator('[data-testid="inline-code-textarea"]')).toBeVisible();
  19  |     await expect(page.locator('[data-testid="inline-code-textarea"]')).toHaveValue(/#include/);
  20  |   });
  21  | 
  22  |   test('T1_INLINE_3: Modifying text and clicking inline Save triggers write command', async ({ page }) => {
  23  |     await page.locator('[data-testid="file-item-solver.cpp"]').click();
  24  |     await page.locator('[data-testid="edit-inline-btn"]').click();
  25  |     
  26  |     await page.locator('[data-testid="inline-code-textarea"]').fill('// New edited code');
  27  |     await page.locator('[data-testid="edit-inline-btn"]').click(); // click Save Inline
  28  |     
  29  |     await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/Inline changes saved successfully/);
  30  |     
  31  |     const saved = await page.evaluate(() => (window as any).__MOCK_STATE__.contents['/vault/solver.cpp']);
  32  |     expect(saved).toBe('// New edited code');
  33  |   });
  34  | 
  35  |   test('T1_INLINE_4: Inline code edits reflect in syntax highlighting upon toggle back', async ({ page }) => {
  36  |     await page.locator('[data-testid="file-item-solver.cpp"]').click();
  37  |     await page.locator('[data-testid="edit-inline-btn"]').click();
  38  |     
  39  |     await page.locator('[data-testid="inline-code-textarea"]').fill('int my_var = 10;');
  40  |     await page.locator('[data-testid="edit-inline-btn"]').click(); // Click Save Inline
  41  |     
  42  |     // Code should toggle back, display new highlight
  43  |     await expect(page.locator('[data-testid="inline-code-textarea"]')).toBeHidden();
  44  |     await expect(page.locator('[data-testid="code-viewer"] >> span.keyword')).toHaveText('int');
  45  |   });
  46  | 
  47  |   test('T1_INLINE_5: Edit Inline button is hidden if active file is not a code document', async ({ page }) => {
  48  |     await page.locator('[data-testid="file-item-welcome.md"]').click();
  49  |     await expect(page.locator('[data-testid="edit-inline-btn"]')).toBeHidden();
  50  |   });
  51  | 
  52  |   test('T2_INLINE_1: Extremely large code file editing remains responsive', async ({ page }) => {
  53  |     const largeCode = '// C++ code\n' + 'int variable = 12;\n'.repeat(1000);
  54  |     await page.evaluate((code) => {
  55  |       (window as any).__MOCK_STATE__.contents['/vault/solver.cpp'] = code;
  56  |     }, largeCode);
  57  |     
  58  |     await page.locator('[data-testid="file-item-solver.cpp"]').click();
  59  |     await page.locator('[data-testid="edit-inline-btn"]').click();
  60  |     await expect(page.locator('[data-testid="inline-code-textarea"]')).toHaveValue(largeCode);
  61  |   });
  62  | 
  63  |   test('T2_INLINE_2: Concurrent inline editor modifications warn users of collisions', async ({ page }) => {
  64  |     await page.locator('[data-testid="file-item-solver.cpp"]').click();
  65  |     await page.locator('[data-testid="edit-inline-btn"]').click();
  66  |     
  67  |     // Simulate background modify
  68  |     await page.evaluate(() => {
  69  |       (window as any).__MOCK_STATE__.contents['/vault/solver.cpp'] = '// Modified by another worker';
  70  |     });
  71  |     
  72  |     await page.locator('[data-testid="inline-code-textarea"]').fill('// My concurrent changes');
  73  |     await page.locator('[data-testid="edit-inline-btn"]').click(); // save
  74  |     
  75  |     await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/Inline changes saved successfully/);
  76  |   });
  77  | 
  78  |   test('T2_INLINE_3: Inline edit on permission-denied file displays toast error', async ({ page }) => {
  79  |     page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  80  |     // Add locked code file
  81  |     await page.evaluate(() => {
  82  |       console.log('EVAL: __MOCK_STATE__ exists =', !!(window as any).__MOCK_STATE__);
  83  |       console.log('EVAL: __MOCK_STATE__ is Proxy check =', (window as any).__MOCK_STATE__ === (window as any).__MOCK_STATE__);
  84  |       console.log('EVAL: files length before =', (window as any).__MOCK_STATE__.files.length);
  85  |       (window as any).__MOCK_STATE__.files.push({
  86  |         name: 'locked.cpp',
  87  |         path: '/vault/locked.cpp',
  88  |         is_dir: false,
  89  |         ext: 'cpp'
  90  |       });
  91  |       console.log('EVAL: files length after =', (window as any).__MOCK_STATE__.files.length);
  92  |       (window as any).__MOCK_STATE__.contents['/vault/locked.cpp'] = 'int main() {}';
  93  |     });
  94  |     await page.reload();
  95  |     
> 96  |     await page.locator('[data-testid="file-item-locked.cpp"]').click();
      |                                                                ^ Error: locator.click: Test timeout of 30000ms exceeded.
  97  |     await page.locator('[data-testid="edit-inline-btn"]').click();
  98  |     await page.locator('[data-testid="inline-code-textarea"]').fill('int fail() {}');
  99  |     await page.locator('[data-testid="edit-inline-btn"]').click(); // Save
  100 |     
  101 |     await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/Permission denied/);
  102 |   });
  103 | 
  104 |   test('T2_INLINE_4: Blank file inline edit allows adding code from scratch', async ({ page }) => {
  105 |     await page.evaluate(() => {
  106 |       (window as any).__MOCK_STATE__.contents['/vault/solver.cpp'] = '';
  107 |     });
  108 |     await page.reload();
  109 |     
  110 |     await page.locator('[data-testid="file-item-solver.cpp"]').click();
  111 |     await page.locator('[data-testid="edit-inline-btn"]').click();
  112 |     await page.locator('[data-testid="inline-code-textarea"]').fill('int code_added = 1;');
  113 |     await page.locator('[data-testid="edit-inline-btn"]').click(); // Save
  114 |     
  115 |     await expect(page.locator('[data-testid="code-viewer"]')).toBeVisible();
  116 |     await expect(page.locator('[data-testid="code-viewer"] >> span.keyword')).toHaveText('int');
  117 |   });
  118 | 
  119 |   test('T2_INLINE_5: Code changes update syntax highlighted tokens instantly', async ({ page }) => {
  120 |     await page.locator('[data-testid="file-item-solver.cpp"]').click();
  121 |     await page.locator('[data-testid="edit-inline-btn"]').click();
  122 |     await page.locator('[data-testid="inline-code-textarea"]').fill('return 0;');
  123 |     await page.locator('[data-testid="edit-inline-btn"]').click(); // Save
  124 |     
  125 |     await expect(page.locator('[data-testid="code-viewer"] >> span.keyword')).toHaveText('return');
  126 |   });
  127 | });
  128 | 
```