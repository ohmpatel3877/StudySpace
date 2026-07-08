# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office.spec.ts >> OFFICE: Office Document Viewer (R8) >> T1_OFFICE_1: Clicking .docx file triggers conversion loader
- Location: tests\office.spec.ts:9:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('[data-testid="office-loader"]')
Expected: visible
Received: hidden
Timeout:  5000ms

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('[data-testid="office-loader"]')
    14 × locator resolved to <div class="hidden" id="office-loader" data-testid="office-loader">…</div>
       - unexpected value "hidden"

```

```yaml
- heading "StudySpace" [level=3]
- button "Workspace"
- button "D2L Calendar"
- button "Settings"
- separator
- heading "Files" [level=5]
- text: welcome.md homework.md syllabus.pdf gear.stl solver.cpp document.docx spreadsheet.xlsx presentation.pptx zero.docx corrupt.docx large.pptx
- textbox "newfile.md"
- button "Add"
- heading "document.docx (Office Preview)" [level=4]
- button "Preview"
- button "Save"
- heading "Resource Viewer" [level=4]
- button "Open in Default App"
- iframe
```

# Test source

```ts
  1  | import { expect } from '@playwright/test';
  2  | import { test } from './mocks/tauri-ipc-mock';
  3  | 
  4  | test.describe('OFFICE: Office Document Viewer (R8)', () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     await page.goto('/');
  7  |   });
  8  | 
  9  |   test('T1_OFFICE_1: Clicking .docx file triggers conversion loader', async ({ page }) => {
  10 |     await page.locator('[data-testid="file-item-document.docx"]').click();
> 11 |     await expect(page.locator('[data-testid="office-loader"]')).toBeVisible();
     |                                                                 ^ Error: expect(locator).toBeVisible() failed
  12 |   });
  13 | 
  14 |   test('T1_OFFICE_2: Successful conversion loads PDF iframe src', async ({ page }) => {
  15 |     await page.locator('[data-testid="file-item-document.docx"]').click();
  16 |     // Wait for loader to disappear
  17 |     await expect(page.locator('[data-testid="office-loader"]')).toBeHidden();
  18 |     await expect(page.locator('[data-testid="pdf-iframe"]')).toBeVisible();
  19 |     await expect(page.locator('[data-testid="pdf-iframe"]')).toHaveAttribute('src', /\/temp\/converted_document.pdf/);
  20 |   });
  21 | 
  22 |   test('T1_OFFICE_3: Clicking .xlsx file renders Excel conversion view', async ({ page }) => {
  23 |     await page.locator('[data-testid="file-item-spreadsheet.xlsx"]').click();
  24 |     await expect(page.locator('[data-testid="office-loader"]')).toBeHidden();
  25 |     await expect(page.locator('[data-testid="pdf-iframe"]')).toBeVisible();
  26 |     await expect(page.locator('[data-testid="pdf-iframe"]')).toHaveAttribute('src', /\/temp\/converted_document.pdf/);
  27 |   });
  28 | 
  29 |   test('T1_OFFICE_4: Clicking .pptx file renders PowerPoint conversion view', async ({ page }) => {
  30 |     await page.locator('[data-testid="file-item-presentation.pptx"]').click();
  31 |     await expect(page.locator('[data-testid="office-loader"]')).toBeHidden();
  32 |     await expect(page.locator('[data-testid="pdf-iframe"]')).toBeVisible();
  33 |     await expect(page.locator('[data-testid="pdf-iframe"]')).toHaveAttribute('src', /\/temp\/converted_document.pdf/);
  34 |   });
  35 | 
  36 |   test('T1_OFFICE_5: Missing LibreOffice installation renders fallback warning', async ({ page }) => {
  37 |     await page.evaluate(() => {
  38 |       (window as any).__MOCK_STATE__.libreOfficeInstalled = false;
  39 |     });
  40 |     // Triggers reload to preserve sessionStorage override
  41 |     await page.reload();
  42 |     
  43 |     await page.locator('[data-testid="file-item-document.docx"]').click();
  44 |     await expect(page.locator('[data-testid="office-loader"]')).toBeHidden();
  45 |     await expect(page.locator('[data-testid="viewer-fallback"]')).toHaveText('LibreOffice required for office document conversion');
  46 |   });
  47 | 
  48 |   test('T2_OFFICE_1: 0-byte office document conversion displays fallback warning', async ({ page }) => {
  49 |     await page.locator('[data-testid="file-item-zero.docx"]').click();
  50 |     await expect(page.locator('[data-testid="office-loader"]')).toBeHidden();
  51 |     await expect(page.locator('[data-testid="viewer-fallback"]')).toHaveText('Corrupted PDF or empty document');
  52 |   });
  53 | 
  54 |   test('T2_OFFICE_2: Malformed office file triggers conversion failure', async ({ page }) => {
  55 |     await page.locator('[data-testid="file-item-corrupt.docx"]').click();
  56 |     await expect(page.locator('[data-testid="office-loader"]')).toBeHidden();
  57 |     await expect(page.locator('[data-testid="viewer-fallback"]')).toHaveText('Conversion failed: File corrupted');
  58 |   });
  59 | 
  60 |   test('T2_OFFICE_3: Concurrent office conversions cancel previous ones', async ({ page }) => {
  61 |     // Select document then immediately select spreadsheet
  62 |     await page.locator('[data-testid="file-item-document.docx"]').click();
  63 |     await page.locator('[data-testid="file-item-spreadsheet.xlsx"]').click();
  64 |     
  65 |     await expect(page.locator('[data-testid="office-loader"]')).toBeHidden();
  66 |     await expect(page.locator('[data-testid="pdf-iframe"]')).toBeVisible();
  67 |   });
  68 | 
  69 |   test('T2_OFFICE_4: Read-only office file conversion loads preview safely', async ({ page }) => {
  70 |     // Verify standard preview works
  71 |     await page.locator('[data-testid="file-item-document.docx"]').click();
  72 |     await expect(page.locator('[data-testid="pdf-iframe"]')).toBeVisible();
  73 |   });
  74 | 
  75 |   test('T2_OFFICE_5: Large PowerPoint file conversion displays progress percentage', async ({ page }) => {
  76 |     // Click large file and verify progress text is displayed
  77 |     await page.locator('[data-testid="file-item-large.pptx"]').click();
  78 |     await expect(page.locator('[data-testid="office-progress"]')).toContainText('Conversion Progress: 50%');
  79 |   });
  80 | });
  81 | 
```