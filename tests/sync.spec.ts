import { expect } from '@playwright/test';
import { test } from './mocks/tauri-ipc-mock';

test.describe('SYNC: D2L Calendar Feed Sync', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('T1_SYNC_1: Settings Input accepts iCal Feed URL', async ({ page }) => {
    await page.locator('[data-testid="tab-settings"]').click();
    const input = page.locator('[data-testid="d2l-feed-url-input"]');
    await input.fill('https://d2l.myuniversity.edu/feed_custom.ics');
    await page.locator('[data-testid="save-settings-btn"]').click();
    
    // Check persist state
    const savedUrl = await page.evaluate(() => (window as any).__MOCK_STATE__.settings.d2l_feed_url);
    expect(savedUrl).toBe('https://d2l.myuniversity.edu/feed_custom.ics');
  });

  test('T1_SYNC_2: Feed Fetch & Parse Execution', async ({ page }) => {
    await page.locator('[data-testid="tab-d2l"]').click();
    await page.locator('[data-testid="d2l-sync-button"]').click();
    
    const logs = await page.evaluate(() => (window as any).__MOCK_STATE__.commandsLog);
    const fetchLog = logs.find((l: any) => l.cmd === 'fetch_and_parse_d2l');
    expect(fetchLog).toBeDefined();
    expect(fetchLog.cmd_args.url).toContain('feed.ics');
  });

  test('T1_SYNC_3: Calendar Dashboard Events Display', async ({ page }) => {
    await page.locator('[data-testid="tab-d2l"]').click();
    await page.locator('[data-testid="d2l-sync-button"]').click();
    
    const eventItems = page.locator('[data-testid="d2l-event-item"]');
    await expect(eventItems).toHaveCount(2);
    await expect(eventItems.first()).toContainText('Calculus Midterm');
    await expect(eventItems.nth(1)).toContainText('Physics Lab Report');
  });

  test('T1_SYNC_4: Invalid URL Warning Presentation', async ({ page }) => {
    // Save bad URL
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="d2l-feed-url-input"]').fill('bad-url');
    await page.locator('[data-testid="save-settings-btn"]').click();
    
    // Sync
    await page.locator('[data-testid="tab-d2l"]').click();
    await page.locator('[data-testid="d2l-sync-button"]').click();
    
    await expect(page.locator('[data-testid="d2l-sync-status"]')).toHaveText('Sync failed');
    await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/Invalid URL or connection issue/);
  });

  test('T1_SYNC_5: Local Event Data Load Persistence', async ({ page }) => {
    // Verify URL persists on reload
    await page.locator('[data-testid="tab-settings"]').click();
    await page.locator('[data-testid="d2l-feed-url-input"]').fill('https://d2l.myuniversity.edu/feed_persisted.ics');
    await page.locator('[data-testid="save-settings-btn"]').click();
    
    await page.reload();
    await page.locator('[data-testid="tab-settings"]').click();
    await expect(page.locator('[data-testid="d2l-feed-url-input"]')).toHaveValue('https://d2l.myuniversity.edu/feed_persisted.ics');
  });

  test('T2_SYNC_1: Network Timeout Recovery', async ({ page }) => {
    // Make the backend time out on this one command. Tauri 2 signals failure
    // by rejecting the invoke promise; delegate everything else to the real
    // mock handler so the rest of the app keeps working.
    await page.evaluate(() => {
      const internals = (window as any).__TAURI_INTERNALS__;
      const passthrough = internals.invoke;
      internals.invoke = async (cmd: string, args: any) => {
        if (cmd === 'fetch_and_parse_d2l') {
          throw new Error('Timeout fetching iCal feed');
        }
        return passthrough(cmd, args);
      };
    });
    
    await page.locator('[data-testid="tab-d2l"]').click();
    await page.locator('[data-testid="d2l-sync-button"]').click();
    
    await expect(page.locator('[data-testid="d2l-sync-status"]')).toHaveText('Sync failed');
    await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/Invalid URL or connection issue/);
  });

  test('T2_SYNC_2: Invalid/Broken iCal Content Parsing', async ({ page }) => {
    // Make the backend reject with a parse error on this one command.
    await page.evaluate(() => {
      const internals = (window as any).__TAURI_INTERNALS__;
      const passthrough = internals.invoke;
      internals.invoke = async (cmd: string, args: any) => {
        if (cmd === 'fetch_and_parse_d2l') {
          throw new Error('Parser error: invalid iCal formatting');
        }
        return passthrough(cmd, args);
      };
    });
    
    await page.locator('[data-testid="tab-d2l"]').click();
    await page.locator('[data-testid="d2l-sync-button"]').click();
    
    await expect(page.locator('[data-testid="d2l-sync-status"]')).toHaveText('Sync failed');
    await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/Invalid URL or connection issue/);
  });

  test('T2_SYNC_3: Massive iCal Dataset Processing', async ({ page }) => {
    // Mock 2000 events
    await page.evaluate(() => {
      const hugeEvents = Array.from({ length: 2000 }, (_, i) => ({
        id: `huge_${i}`,
        title: `Assignment Number ${i}`,
        description: `Description of task ${i}`,
        due_date: '2026-07-20T12:00:00Z'
      }));
      (window as any).__MOCK_STATE__.events = hugeEvents;
    });

    await page.locator('[data-testid="tab-d2l"]').click();
    await page.locator('[data-testid="d2l-sync-button"]').click();
    
    // Check that layout loaded without crash (items count is populated)
    const list = page.locator('[data-testid="d2l-event-item"]');
    await expect(list.first()).toBeVisible();
  });

  test('T2_SYNC_4: Offline Mode Sync Action', async ({ page }) => {
    // Simulate navigator.onLine = false
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    });
    
    await page.locator('[data-testid="tab-d2l"]').click();
    await page.locator('[data-testid="d2l-sync-button"]').click();
    
    await expect(page.locator('[data-testid="d2l-sync-status"]')).toHaveText('Offline');
    await expect(page.locator('[data-testid="toast-notification"]')).toHaveText(/Currently offline. Displaying cached dashboard data./);
  });

  test('T2_SYNC_5: UID Duplication Resolution', async ({ page }) => {
    // Inject duplicate event IDs but different contents or same ID twice
    await page.evaluate(() => {
      (window as any).__MOCK_STATE__.events = [
        { id: 'ev1', title: 'Calculus Midterm', description: 'Unique A', due_date: '2026-07-15T12:00:00Z' },
        { id: 'ev1', title: 'Calculus Midterm Duplicated', description: 'Unique B', due_date: '2026-07-15T12:00:00Z' }
      ];
    });

    await page.locator('[data-testid="tab-d2l"]').click();
    await page.locator('[data-testid="d2l-sync-button"]').click();

    // The mock application app.js render logic handles duplicate event filtering
    // Let's assert that only one unique event with id ev1 is displayed or key uniqueness is preserved
    const list = page.locator('[data-testid="d2l-event-item"]');
    await expect(list).toHaveCount(1);
  });
});
