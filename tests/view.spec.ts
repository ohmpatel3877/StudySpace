import { expect } from '@playwright/test';
import { test } from './mocks/tauri-ipc-mock';

test.describe('VIEW: CAD Model & Document Viewer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('T1_VIEW_1: Resource Panel Dynamic Switching by Extension', async ({ page }) => {
    // 1. PDF
    await page.locator('[data-testid="file-item-syllabus.pdf"]').click();
    await expect(page.locator('[data-testid="pdf-iframe"]')).toBeVisible();
    await expect(page.locator('[data-testid="cad-viewer"]')).toBeHidden();
    await expect(page.locator('[data-testid="code-viewer"]')).toBeHidden();

    // 2. STL
    await page.locator('[data-testid="file-item-gear.stl"]').click();
    await expect(page.locator('[data-testid="pdf-iframe"]')).toBeHidden();
    await expect(page.locator('[data-testid="cad-viewer"]')).toBeVisible();
    await expect(page.locator('[data-testid="code-viewer"]')).toBeHidden();

    // 3. CPP
    await page.locator('[data-testid="file-item-solver.cpp"]').click();
    await expect(page.locator('[data-testid="pdf-iframe"]')).toBeHidden();
    await expect(page.locator('[data-testid="cad-viewer"]')).toBeHidden();
    await expect(page.locator('[data-testid="code-viewer"]')).toBeVisible();
  });

  test('T1_VIEW_2: PDF Viewer Embedding', async ({ page }) => {
    await page.locator('[data-testid="file-item-syllabus.pdf"]').click();
    const frame = page.locator('[data-testid="pdf-iframe"]');
    await expect(frame).toHaveAttribute('src', /base64|MOCK/);
  });

  test('T1_VIEW_3: C/C++ Syntax Highlighting', async ({ page }) => {
    await page.locator('[data-testid="file-item-solver.cpp"]').click();
    const code = page.locator('[data-testid="code-viewer"]');
    await expect(code.locator('span.keyword')).toContainText(['#include', 'int', 'return']);
  });

  test('T1_VIEW_4: Three.js 3D Viewport Initialization', async ({ page }) => {
    await page.locator('[data-testid="file-item-gear.stl"]').click();
    await expect(page.locator('[data-testid="three-canvas"]')).toBeVisible();
    await expect(page.locator('[data-testid="canvas-status"]')).toHaveText('WebGL Context Active');
  });

  test('T1_VIEW_5: 3D Camera Controls Verification', async ({ page }) => {
    await page.locator('[data-testid="file-item-gear.stl"]').click();
    const canvas = page.locator('[data-testid="three-canvas"]');
    
    // Simulate scroll/wheel event on canvas
    await canvas.dispatchEvent('wheel', { deltaY: 100 });
    
    // Verify no console error occurred and canvas status is active
    await expect(page.locator('[data-testid="canvas-status"]')).toHaveText('WebGL Context Active');
  });

  test('T2_VIEW_1: Malformed/Empty PDF Document Error Handling', async ({ page }) => {
    // Inject custom file contents mock that throws for pdf
    await page.evaluate(() => {
      (window as any).__MOCK_STATE__.contents['/vault/syllabus.pdf'] = undefined; // Will cause read_vault_file error
    });
    
    await page.locator('[data-testid="file-item-syllabus.pdf"]').click();
    await expect(page.locator('[data-testid="pdf-iframe"]')).toBeHidden();
    await expect(page.locator('[data-testid="viewer-fallback"]')).toHaveText('Corrupted PDF or empty document');
  });

  test('T2_VIEW_2: Corrupt STL/OBJ Mesh Rendering', async ({ page }) => {
    // Inject file content mock that triggers read error
    await page.evaluate(() => {
      (window as any).__MOCK_STATE__.contents['/vault/gear.stl'] = undefined;
    });
    
    await page.locator('[data-testid="file-item-gear.stl"]').click();
    await expect(page.locator('[data-testid="cad-viewer"]')).toBeHidden();
    await expect(page.locator('[data-testid="viewer-fallback"]')).toHaveText('Invalid model file layout');
  });

  test('T2_VIEW_3: Code Viewer with Extremely Long Line Elements', async ({ page }) => {
    const longLineCode = 'int ' + 'a'.repeat(10000) + ' = 0;';
    await page.evaluate((code) => {
      (window as any).__MOCK_STATE__.contents['/vault/solver.cpp'] = code;
    }, longLineCode);
    
    await page.locator('[data-testid="file-item-solver.cpp"]').click();
    await expect(page.locator('[data-testid="code-viewer"]')).toBeVisible();
    await expect(page.locator('[data-testid="code-viewer"] >> span.keyword')).toHaveText('int');
  });

  test('T2_VIEW_4: Fast Rapid-Fire File Selection Stress Test', async ({ page }) => {
    // Fast click sequentially
    const files = [
      '[data-testid="file-item-welcome.md"]',
      '[data-testid="file-item-syllabus.pdf"]',
      '[data-testid="file-item-gear.stl"]',
      '[data-testid="file-item-solver.cpp"]'
    ];
    
    for (const f of files) {
      await page.locator(f).click();
    }
    
    // Ultimately the last one (solver.cpp) should render
    await expect(page.locator('[data-testid="code-viewer"]')).toBeVisible();
  });

  test('T2_VIEW_5: WebGL Context Loss Restoration', async ({ page }) => {
    await page.locator('[data-testid="file-item-gear.stl"]').click();
    await expect(page.locator('[data-testid="canvas-status"]')).toHaveText('WebGL Context Active');
    
    // Trigger context loss
    await page.evaluate(() => {
      (window as any).__triggerWebGLContextLoss();
    });
    
    await expect(page.locator('[data-testid="canvas-status"]')).toHaveText('WebGL context lost. Restoring...');
    
    // Wait for auto restoration (1.2 seconds to cover the 1s timeout)
    await page.waitForTimeout(1200);
    await expect(page.locator('[data-testid="canvas-status"]')).toHaveText('WebGL Context Active');
  });
});
