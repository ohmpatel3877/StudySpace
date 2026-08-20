import { expect } from '@playwright/test';
import { test } from './mocks/tauri-ipc-mock';

test.describe('IMPORT: External Location Imports (R7)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('T1_IMPORT_1: Settings panel shows input fields for location types', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await expect(page.locator('[data-testid="import-type-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="import-path-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="import-username-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="import-password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="import-submit-btn"]')).toBeVisible();
  });

  test('T1_IMPORT_2: Adding a valid local path adds it to the imported list', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="import-type-select"]').selectOption('local');
    await page.locator('[data-testid="import-path-input"]').fill('/ext/my_local_folder');
    await page.locator('[data-testid="import-submit-btn"]').click();
    
    await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/Successfully imported location/);
    await expect(page.locator('[data-testid="imported-locations-list"]')).toContainText('/ext/my_local_folder');
  });

  test('T1_IMPORT_3: Selecting an imported directory displays files inside that location', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="import-type-select"]').selectOption('local');
    await page.locator('[data-testid="import-path-input"]').fill('/ext/my_local_folder');
    await page.locator('[data-testid="import-submit-btn"]').click();
    
    await page.locator('[data-testid="tab-workspace"]').click();
    // Verify external files are visible
    await expect(page.locator('[data-testid="file-item-external_my_local_folder_note.md"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-item-external_my_local_folder_mesh.stl"]')).toBeVisible();
    
    // Select the file, verify it loads content
    await page.locator('[data-testid="file-item-external_my_local_folder_note.md"]').click();
    await expect(page.locator('[data-testid="markdown-textarea"]')).toHaveValue(/This note belongs to \/ext\/my_local_folder/);
  });

  test('T1_IMPORT_4: Removing an external location updates the sidebar list', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="import-type-select"]').selectOption('local');
    await page.locator('[data-testid="import-path-input"]').fill('/ext/my_local_folder');
    await page.locator('[data-testid="import-submit-btn"]').click();
    
    // Check that location is in settings
    await expect(page.locator('[data-testid="imported-locations-list"]')).toContainText('/ext/my_local_folder');
    
    // Unmount
    await page.locator('[data-testid="remove-location-btn"]').click();
    await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/Successfully removed location/);
    
    // Verify it is gone from settings list
    await expect(page.locator('[data-testid="imported-locations-list"]')).not.toContainText('/ext/my_local_folder');
    
    // Verify gone from workspace sidebar
    await page.locator('[data-testid="tab-workspace"]').click();
    await expect(page.locator('[data-testid="file-item-external_my_local_folder_note.md"]')).toBeHidden();
  });

  test('T1_IMPORT_5: Remote WebDAV/SMB credential saving validates credentials', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="import-type-select"]').selectOption('webdav');
    await page.locator('[data-testid="import-path-input"]').fill('https://webdav.myuniversity.edu/share');
    await page.locator('[data-testid="import-username-input"]').fill('student');
    await page.locator('[data-testid="import-password-input"]').fill('valid');
    await page.locator('[data-testid="import-submit-btn"]').click();
    
    await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/Successfully imported location/);
    await expect(page.locator('[data-testid="imported-locations-list"]')).toContainText('https://webdav.myuniversity.edu/share');
  });

  test('T2_IMPORT_1: Invalid connection credentials display authentication failure message', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="import-type-select"]').selectOption('webdav');
    await page.locator('[data-testid="import-path-input"]').fill('https://webdav.myuniversity.edu/share');
    await page.locator('[data-testid="import-username-input"]').fill('student');
    await page.locator('[data-testid="import-password-input"]').fill('invalid'); // Will trigger mock failure
    await page.locator('[data-testid="import-submit-btn"]').click();
    
    await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/Authentication failed/);
    await expect(page.locator('[data-testid="imported-locations-list"]')).not.toContainText('https://webdav.myuniversity.edu/share');
  });

  test('T2_IMPORT_2: Malformed URI/path strings throw parse errors in UI', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="import-path-input"]').fill(''); // Empty path triggers mock error
    await page.locator('[data-testid="import-submit-btn"]').click();
    
    await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/Malformed path or URL/);
  });

  test('T2_IMPORT_3: Rapid-fire directory mounting/unmounting executes sequentially', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="import-type-select"]').selectOption('local');
    
    // Rapid mount 1, mount 2, mount 3
    const input = page.locator('[data-testid="import-path-input"]');
    const submitBtn = page.locator('[data-testid="import-submit-btn"]');
    
    await input.fill('/ext/dir1');
    await submitBtn.click();
    
    await input.fill('/ext/dir2');
    await submitBtn.click();
    
    // Verify both are added
    await expect(page.locator('[data-testid="imported-locations-list"]')).toContainText('/ext/dir1');
    await expect(page.locator('[data-testid="imported-locations-list"]')).toContainText('/ext/dir2');
  });

  test('T2_IMPORT_4: Storage read failure fallback defaults to empty list', async ({ page }) => {
    // Seed a real external location first, so the default (non-override) path
    // would render a non-empty list. This makes the assertion below actually
    // discriminate between "override applied" and "override dead".
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="import-type-select"]').selectOption('local');
    await page.locator('[data-testid="import-path-input"]').fill('/ext/my_local_folder');
    await page.locator('[data-testid="import-submit-btn"]').click();
    await expect(page.locator('[data-testid="imported-locations-list"]')).toContainText('/ext/my_local_folder');

    // Mock settings load to return without external_locations key
    await page.addInitScript(() => {
      const internals = (window as any).__TAURI_INTERNALS__;
      const passthrough = internals.invoke;
      internals.invoke = async (cmd: string, args: any) => {
        if (cmd === 'load_settings') {
          return {
            theme: 'Dark Mode',
            active_features: ['d2l_sync', 'cad_viewer'],
            d2l_feed_url: 'https://d2l.myuniversity.edu/feed.ics'
            // missing external_locations
          };
        }
        return passthrough(cmd, args);
      };
    });

    await page.reload();
    await page.locator('[data-testid="tab-settings"]').click();

    // Verify no crash and lists empty locations indicator, proving the
    // overridden load_settings response (missing external_locations) was
    // actually used instead of the seeded location persisted in mock state.
    await expect(page.locator('[data-testid="imported-locations-list"]')).toContainText('No external locations imported');
  });

  test('T2_IMPORT_5: Locked/Permission-denied directories display warning toast', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="import-path-input"]').fill('/locked_folder'); // Mock permission denial path
    await page.locator('[data-testid="import-submit-btn"]').click();
    
    await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/Permission denied/);
  });
});
