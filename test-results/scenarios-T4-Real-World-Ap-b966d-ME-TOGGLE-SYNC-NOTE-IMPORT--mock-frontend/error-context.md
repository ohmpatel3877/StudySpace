# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: scenarios.spec.ts >> T4: Real-World Application Scenarios >> T4_SCENARIO_5: Fresh User Initialization & Settings Workspace Setup (CORE + THEME + TOGGLE + SYNC + NOTE + IMPORT)
- Location: tests\scenarios.spec.ts:151:3

# Error details

```
Error: expect(locator).toHaveClass(expected) failed

Locator: locator('html')
Expected pattern: /theme-amoled/
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
  95  |     await expect(page.locator('html')).toHaveClass(/theme-colored-glass/);
  96  | 
  97  |     // 3. Create history_essay.md
  98  |     await page.locator('[data-testid="tab-workspace"]').click();
  99  |     await page.locator('[data-testid="new-file-name"]').fill('history_essay.md');
  100 |     await page.locator('[data-testid="create-file-btn"]').click();
  101 |     await expect(page.locator('[data-testid="editor-header-title"]')).toHaveText('history_essay.md');
  102 | 
  103 |     // 4. Fill paragraphs
  104 |     const essayContent = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.\n\nFourth paragraph.\n\nFifth paragraph.';
  105 |     await page.locator('[data-testid="markdown-textarea"]').fill(essayContent);
  106 |     
  107 |     // 5. Preview
  108 |     await page.locator('[data-testid="preview-toggle"]').click();
  109 |     await expect(page.locator('[data-testid="markdown-preview"]')).toContainText('First paragraph.');
  110 |     await page.locator('[data-testid="preview-toggle"]').click();
  111 |     await page.locator('[data-testid="save-button"]').click();
  112 | 
  113 |     // 6. Reload and verify settings persist
  114 |     await page.reload();
  115 |     await expect(page.locator('html')).toHaveClass(/theme-colored-glass/);
  116 |     await expect(page.locator('[data-testid="tab-d2l"]')).toBeHidden();
  117 |     await page.locator('[data-testid="file-item-history_essay.md"]').click();
  118 |     await expect(page.locator('[data-testid="markdown-textarea"]')).toHaveValue(essayContent);
  119 |   });
  120 | 
  121 |   test('T4_SCENARIO_4: Project Presentation Asset Check (CORE + NOTE + VIEW + THEME)', async ({ page }) => {
  122 |     // 1. Click syllabus.pdf
  123 |     await page.locator('[data-testid="file-item-syllabus.pdf"]').click();
  124 |     await expect(page.locator('[data-testid="pdf-iframe"]')).toBeVisible();
  125 | 
  126 |     // 2. Open homework.md
  127 |     await page.locator('[data-testid="file-item-homework.md"]').click();
  128 | 
  129 |     // 3. Theme Light Mode
  130 |     await page.locator('[data-testid="tab-settings"]').click();
  131 |     await page.locator('[data-testid="theme-select"]').selectOption('Light Mode');
  132 |     await page.locator('[data-testid="save-settings-btn"]').click();
  133 |     await expect(page.locator('html')).toHaveClass(/theme-light/);
  134 | 
  135 |     // 4. Select gear.stl
  136 |     await page.locator('[data-testid="tab-workspace"]').click();
  137 |     await page.locator('[data-testid="file-item-gear.stl"]').click();
  138 |     await expect(page.locator('[data-testid="cad-viewer"]')).toBeVisible();
  139 | 
  140 |     // 5. Back to PDF
  141 |     await page.locator('[data-testid="file-item-syllabus.pdf"]').click();
  142 |     await expect(page.locator('[data-testid="pdf-iframe"]')).toBeVisible();
  143 | 
  144 |     // 6. Save delivery note
  145 |     await page.locator('[data-testid="file-item-homework.md"]').click();
  146 |     const textarea = page.locator('[data-testid="markdown-textarea"]');
  147 |     await textarea.fill('Presentation review comment.');
  148 |     await page.locator('[data-testid="save-button"]').click();
  149 |   });
  150 | 
  151 |   test('T4_SCENARIO_5: Fresh User Initialization & Settings Workspace Setup (CORE + THEME + TOGGLE + SYNC + NOTE + IMPORT)', async ({ page }) => {
  152 |     // Clear state
  153 |     await page.evaluate(() => {
  154 |       localStorage.clear();
  155 |     });
  156 |     await page.reload();
  157 | 
  158 |     // 1. Verify default values
  159 |     await expect(page.locator('html')).toHaveClass(/theme-dark/);
  160 |     await expect(page.locator('[data-testid="tab-d2l"]')).toBeVisible();
  161 | 
  162 |     // 2. Select AMOLED Mode & Disable CAD Viewer & Import external location
  163 |     await page.locator('[data-testid="tab-settings"]').click();
  164 |     await page.locator('[data-testid="theme-select"]').selectOption('AMOLED Mode');
  165 |     await page.locator('[data-testid="toggle-cad-viewer"]').click(); // Disable CAD
  166 |     await page.locator('[data-testid="d2l-feed-url-input"]').fill('https://d2l.myuniversity.edu/feed_fresh.ics');
  167 |     
  168 |     // Import location
  169 |     await page.locator('[data-testid="import-type-select"]').selectOption('local');
  170 |     await page.locator('[data-testid="import-path-input"]').fill('/ext/my_local_folder');
  171 |     await page.locator('[data-testid="import-submit-btn"]').click();
  172 |     await expect(page.locator('[data-testid="imported-locations-list"]')).toContainText('/ext/my_local_folder');
  173 |     
  174 |     await page.locator('[data-testid="save-settings-btn"]').click();
  175 | 
  176 |     // 3. Verify CAD disappears from explorer but imported files show
  177 |     await page.locator('[data-testid="tab-workspace"]').click();
  178 |     await expect(page.locator('[data-testid="file-item-gear.stl-disabled"]')).toBeVisible();
  179 |     await expect(page.locator('[data-testid="file-item-external_my_local_folder_note.md"]')).toBeVisible();
  180 | 
  181 |     // 4. Sync calendar
  182 |     await page.locator('[data-testid="tab-d2l"]').click();
  183 |     await page.locator('[data-testid="d2l-sync-button"]').click();
  184 |     await expect(page.locator('[data-testid="d2l-event-item"]')).toHaveCount(2);
  185 | 
  186 |     // 5. Create new note
  187 |     await page.locator('[data-testid="tab-workspace"]').click();
  188 |     await page.locator('[data-testid="new-file-name"]').fill('Semester_Goals.md');
  189 |     await page.locator('[data-testid="create-file-btn"]').click();
  190 |     await page.locator('[data-testid="markdown-textarea"]').fill('# Semester Goals\n- Get straight As');
  191 |     await page.locator('[data-testid="save-button"]').click();
  192 | 
  193 |     // 6. Reload and check
  194 |     await page.reload();
> 195 |     await expect(page.locator('html')).toHaveClass(/theme-amoled/);
      |                                        ^ Error: expect(locator).toHaveClass(expected) failed
  196 |     await expect(page.locator('[data-testid="file-item-gear.stl-disabled"]')).toBeVisible();
  197 |     
  198 |     // Verify external files still visible
  199 |     await expect(page.locator('[data-testid="file-item-external_my_local_folder_note.md"]')).toBeVisible();
  200 |     
  201 |     await page.locator('[data-testid="tab-settings"]').click();
  202 |     await expect(page.locator('[data-testid="d2l-feed-url-input"]')).toHaveValue('https://d2l.myuniversity.edu/feed_fresh.ics');
  203 |     await expect(page.locator('[data-testid="imported-locations-list"]')).toContainText('/ext/my_local_folder');
  204 |   });
  205 | });
  206 | 
```