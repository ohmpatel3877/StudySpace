# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: toggle.spec.ts >> TOGGLE: Modular Feature Toggles >> T2_TOGGLE_1: Disabling features during active loading processes
- Location: tests\toggle.spec.ts:64:3

# Error details

```
Error: expect(locator).toBeHidden() failed

Locator:  locator('[data-testid="cad-viewer"]')
Expected: hidden
Received: visible
Timeout:  5000ms

Call log:
  - Expect "toBeHidden" with timeout 5000ms
  - waiting for locator('[data-testid="cad-viewer"]')
    14 × locator resolved to <div class="" id="viewer-cad" data-testid="cad-viewer">…</div>
       - unexpected value "visible"

```

```yaml
- checkbox "Auto-Rotate Mesh"
- text: Auto-Rotate Mesh WebGL Context Active
```

# Test source

```ts
  1   | import { expect } from '@playwright/test';
  2   | import { test } from './mocks/tauri-ipc-mock';
  3   | 
  4   | test.describe('TOGGLE: Modular Feature Toggles', () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await page.goto('/');
  7   |   });
  8   | 
  9   |   test('T1_TOGGLE_1: Disabling D2L Sync hides UI Tabs', async ({ page }) => {
  10  |     await page.locator('[data-testid="tab-settings"]').click();
  11  |     
  12  |     // Toggle D2L Sync Off
  13  |     await page.locator('[data-testid="toggle-d2l-sync"]').click();
  14  |     await page.locator('[data-testid="save-settings-btn"]').click();
  15  |     
  16  |     await expect(page.locator('[data-testid="tab-d2l"]')).toBeHidden();
  17  |   });
  18  | 
  19  |   test('T1_TOGGLE_2: Disabling CAD Viewer hides UI Controls', async ({ page }) => {
  20  |     await page.locator('[data-testid="tab-settings"]').click();
  21  |     
  22  |     // Toggle CAD Off
  23  |     await page.locator('[data-testid="toggle-cad-viewer"]').click();
  24  |     await page.locator('[data-testid="save-settings-btn"]').click();
  25  |     
  26  |     // Verify CAD file is grayed-out/disabled
  27  |     await expect(page.locator('[data-testid="file-item-gear.stl-disabled"]')).toBeVisible();
  28  |   });
  29  | 
  30  |   test('T1_TOGGLE_3: Re-enabling Features restores visual components', async ({ page }) => {
  31  |     await page.locator('[data-testid="tab-settings"]').click();
  32  |     
  33  |     // Disable and then re-enable
  34  |     await page.locator('[data-testid="toggle-d2l-sync"]').click(); // Disabled
  35  |     await page.locator('[data-testid="toggle-d2l-sync"]').click(); // Enabled
  36  |     await page.locator('[data-testid="save-settings-btn"]').click();
  37  |     
  38  |     await expect(page.locator('[data-testid="tab-d2l"]')).toBeVisible();
  39  |   });
  40  | 
  41  |   test('T1_TOGGLE_4: Toggle Config Persistence', async ({ page }) => {
  42  |     await page.locator('[data-testid="tab-settings"]').click();
  43  |     await page.locator('[data-testid="toggle-cad-viewer"]').click(); // Disable
  44  |     await page.locator('[data-testid="save-settings-btn"]').click();
  45  |     
  46  |     await page.reload();
  47  |     
  48  |     await expect(page.locator('[data-testid="file-item-gear.stl-disabled"]')).toBeVisible();
  49  |   });
  50  | 
  51  |   test('T1_TOGGLE_5: Screen Realignment on Feature Hiding', async ({ page }) => {
  52  |     await page.locator('[data-testid="tab-settings"]').click();
  53  |     await page.locator('[data-testid="toggle-cad-viewer"]').click(); // Disable
  54  |     await page.locator('[data-testid="save-settings-btn"]').click();
  55  |     
  56  |     // Return to workspace
  57  |     await page.locator('[data-testid="tab-workspace"]').click();
  58  |     
  59  |     // Attempting to select disabled file does not open it
  60  |     await page.locator('[data-testid="file-item-gear.stl-disabled"]').click();
  61  |     await expect(page.locator('[data-testid="cad-viewer"]')).toBeHidden();
  62  |   });
  63  | 
  64  |   test('T2_TOGGLE_1: Disabling features during active loading processes', async ({ page }) => {
  65  |     // Select stl file first (starts rendering animation loop)
  66  |     await page.locator('[data-testid="file-item-gear.stl"]').click();
  67  |     await expect(page.locator('[data-testid="cad-viewer"]')).toBeVisible();
  68  | 
  69  |     // Disable feature
  70  |     await page.locator('[data-testid="tab-settings"]').click();
  71  |     await page.locator('[data-testid="toggle-cad-viewer"]').click();
  72  |     await page.locator('[data-testid="save-settings-btn"]').click();
  73  |     
  74  |     // Go back to workspace, verify it's disabled and canvas is cleared/hidden
  75  |     await page.locator('[data-testid="tab-workspace"]').click();
> 76  |     await expect(page.locator('[data-testid="cad-viewer"]')).toBeHidden();
      |                                                              ^ Error: expect(locator).toBeHidden() failed
  77  |   });
  78  | 
  79  |   test('T2_TOGGLE_2: Disk Space Full on Settings Write', async ({ page }) => {
  80  |     // Mock save_settings failure
  81  |     await page.evaluate(() => {
  82  |       (window as any).__TAURI_IPC__ = async (message: any) => {
  83  |         if (message.cmd === 'save_settings') {
  84  |           return (window as any)[message.error]('Disk Full');
  85  |         }
  86  |         return (window as any)[message.callback](null);
  87  |       };
  88  |     });
  89  |     
  90  |     await page.locator('[data-testid="tab-settings"]').click();
  91  |     await page.locator('[data-testid="toggle-d2l-sync"]').click();
  92  |     await page.locator('[data-testid="save-settings-btn"]').click();
  93  |     
  94  |     // Toast should report persist failure
  95  |     await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/Failed to persist configurations/);
  96  |   });
  97  | 
  98  |   test('T2_TOGGLE_3: Deep-Link Routing with Modules disabled', async ({ page }) => {
  99  |     // Navigate with D2L sync disabled
  100 |     await page.locator('[data-testid="tab-settings"]').click();
  101 |     await page.locator('[data-testid="toggle-d2l-sync"]').click(); // disable
  102 |     await page.locator('[data-testid="save-settings-btn"]').click();
  103 |     
  104 |     // Verify D2L panel stays hidden
  105 |     await expect(page.locator('[data-testid="tab-d2l"]')).toBeHidden();
  106 |   });
  107 | 
  108 |   test('T2_TOGGLE_4: Toggling all modular packages OFF simultaneously', async ({ page }) => {
  109 |     await page.locator('[data-testid="tab-settings"]').click();
  110 |     await page.locator('[data-testid="toggle-d2l-sync"]').click(); // disable D2L
  111 |     await page.locator('[data-testid="toggle-cad-viewer"]').click(); // disable CAD
  112 |     await page.locator('[data-testid="save-settings-btn"]').click();
  113 |     
  114 |     await expect(page.locator('[data-testid="tab-d2l"]')).toBeHidden();
  115 |     await expect(page.locator('[data-testid="file-item-gear.stl-disabled"]')).toBeVisible();
  116 |   });
  117 | 
  118 |   test('T2_TOGGLE_5: Corrupted Toggles State Recovery', async ({ page }) => {
  119 |     // Inject corrupt active features
  120 |     await page.addInitScript(() => {
  121 |       const state = (window as any).__MOCK_STATE__;
  122 |       state.settings.active_features = 'corrupt';
  123 |     });
  124 |     
  125 |     await page.reload();
  126 |     
  127 |     // It should recover by keeping default active features enabled
  128 |     await expect(page.locator('[data-testid="tab-d2l"]')).toBeVisible();
  129 |   });
  130 | });
  131 | 
```