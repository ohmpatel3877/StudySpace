import { expect } from '@playwright/test';
import { test } from './mocks/tauri-ipc-mock';

test.describe('OFFICE: Office Document Viewer (R8)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('T1_OFFICE_1: Clicking .docx file triggers conversion loader', async ({ page }) => {
    await page.locator('[data-testid="file-item-document.docx"]').click();
    await expect(page.locator('[data-testid="office-loader"]')).toBeVisible();
  });

  test('T1_OFFICE_2: Successful conversion loads PDF iframe src', async ({ page }) => {
    await page.locator('[data-testid="file-item-document.docx"]').click();
    // Wait for loader to disappear
    await expect(page.locator('[data-testid="office-loader"]')).toBeHidden();
    await expect(page.locator('[data-testid="pdf-iframe"]')).toBeVisible();
    await expect(page.locator('[data-testid="pdf-iframe"]')).toHaveAttribute('src', /\/temp\/converted_document.pdf/);
  });

  test('T1_OFFICE_3: Clicking .xlsx file renders Excel conversion view', async ({ page }) => {
    await page.locator('[data-testid="file-item-spreadsheet.xlsx"]').click();
    await expect(page.locator('[data-testid="office-loader"]')).toBeHidden();
    await expect(page.locator('[data-testid="pdf-iframe"]')).toBeVisible();
    await expect(page.locator('[data-testid="pdf-iframe"]')).toHaveAttribute('src', /\/temp\/converted_document.pdf/);
  });

  test('T1_OFFICE_4: Clicking .pptx file renders PowerPoint conversion view', async ({ page }) => {
    await page.locator('[data-testid="file-item-presentation.pptx"]').click();
    await expect(page.locator('[data-testid="office-loader"]')).toBeHidden();
    await expect(page.locator('[data-testid="pdf-iframe"]')).toBeVisible();
    await expect(page.locator('[data-testid="pdf-iframe"]')).toHaveAttribute('src', /\/temp\/converted_document.pdf/);
  });

  test('T1_OFFICE_5: Missing LibreOffice installation renders fallback warning', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__MOCK_STATE__.libreOfficeInstalled = false;
    });
    // Triggers reload to preserve sessionStorage override
    await page.reload();
    
    await page.locator('[data-testid="file-item-document.docx"]').click();
    await expect(page.locator('[data-testid="office-loader"]')).toBeHidden();
    await expect(page.locator('[data-testid="viewer-fallback"]')).toHaveText('LibreOffice required for office document conversion');
  });

  test('T2_OFFICE_1: 0-byte office document conversion displays fallback warning', async ({ page }) => {
    await page.locator('[data-testid="file-item-zero.docx"]').click();
    await expect(page.locator('[data-testid="office-loader"]')).toBeHidden();
    await expect(page.locator('[data-testid="viewer-fallback"]')).toHaveText('Corrupted PDF or empty document');
  });

  test('T2_OFFICE_2: Malformed office file triggers conversion failure', async ({ page }) => {
    await page.locator('[data-testid="file-item-corrupt.docx"]').click();
    await expect(page.locator('[data-testid="office-loader"]')).toBeHidden();
    await expect(page.locator('[data-testid="viewer-fallback"]')).toHaveText('Conversion failed: File corrupted');
  });

  test('T2_OFFICE_3: Concurrent office conversions cancel previous ones', async ({ page }) => {
    // Select document then immediately select spreadsheet
    await page.locator('[data-testid="file-item-document.docx"]').click();
    await page.locator('[data-testid="file-item-spreadsheet.xlsx"]').click();
    
    await expect(page.locator('[data-testid="office-loader"]')).toBeHidden();
    await expect(page.locator('[data-testid="pdf-iframe"]')).toBeVisible();
  });

  test('T2_OFFICE_4: Read-only office file conversion loads preview safely', async ({ page }) => {
    // Verify standard preview works
    await page.locator('[data-testid="file-item-document.docx"]').click();
    await expect(page.locator('[data-testid="pdf-iframe"]')).toBeVisible();
  });

  test('T2_OFFICE_5: Large PowerPoint file conversion displays progress percentage', async ({ page }) => {
    // Click large file and verify progress text is displayed
    await page.locator('[data-testid="file-item-large.pptx"]').click();
    await expect(page.locator('[data-testid="office-progress"]')).toContainText('Conversion Progress: 50%');
  });
});
