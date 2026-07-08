# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: import.spec.ts >> IMPORT: External Location Imports (R7) >> T1_IMPORT_4: Removing an external location updates the sidebar list
- Location: tests\import.spec.ts:44:3

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator: locator('[data-testid="toast-notification"]')
Expected pattern: /Successfully removed location/
Error: strict mode violation: locator('[data-testid="toast-notification"]') resolved to 2 elements:
    1) <div class="toast border-blue-500" data-testid="toast-notification">Successfully imported location: /ext/my_local_fol…</div> aka getByText('Successfully imported')
    2) <div class="toast border-blue-500" data-testid="toast-notification">Successfully removed location: /ext/my_local_fold…</div> aka getByText('Successfully removed location')

Call log:
  - Expect "toHaveText" with timeout 5000ms
  - waiting for locator('[data-testid="toast-notification"]')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
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
      - generic [ref=e42]:
        - heading "Global Settings" [level=3] [ref=e43]
        - generic [ref=e44]:
          - generic [ref=e45]:
            - generic [ref=e46]: Custom Theme
            - combobox [ref=e47]:
              - option "Dark Mode" [selected]
              - option "Light Mode"
              - option "AMOLED Mode"
              - option "Colored Glass Mode"
          - generic [ref=e48]:
            - generic [ref=e49]: D2L Calendar Private iCal Feed URL
            - textbox "https://d2l.myuniversity.edu/feed.ics" [ref=e50]
          - generic [ref=e51]:
            - generic [ref=e52]: Modular Feature Toggles
            - generic [ref=e53]:
              - generic [ref=e54]: Enable 3D CAD Viewer
              - button "Enabled" [ref=e55] [cursor=pointer]
            - generic [ref=e56]:
              - generic [ref=e57]: Enable D2L Calendar Sync
              - button "Enabled" [ref=e58] [cursor=pointer]
          - generic [ref=e59]:
            - generic [ref=e60]: Import External File Location
            - generic [ref=e61]:
              - combobox [ref=e62]:
                - option "Local Directory" [selected]
                - option "WebDAV Share"
                - option "SMB Network Share"
              - textbox "path/or/url/to/import" [ref=e63]
              - generic [ref=e64]:
                - textbox "Username (optional)" [ref=e65]
                - textbox "Password (optional)" [ref=e66]
              - button "Import Location" [ref=e67] [cursor=pointer]
            - generic [ref=e68]:
              - heading "Imported Locations" [level=5] [ref=e69]
              - generic [ref=e71]: No external locations imported.
          - button "Save Configurations" [ref=e73] [cursor=pointer]
  - generic [ref=e74]:
    - generic [ref=e75]: "Successfully imported location: /ext/my_local_folder"
    - generic [ref=e76]: "Successfully removed location: /ext/my_local_folder"
