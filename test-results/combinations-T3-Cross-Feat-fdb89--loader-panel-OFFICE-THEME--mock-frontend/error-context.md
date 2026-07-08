# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: combinations.spec.ts >> T3: Cross-Feature Combinations >> T3_COMB_10: Office conversion to PDF respects active theme styling for loader panel (OFFICE + THEME)
- Location: tests\combinations.spec.ts:176:3

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
  87  |     await textarea.type('Adding text during rotation.');
  88  |     
  89  |     // Verify focus is held
  90  |     await expect(textarea).toBeFocused();
  91  |   });
  92  | 
  93  |   test('T3_COMB_5: D2L Event Copy-to-Editor Clipboard Operation (NOTE + SYNC)', async ({ page }) => {
  94  |     // Load Markdown file in editor
  95  |     await page.locator('[data-testid="file-item-welcome.md"]').click();
  96  |     const textarea = page.locator('[data-testid="markdown-textarea"]');
  97  |     
  98  |     // Sync events
  99  |     await page.locator('[data-testid="tab-d2l"]').click();
  100 |     await page.locator('[data-testid="d2l-sync-button"]').click();
  101 |     
  102 |     // Click Copy Reference on Calculus event
  103 |     await page.locator('.btn-copy-event').first().click();
  104 |     
  105 |     // Verify reference is inserted
  106 |     await expect(textarea).toHaveValue(/Calculus Midterm/);
  107 |   });
  108 | 
  109 |   test('T3_COMB_6: Toggle Feature + File Explorer Extensions Filter (NOTE + TOGGLE + VIEW)', async ({ page }) => {
  110 |     // Check files initial
  111 |     await expect(page.locator('[data-testid="file-item-gear.stl"]')).toBeVisible();
  112 | 
  113 |     // Disable CAD
  114 |     await page.locator('[data-testid="tab-settings"]').click();
  115 |     await page.locator('[data-testid="toggle-cad-viewer"]').click();
  116 |     await page.locator('[data-testid="save-settings-btn"]').click();
  117 |     
  118 |     // Back to Workspace, CAD file should be disabled
  119 |     await page.locator('[data-testid="tab-workspace"]').click();
  120 |     await expect(page.locator('[data-testid="file-item-gear.stl-disabled"]')).toBeVisible();
  121 |     await expect(page.locator('[data-testid="file-item-syllabus.pdf"]')).toBeVisible(); // PDF still active
  122 |   });
  123 | 
  124 |   test('T3_COMB_7: Toggle Feature + External Location Explorer Filtering (NOTE + TOGGLE + IMPORT)', async ({ page }) => {
  125 |     // 1. Import external location
  126 |     await page.locator('[data-testid="tab-settings"]').click();
  127 |     await page.locator('[data-testid="import-type-select"]').selectOption('local');
  128 |     await page.locator('[data-testid="import-path-input"]').fill('/ext/my_local_folder');
  129 |     await page.locator('[data-testid="import-submit-btn"]').click();
  130 |     
  131 |     // 2. Return to workspace, verify external files are visible
  132 |     await page.locator('[data-testid="tab-workspace"]').click();
  133 |     await expect(page.locator('[data-testid="file-item-external_my_local_folder_note.md"]')).toBeVisible();
  134 |     await expect(page.locator('[data-testid="file-item-external_my_local_folder_mesh.stl"]')).toBeVisible();
  135 | 
  136 |     // 3. Disable CAD viewer feature
  137 |     await page.locator('[data-testid="tab-settings"]').click();
  138 |     await page.locator('[data-testid="toggle-cad-viewer"]').click(); // Disable
  139 |     await page.locator('[data-testid="save-settings-btn"]').click();
  140 | 
  141 |     // 4. Return to workspace explorer, verify external STL mesh is disabled, but note is active
  142 |     await page.locator('[data-testid="tab-workspace"]').click();
  143 |     await expect(page.locator('[data-testid="file-item-external_my_local_folder_mesh.stl-disabled"]')).toBeVisible();
  144 |     await expect(page.locator('[data-testid="file-item-external_my_local_folder_note.md"]')).toBeVisible();
  145 |   });
  146 | 
  147 |   test('T3_COMB_8: Disabling CAD Viewer disables default app button for STL files (BRIDGE + TOGGLE)', async ({ page }) => {
  148 |     // Select stl file, default app button should be active
  149 |     await page.locator('[data-testid="file-item-gear.stl"]').click();
  150 |     const btn = page.locator('[data-testid="open-default-app-btn"]');
  151 |     await expect(btn).toBeVisible();
  152 |     await expect(btn).not.toBeDisabled();
  153 | 
  154 |     // Disable CAD
  155 |     await page.locator('[data-testid="tab-settings"]').click();
  156 |     await page.locator('[data-testid="toggle-cad-viewer"]').click();
  157 |     await page.locator('[data-testid="save-settings-btn"]').click();
  158 |     
  159 |     // Select STL file (now disabled), check default app btn is disabled
  160 |     await page.locator('[data-testid="tab-workspace"]').click();
  161 |     await expect(btn).toBeDisabled();
  162 |   });
  163 | 
  164 |   test('T3_COMB_9: Editing C++ file inline updates the code viewer in other views (INLINE + VIEW)', async ({ page }) => {
  165 |     await page.locator('[data-testid="file-item-solver.cpp"]').click();
  166 |     await page.locator('[data-testid="edit-inline-btn"]').click();
  167 |     
  168 |     const textarea = page.locator('[data-testid="inline-code-textarea"]');
  169 |     await textarea.fill('int main_edited() { return 1; }');
  170 |     await page.locator('[data-testid="edit-inline-btn"]').click(); // Save
  171 |     
  172 |     // Verify changes rendered instantly
  173 |     await expect(page.locator('[data-testid="code-viewer"]')).toContainText('main_edited');
  174 |   });
  175 | 
  176 |   test('T3_COMB_10: Office conversion to PDF respects active theme styling for loader panel (OFFICE + THEME)', async ({ page }) => {
  177 |     // Select Colored Glass
  178 |     await page.locator('[data-testid="tab-settings"]').click();
  179 |     await page.locator('[data-testid="theme-select"]').selectOption('Colored Glass Mode');
  180 |     await page.locator('[data-testid="save-settings-btn"]').click();
  181 | 
  182 |     // Load office file
  183 |     await page.locator('[data-testid="tab-workspace"]').click();
  184 |     await page.locator('[data-testid="file-item-document.docx"]').click();
  185 |     
  186 |     // Loader should be active
> 187 |     await expect(page.locator('[data-testid="office-loader"]')).toBeVisible();
      |                                                                 ^ Error: expect(locator).toBeVisible() failed
  188 |   });
  189 | });
  190 | 
```