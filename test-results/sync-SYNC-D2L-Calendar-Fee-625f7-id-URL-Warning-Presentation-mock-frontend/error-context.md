# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sync.spec.ts >> SYNC: D2L Calendar Feed Sync >> T1_SYNC_4: Invalid URL Warning Presentation
- Location: tests\sync.spec.ts:40:3

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator: locator('[data-testid="toast-notification"]')
Expected pattern: /Invalid URL or connection issue/
Error: strict mode violation: locator('[data-testid="toast-notification"]') resolved to 2 elements:
    1) <div class="toast border-blue-500" data-testid="toast-notification">Configurations saved successfully.</div> aka getByText('Configurations saved')
    2) <div class="toast border-blue-500" data-testid="toast-notification">Invalid URL or connection issue</div> aka getByText('Invalid URL or connection')

Call log:
  - Expect "toHaveText" with timeout 5000ms
  - waiting for locator('[data-testid="toast-notification"]')

```

# Page snapshot

```yaml
- generic [ref=e1]:
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
        - generic [ref=e43]:
          - heading "D2L Course Assignments Dashboard" [level=3] [ref=e44]
          - button "Sync Calendar" [active] [ref=e45] [cursor=pointer]
        - generic [ref=e46]: Sync failed
  - generic [ref=e47]:
    - generic [ref=e48]: Configurations saved successfully.
    - generic [ref=e49]: Invalid URL or connection issue