```

# Test source

```ts
  1   | import { expect } from '@playwright/test';
  2   | import { test } from './mocks/tauri-ipc-mock';
  3   | 
  4   | test.describe('IMPORT: External Location Imports (R7)', () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await page.goto('/');
  7   |   });
  8   | 
  9   |   test('T1_IMPORT_1: Settings panel shows input fields for location types', async ({ page }) => {
  10  |     await page.locator('[data-testid="tab-settings"]').click();
  11  |     await expect(page.locator('[data-testid="import-type-select"]')).toBeVisible();
  12  |     await expect(page.locator('[data-testid="import-path-input"]')).toBeVisible();
  13  |     await expect(page.locator('[data-testid="import-username-input"]')).toBeVisible();
  14  |     await expect(page.locator('[data-testid="import-password-input"]')).toBeVisible();
  15  |     await expect(page.locator('[data-testid="import-submit-btn"]')).toBeVisible();
  16  |   });
  17  | 
  18  |   test('T1_IMPORT_2: Adding a valid local path adds it to the imported list', async ({ page }) => {
  19  |     await page.locator('[data-testid="tab-settings"]').click();
  20  |     await page.locator('[data-testid="import-type-select"]').selectOption('local');
  21  |     await page.locator('[data-testid="import-path-input"]').fill('/ext/my_local_folder');
  22  |     await page.locator('[data-testid="import-submit-btn"]').click();
  23  |     
  24  |     await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/Successfully imported location/);
  25  |     await expect(page.locator('[data-testid="imported-locations-list"]')).toContainText('/ext/my_local_folder');
  26  |   });
  27  | 
  28  |   test('T1_IMPORT_3: Selecting an imported directory displays files inside that location', async ({ page }) => {
  29  |     await page.locator('[data-testid="tab-settings"]').click();
  30  |     await page.locator('[data-testid="import-type-select"]').selectOption('local');
  31  |     await page.locator('[data-testid="import-path-input"]').fill('/ext/my_local_folder');
  32  |     await page.locator('[data-testid="import-submit-btn"]').click();
  33  |     
  34  |     await page.locator('[data-testid="tab-workspace"]').click();
  35  |     // Verify external files are visible
  36  |     await expect(page.locator('[data-testid="file-item-external_my_local_folder_note.md"]')).toBeVisible();
  37  |     await expect(page.locator('[data-testid="file-item-external_my_local_folder_mesh.stl"]')).toBeVisible();
  38  |     
  39  |     // Select the file, verify it loads content
  40  |     await page.locator('[data-testid="file-item-external_my_local_folder_note.md"]').click();
  41  |     await expect(page.locator('[data-testid="markdown-textarea"]')).toHaveValue(/This note belongs to \/ext\/my_local_folder/);
  42  |   });
  43  | 
  44  |   test('T1_IMPORT_4: Removing an external location updates the sidebar list', async ({ page }) => {
  45  |     await page.locator('[data-testid="tab-settings"]').click();
  46  |     await page.locator('[data-testid="import-type-select"]').selectOption('local');
  47  |     await page.locator('[data-testid="import-path-input"]').fill('/ext/my_local_folder');
  48  |     await page.locator('[data-testid="import-submit-btn"]').click();
  49  |     
  50  |     // Check that location is in settings
  51  |     await expect(page.locator('[data-testid="imported-locations-list"]')).toContainText('/ext/my_local_folder');
  52  |     
  53  |     // Unmount
  54  |     await page.locator('[data-testid="remove-location-btn"]').click();
> 55  |     await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/Successfully removed location/);
      |                                                                      ^ Error: expect(locator).toHaveText(expected) failed
  56  |     
  57  |     // Verify it is gone from settings list
  58  |     await expect(page.locator('[data-testid="imported-locations-list"]')).not.toContainText('/ext/my_local_folder');
  59  |     
  60  |     // Verify gone from workspace sidebar
  61  |     await page.locator('[data-testid="tab-workspace"]').click();
  62  |     await expect(page.locator('[data-testid="file-item-external_my_local_folder_note.md"]')).toBeHidden();
  63  |   });
  64  | 
  65  |   test('T1_IMPORT_5: Remote WebDAV/SMB credential saving validates credentials', async ({ page }) => {
  66  |     await page.locator('[data-testid="tab-settings"]').click();
  67  |     await page.locator('[data-testid="import-type-select"]').selectOption('webdav');
  68  |     await page.locator('[data-testid="import-path-input"]').fill('https://webdav.myuniversity.edu/share');
  69  |     await page.locator('[data-testid="import-username-input"]').fill('student');
  70  |     await page.locator('[data-testid="import-password-input"]').fill('valid');
  71  |     await page.locator('[data-testid="import-submit-btn"]').click();
  72  |     
  73  |     await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/Successfully imported location/);
  74  |     await expect(page.locator('[data-testid="imported-locations-list"]')).toContainText('https://webdav.myuniversity.edu/share');
  75  |   });
  76  | 
  77  |   test('T2_IMPORT_1: Invalid connection credentials display authentication failure message', async ({ page }) => {
  78  |     await page.locator('[data-testid="tab-settings"]').click();
  79  |     await page.locator('[data-testid="import-type-select"]').selectOption('webdav');
  80  |     await page.locator('[data-testid="import-path-input"]').fill('https://webdav.myuniversity.edu/share');
  81  |     await page.locator('[data-testid="import-username-input"]').fill('student');
  82  |     await page.locator('[data-testid="import-password-input"]').fill('invalid'); // Will trigger mock failure
  83  |     await page.locator('[data-testid="import-submit-btn"]').click();
  84  |     
  85  |     await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/Authentication failed/);
  86  |     await expect(page.locator('[data-testid="imported-locations-list"]')).not.toContainText('https://webdav.myuniversity.edu/share');
  87  |   });
  88  | 
  89  |   test('T2_IMPORT_2: Malformed URI/path strings throw parse errors in UI', async ({ page }) => {
  90  |     await page.locator('[data-testid="tab-settings"]').click();
  91  |     await page.locator('[data-testid="import-path-input"]').fill(''); // Empty path triggers mock error
  92  |     await page.locator('[data-testid="import-submit-btn"]').click();
  93  |     
  94  |     await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/Malformed path or URL/);
  95  |   });
  96  | 
  97  |   test('T2_IMPORT_3: Rapid-fire directory mounting/unmounting executes sequentially', async ({ page }) => {
  98  |     await page.locator('[data-testid="tab-settings"]').click();
  99  |     await page.locator('[data-testid="import-type-select"]').selectOption('local');
  100 |     
  101 |     // Rapid mount 1, mount 2, mount 3
  102 |     const input = page.locator('[data-testid="import-path-input"]');
  103 |     const submitBtn = page.locator('[data-testid="import-submit-btn"]');
  104 |     
  105 |     await input.fill('/ext/dir1');
  106 |     await submitBtn.click();
  107 |     
  108 |     await input.fill('/ext/dir2');
  109 |     await submitBtn.click();
  110 |     
  111 |     // Verify both are added
  112 |     await expect(page.locator('[data-testid="imported-locations-list"]')).toContainText('/ext/dir1');
  113 |     await expect(page.locator('[data-testid="imported-locations-list"]')).toContainText('/ext/dir2');
  114 |   });
  115 | 
  116 |   test('T2_IMPORT_4: Storage read failure fallback defaults to empty list', async ({ page }) => {
  117 |     // Mock settings load to return without external_locations key
  118 |     await page.evaluate(() => {
  119 |       (window as any).__TAURI_IPC__ = async (message: any) => {
  120 |         if (message.cmd === 'load_settings') {
  121 |           return (window as any)[message.callback]({
  122 |             theme: 'Dark Mode',
  123 |             active_features: ['d2l_sync', 'cad_viewer'],
  124 |             d2l_feed_url: 'https://d2l.myuniversity.edu/feed.ics'
  125 |             // missing external_locations
  126 |           });
  127 |         }
  128 |         return (window as any)[message.callback](null);
  129 |       };
  130 |     });
  131 |     
  132 |     await page.reload();
  133 |     await page.locator('[data-testid="tab-settings"]').click();
  134 |     
  135 |     // Verify no crash and lists empty locations indicator
  136 |     await expect(page.locator('[data-testid="imported-locations-list"]')).toContainText('No external locations imported');
  137 |   });
  138 | 
  139 |   test('T2_IMPORT_5: Locked/Permission-denied directories display warning toast', async ({ page }) => {
  140 |     await page.locator('[data-testid="tab-settings"]').click();
  141 |     await page.locator('[data-testid="import-path-input"]').fill('/locked_folder'); // Mock permission denial path
  142 |     await page.locator('[data-testid="import-submit-btn"]').click();
  143 |     
  144 |     await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/Permission denied/);
  145 |   });
  146 | });
  147 | 
```