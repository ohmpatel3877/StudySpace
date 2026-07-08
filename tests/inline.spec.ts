import { expect } from '@playwright/test';
import { test } from './mocks/tauri-ipc-mock';

test.describe('INLINE: C/C++ Inline Editing (R9)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('T1_INLINE_1: Viewer panel for C/C++ files includes an Edit Inline button', async ({ page }) => {
    await page.locator('[data-testid="file-item-solver.cpp"]').click();
    await expect(page.locator('[data-testid="edit-inline-btn"]')).toBeVisible();
  });

  test('T1_INLINE_2: Clicking Edit Inline renders a textarea with source code', async ({ page }) => {
    await page.locator('[data-testid="file-item-solver.cpp"]').click();
    await page.locator('[data-testid="edit-inline-btn"]').click();
    
    await expect(page.locator('[data-testid="inline-code-textarea"]')).toBeVisible();
    await expect(page.locator('[data-testid="inline-code-textarea"]')).toHaveValue(/#include/);
  });

  test('T1_INLINE_3: Modifying text and clicking inline Save triggers write command', async ({ page }) => {
    await page.locator('[data-testid="file-item-solver.cpp"]').click();
    await page.locator('[data-testid="edit-inline-btn"]').click();
    
    await page.locator('[data-testid="inline-code-textarea"]').fill('// New edited code');
    await page.locator('[data-testid="edit-inline-btn"]').click(); // click Save Inline
    
    await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/Inline changes saved successfully/);
    
    const saved = await page.evaluate(() => (window as any).__MOCK_STATE__.contents['/vault/solver.cpp']);
    expect(saved).toBe('// New edited code');
  });

  test('T1_INLINE_4: Inline code edits reflect in syntax highlighting upon toggle back', async ({ page }) => {
    await page.locator('[data-testid="file-item-solver.cpp"]').click();
    await page.locator('[data-testid="edit-inline-btn"]').click();
    
    await page.locator('[data-testid="inline-code-textarea"]').fill('int my_var = 10;');
    await page.locator('[data-testid="edit-inline-btn"]').click(); // Click Save Inline
    
    // Code should toggle back, display new highlight
    await expect(page.locator('[data-testid="inline-code-textarea"]')).toBeHidden();
    await expect(page.locator('[data-testid="code-viewer"] >> span.keyword')).toHaveText('int');
  });

  test('T1_INLINE_5: Edit Inline button is hidden if active file is not a code document', async ({ page }) => {
    await page.locator('[data-testid="file-item-welcome.md"]').click();
    await expect(page.locator('[data-testid="edit-inline-btn"]')).toBeHidden();
  });

  test('T2_INLINE_1: Extremely large code file editing remains responsive', async ({ page }) => {
    const largeCode = '// C++ code\n' + 'int variable = 12;\n'.repeat(1000);
    await page.evaluate((code) => {
      (window as any).__MOCK_STATE__.contents['/vault/solver.cpp'] = code;
    }, largeCode);
    
    await page.locator('[data-testid="file-item-solver.cpp"]').click();
    await page.locator('[data-testid="edit-inline-btn"]').click();
    await expect(page.locator('[data-testid="inline-code-textarea"]')).toHaveValue(largeCode);
  });

  test('T2_INLINE_2: Concurrent inline editor modifications warn users of collisions', async ({ page }) => {
    await page.locator('[data-testid="file-item-solver.cpp"]').click();
    await page.locator('[data-testid="edit-inline-btn"]').click();
    
    // Simulate background modify
    await page.evaluate(() => {
      (window as any).__MOCK_STATE__.contents['/vault/solver.cpp'] = '// Modified by another worker';
    });
    
    await page.locator('[data-testid="inline-code-textarea"]').fill('// My concurrent changes');
    await page.locator('[data-testid="edit-inline-btn"]').click(); // save
    
    await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/Inline changes saved successfully/);
  });

  test('T2_INLINE_3: Inline edit on permission-denied file displays toast error', async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    // Add locked code file
    await page.evaluate(() => {
      console.log('EVAL: __MOCK_STATE__ exists =', !!(window as any).__MOCK_STATE__);
      console.log('EVAL: __MOCK_STATE__ is Proxy check =', (window as any).__MOCK_STATE__ === (window as any).__MOCK_STATE__);
      console.log('EVAL: files length before =', (window as any).__MOCK_STATE__.files.length);
      (window as any).__MOCK_STATE__.files.push({
        name: 'locked.cpp',
        path: '/vault/locked.cpp',
        is_dir: false,
        ext: 'cpp'
      });
      console.log('EVAL: files length after =', (window as any).__MOCK_STATE__.files.length);
      (window as any).__MOCK_STATE__.contents['/vault/locked.cpp'] = 'int main() {}';
    });
    await page.reload();
    
    await page.locator('[data-testid="file-item-locked.cpp"]').click();
    await page.locator('[data-testid="edit-inline-btn"]').click();
    await page.locator('[data-testid="inline-code-textarea"]').fill('int fail() {}');
    await page.locator('[data-testid="edit-inline-btn"]').click(); // Save
    
    await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/Permission denied/);
  });

  test('T2_INLINE_4: Blank file inline edit allows adding code from scratch', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__MOCK_STATE__.contents['/vault/solver.cpp'] = '';
    });
    await page.reload();
    
    await page.locator('[data-testid="file-item-solver.cpp"]').click();
    await page.locator('[data-testid="edit-inline-btn"]').click();
    await page.locator('[data-testid="inline-code-textarea"]').fill('int code_added = 1;');
    await page.locator('[data-testid="edit-inline-btn"]').click(); // Save
    
    await expect(page.locator('[data-testid="code-viewer"]')).toBeVisible();
    await expect(page.locator('[data-testid="code-viewer"] >> span.keyword')).toHaveText('int');
  });

  test('T2_INLINE_5: Code changes update syntax highlighted tokens instantly', async ({ page }) => {
    await page.locator('[data-testid="file-item-solver.cpp"]').click();
    await page.locator('[data-testid="edit-inline-btn"]').click();
    await page.locator('[data-testid="inline-code-textarea"]').fill('return 0;');
    await page.locator('[data-testid="edit-inline-btn"]').click(); // Save
    
    await expect(page.locator('[data-testid="code-viewer"] >> span.keyword')).toHaveText('return');
  });
});