```

# Test source

```ts
  1   | import { expect } from '@playwright/test';
  2   | import { test } from './mocks/tauri-ipc-mock';
  3   | 
  4   | test.describe('SYNC: D2L Calendar Feed Sync', () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await page.goto('/');
  7   |   });
  8   | 
  9   |   test('T1_SYNC_1: Settings Input accepts iCal Feed URL', async ({ page }) => {
  10  |     await page.locator('[data-testid="tab-settings"]').click();
  11  |     const input = page.locator('[data-testid="d2l-feed-url-input"]');
  12  |     await input.fill('https://d2l.myuniversity.edu/feed_custom.ics');
  13  |     await page.locator('[data-testid="save-settings-btn"]').click();
  14  |     
  15  |     // Check persist state
  16  |     const savedUrl = await page.evaluate(() => (window as any).__MOCK_STATE__.settings.d2l_feed_url);
  17  |     expect(savedUrl).toBe('https://d2l.myuniversity.edu/feed_custom.ics');
  18  |   });
  19  | 
  20  |   test('T1_SYNC_2: Feed Fetch & Parse Execution', async ({ page }) => {
  21  |     await page.locator('[data-testid="tab-d2l"]').click();
  22  |     await page.locator('[data-testid="d2l-sync-button"]').click();
  23  |     
  24  |     const logs = await page.evaluate(() => (window as any).__MOCK_STATE__.commandsLog);
  25  |     const fetchLog = logs.find((l: any) => l.cmd === 'fetch_and_parse_d2l');
  26  |     expect(fetchLog).toBeDefined();
  27  |     expect(fetchLog.cmd_args.url).toContain('feed.ics');
  28  |   });
  29  | 
  30  |   test('T1_SYNC_3: Calendar Dashboard Events Display', async ({ page }) => {
  31  |     await page.locator('[data-testid="tab-d2l"]').click();
  32  |     await page.locator('[data-testid="d2l-sync-button"]').click();
  33  |     
  34  |     const eventItems = page.locator('[data-testid="d2l-event-item"]');
  35  |     await expect(eventItems).toHaveCount(2);
  36  |     await expect(eventItems.first()).toContainText('Calculus Midterm');
  37  |     await expect(eventItems.nth(1)).toContainText('Physics Lab Report');
  38  |   });
  39  | 
  40  |   test('T1_SYNC_4: Invalid URL Warning Presentation', async ({ page }) => {
  41  |     // Save bad URL
  42  |     await page.locator('[data-testid="tab-settings"]').click();
  43  |     await page.locator('[data-testid="d2l-feed-url-input"]').fill('bad-url');
  44  |     await page.locator('[data-testid="save-settings-btn"]').click();
  45  |     
  46  |     // Sync
  47  |     await page.locator('[data-testid="tab-d2l"]').click();
  48  |     await page.locator('[data-testid="d2l-sync-button"]').click();
  49  |     
  50  |     await expect(page.locator('[data-testid="d2l-sync-status"]')).toHaveText('Sync failed');
> 51  |     await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/Invalid URL or connection issue/);
      |                                                                      ^ Error: expect(locator).toHaveText(expected) failed
  52  |   });
  53  | 
  54  |   test('T1_SYNC_5: Local Event Data Load Persistence', async ({ page }) => {
  55  |     // Verify URL persists on reload
  56  |     await page.locator('[data-testid="tab-settings"]').click();
  57  |     await page.locator('[data-testid="d2l-feed-url-input"]').fill('https://d2l.myuniversity.edu/feed_persisted.ics');
  58  |     await page.locator('[data-testid="save-settings-btn"]').click();
  59  |     
  60  |     await page.reload();
  61  |     await page.locator('[data-testid="tab-settings"]').click();
  62  |     await expect(page.locator('[data-testid="d2l-feed-url-input"]')).toHaveValue('https://d2l.myuniversity.edu/feed_persisted.ics');
  63  |   });
  64  | 
  65  |   test('T2_SYNC_1: Network Timeout Recovery', async ({ page }) => {
  66  |     // Mock fetch_and_parse_d2l to timeout/throw error
  67  |     await page.evaluate(() => {
  68  |       const mockState = (window as any).__MOCK_STATE__;
  69  |       (window as any).__TAURI_IPC__ = async (message: any) => {
  70  |         const { cmd, error } = message;
  71  |         if (cmd === 'fetch_and_parse_d2l') {
  72  |           return (window as any)[error]('Timeout fetching iCal feed');
  73  |         }
  74  |         // Fallback for others
  75  |         if (cmd === 'load_settings') return (window as any)[message.callback](mockState.settings);
  76  |         return (window as any)[message.callback](null);
  77  |       };
  78  |     });
  79  |     
  80  |     await page.locator('[data-testid="tab-d2l"]').click();
  81  |     await page.locator('[data-testid="d2l-sync-button"]').click();
  82  |     
  83  |     await expect(page.locator('[data-testid="d2l-sync-status"]')).toHaveText('Sync failed');
  84  |     await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/Invalid URL or connection issue/);
  85  |   });
  86  | 
  87  |   test('T2_SYNC_2: Invalid/Broken iCal Content Parsing', async ({ page }) => {
  88  |     // Mock IPC feed parsing failure
  89  |     await page.evaluate(() => {
  90  |       const mockState = (window as any).__MOCK_STATE__;
  91  |       (window as any).__TAURI_IPC__ = async (message: any) => {
  92  |         const { cmd, error } = message;
  93  |         if (cmd === 'fetch_and_parse_d2l') {
  94  |           return (window as any)[error]('Parser error: invalid iCal formatting');
  95  |         }
  96  |         if (cmd === 'load_settings') return (window as any)[message.callback](mockState.settings);
  97  |         return (window as any)[message.callback](null);
  98  |       };
  99  |     });
  100 |     
  101 |     await page.locator('[data-testid="tab-d2l"]').click();
  102 |     await page.locator('[data-testid="d2l-sync-button"]').click();
  103 |     
  104 |     await expect(page.locator('[data-testid="d2l-sync-status"]')).toHaveText('Sync failed');
  105 |     await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/Invalid URL or connection issue/);
  106 |   });
  107 | 
  108 |   test('T2_SYNC_3: Massive iCal Dataset Processing', async ({ page }) => {
  109 |     // Mock 2000 events
  110 |     await page.evaluate(() => {
  111 |       const hugeEvents = Array.from({ length: 2000 }, (_, i) => ({
  112 |         id: `huge_${i}`,
  113 |         title: `Assignment Number ${i}`,
  114 |         description: `Description of task ${i}`,
  115 |         due_date: '2026-07-20T12:00:00Z'
  116 |       }));
  117 |       (window as any).__MOCK_STATE__.events = hugeEvents;
  118 |     });
  119 | 
  120 |     await page.locator('[data-testid="tab-d2l"]').click();
  121 |     await page.locator('[data-testid="d2l-sync-button"]').click();
  122 |     
  123 |     // Check that layout loaded without crash (items count is populated)
  124 |     const list = page.locator('[data-testid="d2l-event-item"]');
  125 |     await expect(list.first()).toBeVisible();
  126 |   });
  127 | 
  128 |   test('T2_SYNC_4: Offline Mode Sync Action', async ({ page }) => {
  129 |     // Simulate navigator.onLine = false
  130 |     await page.evaluate(() => {
  131 |       Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
  132 |     });
  133 |     
  134 |     await page.locator('[data-testid="tab-d2l"]').click();
  135 |     await page.locator('[data-testid="d2l-sync-button"]').click();
  136 |     
  137 |     await expect(page.locator('[data-testid="d2l-sync-status"]')).toHaveText('Offline');
  138 |     await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/Currently offline. Displaying cached dashboard data./);
  139 |   });
  140 | 
  141 |   test('T2_SYNC_5: UID Duplication Resolution', async ({ page }) => {
  142 |     // Inject duplicate event IDs but different contents or same ID twice
  143 |     await page.evaluate(() => {
  144 |       (window as any).__MOCK_STATE__.events = [
  145 |         { id: 'ev1', title: 'Calculus Midterm', description: 'Unique A', due_date: '2026-07-15T12:00:00Z' },
  146 |         { id: 'ev1', title: 'Calculus Midterm Duplicated', description: 'Unique B', due_date: '2026-07-15T12:00:00Z' }
  147 |       ];
  148 |     });
  149 | 
  150 |     await page.locator('[data-testid="tab-d2l"]').click();
  151 |     await page.locator('[data-testid="d2l-sync-button"]').click();
```