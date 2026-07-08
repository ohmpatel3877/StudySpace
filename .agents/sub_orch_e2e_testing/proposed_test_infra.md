# Proposed Test Infrastructure & E2E Test Suite Design

This document details the E2E testing framework, test harness design, and the 4-tier opaque-box test suite for **StudySpace**. 

---

## 1. Overview & Testing Methodology

StudySpace E2E testing is built on a **4-tier, requirement-driven, opaque-box testing methodology**. The application is verified from the user's perspective, either by launching the compiled desktop binary or by running the React web frontend with mocked Tauri IPC interfaces.

### The 4-Tier Test Structure

| Tier | Name | Target Quantity | Purpose |
|---|---|---|---|
| **Tier 1** | **Feature Coverage** | 30+ tests (>=5 per feature) | Verify that every core requirement works correctly under normal operating parameters. |
| **Tier 2** | **Boundary & Corner Cases** | 30+ tests (>=5 per feature) | Stress the system with invalid inputs, massive payloads, permission failures, and extreme resolutions. |
| **Tier 3** | **Cross-Feature Combinations** | 6+ tests | Verify that features do not interfere with each other and interact cleanly. |
| **Tier 4** | **Real-World Scenarios** | 5+ scenarios | Verify multi-step, complex user journeys representing actual collegiate use cases. |

### Core Feature Scope (R1 - R6)

1. **Feature 1 (CORE)**: Core Tauri Desktop Application Architecture (glassmorphic dark UI, main container, layout responsiveness) [R1]
2. **Feature 2 (NOTE)**: Markdown Note Editor & File Explorer (reading, writing, previewing notes, vault sidebar) [R2]
3. **Feature 3 (VIEW)**: Resource Viewer (PDF embedding, C/C++ syntax code highlighting, Three.js 3D canvas for STL/OBJ) [R3]
4. **Feature 4 (SYNC)**: D2L Calendar Feed Sync (private iCal feed setting, syncing, parsing, storing, and rendering tasks) [R4]
5. **Feature 5 (THEME)**: Custom Theme Engine (dynamic theme swapping, persistence, styling variations) [R5]
6. **Feature 6 (TOGGLE)**: Modular Feature Toggles (enabling/disabling D2L and CAD features, layout reflow, configuration persistence) [R6]

---

## 2. Test Harness & Mocking Design

The test harness uses **Playwright** (for browser-based visual and interaction tests) and **Vitest** (for lightning-fast headless component verification).

### Dual-Execution Architecture

To facilitate rapid feedback during development and absolute verification before release, the test harness supports two execution modes:

```
                  +----------------------------------+
                  |      Playwright Test Runner      |
                  +----------------------------------+
                                   |
                  +----------------+----------------+
                  |                                 |
     [A. Mocked Frontend Mode]           [B. Tauri Binary Mode]
                  |                                 |
  +---------------+---------------+       +---------+---------+
  |  - Launches Vite Dev Server   |       |  - Builds Tauri App |
  |  - Injects window.__TAURI__   |       |  - Launches Binary  |
  |    IPC mock implementations   |       |  - Automates UI     |
  |  - Fast, headless test run   |       |    via Webview      |
  +-------------------------------+       +---------------------+
```

### A. Mocked IPC Setup (Playwright Init Script)

During frontend testing, we intercept Tauri IPC calls by injecting a mock handler into `window.__TAURI_IPC__` before the DOM loads.

```typescript
// tests/mocks/tauri-ipc-mock.ts
import { test as base } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    // Inject Tauri API mock before application boot
    await page.addInitScript(() => {
      const mockVaultFiles = [
        { name: 'welcome.md', path: '/vault/welcome.md', is_dir: false, ext: 'md' },
        { name: 'homework.md', path: '/vault/homework.md', is_dir: false, ext: 'md' },
        { name: 'syllabus.pdf', path: '/vault/syllabus.pdf', is_dir: false, ext: 'pdf' },
        { name: 'gear.stl', path: '/vault/gear.stl', is_dir: false, ext: 'stl' },
        { name: 'solver.cpp', path: '/vault/solver.cpp', is_dir: false, ext: 'cpp' }
      ];

      let mockSettings = {
        theme: 'Dark Mode',
        active_features: ['d2l_sync', 'cad_viewer'],
        d2l_feed_url: 'https://d2l.myuniversity.edu/feed.ics'
      };

      const mockD2lEvents = [
        { id: 'ev1', title: 'Calculus Midterm', description: 'Covers Ch 1-4', due_date: '2026-07-15T12:00:00Z' },
        { id: 'ev2', title: 'Physics Lab Report', description: 'Submit via dropbox', due_date: '2026-07-18T23:59:00Z' }
      ];

      const mockFileContent: Record<string, string> = {
        '/vault/welcome.md': '# Welcome\nStudySpace is active!',
        '/vault/homework.md': '# Homework 1\nPending answers...',
        '/vault/solver.cpp': '#include <iostream>\n\nint main() {\n  std::cout << "Hello World";\n  return 0;\n}'
      };

      window.__TAURI_IPC__ = async (message: any) => {
        const { cmd, callback, error, cmd_args } = message;
        const respond = (data: any) => (window as any)[callback](data);
        const reject = (err: any) => (window as any)[error](err);

        try {
          switch (cmd) {
            case 'get_vault_files':
              return respond(mockVaultFiles);
            case 'read_vault_file':
              const rPath = message.path || (cmd_args && cmd_args.path);
              if (mockFileContent[rPath]) {
                return respond(mockFileContent[rPath]);
              }
              if (rPath.endsWith('.stl') || rPath.endsWith('.pdf')) {
                return respond('BASE64_MOCK_DATA_STREAM');
              }
              return reject('File not found');
            case 'write_vault_file':
              const wPath = message.path || (cmd_args && cmd_args.path);
              const wContent = message.content || (cmd_args && cmd_args.content);
              mockFileContent[wPath] = wContent;
              return respond(null);
            case 'fetch_and_parse_d2l':
              const url = message.url || (cmd_args && cmd_args.url);
              if (!url || !url.startsWith('http')) {
                return reject('Invalid iCal feed URL');
              }
              return respond(mockD2lEvents);
            case 'load_settings':
              return respond(mockSettings);
            case 'save_settings':
              const settings = message.settings || (cmd_args && cmd_args.settings);
              mockSettings = { ...mockSettings, ...settings };
              return respond(null);
            default:
              return reject(`Unhandled command: ${cmd}`);
          }
        } catch (e: any) {
          return reject(e.message);
        }
      };
      
      // Define a flag indicating testing mode
      (window as any).__MOCK_TAURI_ACTIVE__ = true;
    });
    await use(page);
  }
});
```

### B. UI Component Verification Rules

Our Playwright tests will target specific selectors to verify complex components:

1. **Markdown Editor (`Editor.tsx`)**:
   - Locate editor area: `textarea[data-testid="markdown-textarea"]`
   - Locate preview pane: `div[data-testid="markdown-preview"]`
   - Assert HTML translation: `await expect(page.locator('data-testid=markdown-preview >> h1')).toHaveText('Title')`
2. **Split Pane (`Layout.tsx`)**:
   - Drag bar element: `div[data-testid="split-pane-resizer"]`
   - Dragging split pane: Move mouse down, drag to target coordinates, release mouse. Verify widths change.
3. **Three.js Canvas (`CadViewer.tsx`)**:
   - Locate target container: `div[data-testid="cad-viewer"]`
   - Locate canvas: `canvas[data-testid="three-canvas"]`
   - WebGL detection test: Verify that the canvas context supports WebGL.
   - Mouse Orbit Controls interaction: Trigger `mousedown`, `mousemove`, and `mouseup` to simulate rotating models. Check that requestAnimationFrame registers state change.
4. **PDF Viewer (`PdfViewer.tsx`)**:
   - Locate element: `iframe[data-testid="pdf-iframe"]` or `embed[data-testid="pdf-embed"]`
   - Assert properties: `await expect(page.locator('[data-testid="pdf-iframe"]')).toHaveAttribute('src', /base64|pdf/)`
5. **D2L Sync Dashboard (`D2LDashboard.tsx`)**:
   - Main card checklist: `div[data-testid="d2l-dashboard"]`
   - List count: `await expect(page.locator('[data-testid="d2l-event-item"]')).toHaveCount(2)`
6. **Theme Engine Switcher (`Settings.tsx` & `useTheme.ts`)**:
   - Select option: `select[data-testid="theme-select"]`
   - Theme class verification: `await expect(page.locator('html')).toHaveClass(/theme-amoled/)` or assert matching background styles.
7. **Toggle Switches (`Settings.tsx` & `useFeatures.ts`)**:
   - Check status: `button[data-testid="toggle-cad-viewer"]`
   - Feature hide check: `await expect(page.locator('[data-testid="cad-tab"]')).not.toBeVisible()`

---

## 3. Tier 1: Feature Coverage (30 Tests)

### CORE: Core Tauri App (R1)
*   **T1_CORE_1: Glassmorphic Dark UI Theme Validation**
    *   *Action*: Launch application; inspect root styling class names and CSS custom properties.
    *   *Expected*: The body has class list with glassmorphism values (e.g. `backdrop-blur-md`, `bg-opacity-50`, dark backgrounds).
*   **T1_CORE_2: Sidebar Layout Grid and Panes Presence**
    *   *Action*: Query DOM for primary structural segments.
    *   *Expected*: Layout renders Sidebar (`[data-testid="sidebar"]`), Editor panel (`[data-testid="editor-pane"]`), and Viewer panel (`[data-testid="viewer-pane"]`).
*   **T1_CORE_3: Layout Adaptability on Window Resize**
    *   *Action*: Set window viewport to 1024x768, then 1920x1080.
    *   *Expected*: Main container and panels adjust width and height dynamically without overlaying or breaking borders.
*   **T1_CORE_4: Tauri Frontend IPC Bridge Connectivity**
    *   *Action*: Spy on IPC invoke channel on startup.
    *   *Expected*: Frontend calls `load_settings` and `get_vault_files` on initial render.
*   **T1_CORE_5: Dark-Theme Active by Default**
    *   *Action*: Launch application with empty local storage.
    *   *Expected*: Theme defaults to a dark profile; text elements are readable with high contrast colors.

### NOTE: Markdown Note Editor & File Explorer (R2)
*   **T1_NOTE_1: Sidebar Explorer Populates File Tree**
    *   *Action*: Render file explorer sidebar.
    *   *Expected*: Directory tree displays all files returned by `get_vault_files` (e.g., `welcome.md`, `syllabus.pdf`).
*   **T1_NOTE_2: Selecting Markdown File Loads into Editor**
    *   *Action*: Click on `welcome.md` in sidebar explorer.
    *   *Expected*: Editor text content contains `# Welcome\nStudySpace is active!`.
*   **T1_NOTE_3: Editor File Editing & Save Operation**
    *   *Action*: Type `# Hello World` in editor textarea and click "Save".
    *   *Expected*: Tauri backend triggers `write_vault_file` with arguments path and content.
*   **T1_NOTE_4: Title/Filename Rendering in Header**
    *   *Action*: Click on `homework.md` in the sidebar.
    *   *Expected*: Header label `[data-testid="editor-header-title"]` reads `homework.md`.
*   **T1_NOTE_5: Live Markdown Rendering Toggle (Edit vs Preview)**
    *   *Action*: Click "Preview" button on editor toolbar.
    *   *Expected*: Editor enters preview state; textarea is hidden, and HTML is rendered (e.g. `<h1>Welcome</h1>`).

### VIEW: CAD Model & Document Viewer (R3)
*   **T1_VIEW_1: Resource Panel Dynamic Switching by Extension**
    *   *Action*: Sequential clicking in sidebar: `syllabus.pdf` -> `gear.stl` -> `solver.cpp`.
    *   *Expected*: Resource panel switches viewers from PDF to Three.js Canvas to Code Highlighter.
*   **T1_VIEW_2: PDF Viewer Embedding**
    *   *Action*: Click `syllabus.pdf`.
    *   *Expected*: PDF viewer displays embedded iframe or embed node pointing to the PDF resource.
*   **T1_VIEW_3: C/C++ Syntax Highlighting**
    *   *Action*: Click `solver.cpp`.
    *   *Expected*: Code viewer loads containing parsed code styled with keyword token CSS classes.
*   **T1_VIEW_4: Three.js 3D Viewport Initialization**
    *   *Action*: Click `gear.stl`.
    *   *Expected*: CAD viewer panel mounts a `<canvas>` element with Three.js rendering engine initialized.
*   **T1_VIEW_5: 3D Camera Controls Verification**
    *   *Action*: Simulate mouse scroll on the canvas element.
    *   *Expected*: Three.js camera state updates zoom distance, triggering rendering cycle.

### SYNC: D2L Calendar Feed Sync (R4)
*   **T1_SYNC_1: Settings Input accepts iCal Feed URL**
    *   *Action*: Enter settings page, input private D2L URL, click "Save".
    *   *Expected*: Input field updates and URL parses without errors.
*   **T1_SYNC_2: Feed Fetch & Parse Execution**
    *   *Action*: Click "Sync" button on iCal section.
    *   *Expected*: Backend triggers `fetch_and_parse_d2l`, returns event payload.
*   **T1_SYNC_3: Calendar Dashboard Events Display**
    *   *Action*: Open D2L dashboard tab.
    *   *Expected*: Renders list with test events (Calculus Midterm, Physics Lab Report) displaying titles, descriptions, and dates.
*   **T1_SYNC_4: Invalid URL Warning Presentation**
    *   *Action*: Input `bad-url` into settings feed input and click "Sync".
    *   *Expected*: UI displays warning message: "Invalid URL or connection issue".
*   **T1_SYNC_5: Local Event Data Load Persistence**
    *   *Action*: Reload application after sync.
    *   *Expected*: D2L dashboard loads previously saved event list immediately from local settings without refetching.

### THEME: Custom Theme Engine (R5)
*   **T1_THEME_1: Light Mode Styling Switch**
    *   *Action*: Go to Settings, select "Light Mode" from dropdown.
    *   *Expected*: `html` or `body` class includes `theme-light` and layout styling transitions to light-accent glassmorphism.
*   **T1_THEME_2: AMOLED Preset Application**
    *   *Action*: Select "AMOLED Mode".
    *   *Expected*: Background shifts to pure black (`#000000`) and border variables adopt neon highlights.
*   **T1_THEME_3: Custom Palette Variable Injection**
    *   *Action*: Select "Colored Glass Mode" preset.
    *   *Expected*: Styling switches to a specific color variables palette (e.g. violet blur overlays).
*   **T1_THEME_4: Theme Selection Persistence**
    *   *Action*: Select "Light Mode", reload application.
    *   *Expected*: App loads instantly in Light Mode style.
*   **T1_THEME_5: Accessibility Contrast Evaluation**
    *   *Action*: Cycle through all themes.
    *   *Expected*: Accent text elements dynamically swap colors to ensure a high-contrast ratio.

### TOGGLE: Modular Feature Toggles (R6)
*   **T1_TOGGLE_1: Disabling D2L Sync hides UI Tabs**
    *   *Action*: Toggle OFF "D2L Calendar Sync" in Settings.
    *   *Expected*: The calendar dashboard tab is removed from the UI layout.
*   **T1_TOGGLE_2: Disabling CAD Viewer hides UI Controls**
    *   *Action*: Toggle OFF "3D CAD Viewer" in Settings.
    *   *Expected*: CAD render canvas and associated 3D file icons in sidebar explorer are hidden or disabled.
*   **T1_TOGGLE_3: Re-enabling Features restores visual components**
    *   *Action*: Toggle ON "3D CAD Viewer" and "D2L Calendar Sync".
    *   *Expected*: Tabs and options reappear in layout immediately without app reload.
*   **T1_TOGGLE_4: Toggle Config Persistence**
    *   *Action*: Toggle OFF "3D CAD Viewer", reload application.
    *   *Expected*: App loads with CAD Viewer features disabled and hidden.
*   **T1_TOGGLE_5: Screen Realignment on Feature Hiding**
    *   *Action*: Turn off 3D CAD Viewer.
    *   *Expected*: Left panel and editor adjust, or fallback message displays in empty viewer panel.

---

## 4. Tier 2: Boundary & Corner Cases (30 Tests)

### CORE: Core Tauri App (R1)
*   **T2_CORE_1: Ultra-Narrow Aspect Ratio Handling (Mobile dimensions)**
    *   *Action*: Set viewport size to 320x480.
    *   *Expected*: Sidebar collapses automatically or offers horizontal scrollbar to ensure buttons remain reachable.
*   **T2_CORE_2: Missing Tauri Context Fallback**
    *   *Action*: Run application in pure web environment (delete `window.__TAURI__`).
    *   *Expected*: App remains responsive, displaying web browser notification or mocking data instead of throwing fatal console errors.
*   **T2_CORE_3: High-Frequency Window Resizing Stress Test**
    *   *Action*: Resize viewport rapidly 50 times between 800x600 and 1920x1080.
    *   *Expected*: No layout overlap or memory bloat; CSS rendering stabilizes immediately.
*   **T2_CORE_4: Storage Corruption Recovery**
    *   *Action*: Set local storage/settings file to malformed JSON (`{"theme":`).
    *   *Expected*: Application resets settings to default config and launches safely.
*   **T2_CORE_5: DPI Scale Change Adaptation**
    *   *Action*: Trigger screen scaling/DPI change from 100% to 200%.
    *   *Expected*: Glassmorphic borders and text adjust layouts proportionally.

### NOTE: Markdown Note Editor & File Explorer (R2)
*   **T2_NOTE_1: Large Document Performance Stress Test**
    *   *Action*: Open `.md` containing 10,000 lines of text.
    *   *Expected*: File loads in under 500ms; typing text has zero perceptible lag.
*   **T2_NOTE_2: Concurrent File Modifications Handling**
    *   *Action*: Mock background file content update during active edit.
    *   *Expected*: UI alerts user to external modification or performs safe content merge.
*   **T2_NOTE_3: Special Characters and Emojis in Filename**
    *   *Action*: Create note named `notes_#_@_漢_🚀.md` and save content.
    *   *Expected*: File saves to disk with escaped URI characters, preserving unicode content.
*   **T2_NOTE_4: Write Action on Locked/Read-Only File**
    *   *Action*: Mock file system write failure due to permission errors.
    *   *Expected*: UI displays warning: "Permission denied, unable to save file" and does not wipe local editor state.
*   **T2_NOTE_5: Empty Folder & Blank Files Presentation**
    *   *Action*: Initialize vault with empty directory.
    *   *Expected*: File explorer shows empty directory indicator message ("No workspace files found").

### VIEW: CAD Model & Document Viewer (R3)
*   **T2_VIEW_1: Malformed/Empty PDF Document Error Handling**
    *   *Action*: Select a 0-byte `.pdf` file.
    *   *Expected*: PDF viewer displays fallback page stating: "Corrupted PDF or empty document".
*   **T2_VIEW_2: Corrupt STL/OBJ Mesh Rendering**
    *   *Action*: Load STL file with invalid vertex counts or missing headers.
    *   *Expected*: Canvas displays warning: "Invalid model file layout" without WebGL canvas crash.
*   **T2_VIEW_3: Code Viewer with Extremely Long Line Elements**
    *   *Action*: Load C++ file with a single line containing 10,000 continuous characters.
    *   *Expected*: Syntax highlighting works; line wraps or offers clean horizontal scroll without page lockup.
*   **T2_VIEW_4: Fast Rapid-Fire File Selection Stress Test**
    *   *Action*: Select 15 files of different formats within 500ms.
    *   *Expected*: Viewer cancels previous tasks, loads only the last selected file, and disposes old WebGL contexts.
*   **T2_VIEW_5: WebGL Context Loss Restoration**
    *   *Action*: Dispatch `webglcontextlost` on Three.js canvas.
    *   *Expected*: App displays message "WebGL context lost. Restoring..." and recovers smoothly.

### SYNC: D2L Calendar Feed Sync (R4)
*   **T2_SYNC_1: Network Timeout Recovery**
    *   *Action*: Simulate network delay of 30 seconds during iCal sync.
    *   *Expected*: Fetch aborts with timeout warning toast, and user can re-trigger sync.
*   **T2_SYNC_2: Invalid/Broken iCal Content Parsing**
    *   *Action*: Feed iCal parser with HTML login redirection response instead of ICS text.
    *   *Expected*: Parser detects invalid structure, throws error, and dashboard remains stable.
*   **T2_SYNC_3: Massive iCal Dataset Processing**
    *   *Action*: Sync feed containing 2,000+ past and future calendar entries.
    *   *Expected*: Calendar dashboard handles data in under 1 second, showing paginated or filtered list.
*   **T2_SYNC_4: Offline Mode Sync Action**
    *   *Action*: Turn off network (`navigator.onLine = false`), click "Sync".
    *   *Expected*: Toast warns user: "Currently offline. Displaying cached dashboard data."
*   **T2_SYNC_5: UID Duplication Resolution**
    *   *Action*: Sync feed with duplicate task UID fields.
    *   *Expected*: Engine filters and lists unique records; no duplicate key warnings in developer console.

### THEME: Custom Theme Engine (R5)
*   **T2_THEME_1: Swapping Theme during active 3D CAD rotation**
    *   *Action*: Spin STL mesh in viewer and toggle AMOLED theme.
    *   *Expected*: The theme CSS variables update; the CAD viewport continues rotation smoothly.
*   **T2_THEME_2: Theme file configuration Read Failure**
    *   *Action*: Mock Rust settings loading function to throw exception on startup.
    *   *Expected*: App defaults to standard Dark glassmorphic styling safely.
*   **T2_THEME_3: Rapid-Click Theme Toggle Stress Test**
    *   *Action*: Double-click theme presets 30 times quickly.
    *   *Expected*: Style changes execute sequentially, landing correctly on the last select option.
*   **T2_THEME_4: Theme Contrast in High Contrast Accessibility Modes**
    *   *Action*: Simulate OS high contrast active flag.
    *   *Expected*: Theme adjusts border lines and color presets to maximize text accessibility.
*   **T2_THEME_5: Settings Theme Injection Guard**
    *   *Action*: Inject malicious javascript into theme settings string (`"><script>alert('XSS')</script>`).
    *   *Expected*: Theme engine filters parameter string, escaping input to prevent code execution.

### TOGGLE: Modular Feature Toggles (R6)
*   **T2_TOGGLE_1: Disabling features during active loading processes**
    *   *Action*: Start loading massive STL mesh and immediately toggle OFF "3D CAD Viewer".
    *   *Expected*: Loader cancels file buffer stream and closes canvas without memory leakage.
*   **T2_TOGGLE_2: Disk Space Full on Settings Write**
    *   *Action*: Toggle feature OFF when disk is write-locked or full.
    *   *Expected*: Settings remain toggled in app memory, and UI shows warning toast: "Failed to persist configurations".
*   **T2_TOGGLE_3: Deep-Link Routing with Modules disabled**
    *   *Action*: Route directly to `d2l-dashboard` view when D2L toggle is OFF.
    *   *Expected*: Router intercepts navigation and redirects to primary workspace view.
*   **T2_TOGGLE_4: Toggling all modular packages OFF simultaneously**
    *   *Action*: Disable both "3D CAD Viewer" and "D2L Calendar Sync".
    *   *Expected*: Sidebar navigation removes toggled items; split layout fits to markdown note view seamlessly.
*   **T2_TOGGLE_5: Corrupted Toggles State Recovery**
    *   *Action*: Inject malformed toggles data (`"active_features": "corrupt"`) in settings.
    *   *Expected*: App automatically initializes all default features active.

---

## 5. Tier 3: Cross-Feature Combinations (6 Tests)

### T3_COMB_1: Editor File Saving + Theme Engine Accents (NOTE + THEME)
*   **Description**: Ensures that saving note files triggers a feedback notification toast whose accent styling dynamically respects the selected custom theme.
*   **Steps**:
    1. Select "Colored Glass Mode" in theme presets (turns accent variables to violet).
    2. Write content in editor and click "Save".
    3. Verify that the confirmation toast has class `border-violet-500` or matching violet accent.
    4. Switch theme to "AMOLED" (turns accent variables to neon cyan).
    5. Save note again; verify toast styling immediately shifts to match the cyan accent.

### T3_COMB_2: D2L Settings Controls + Modular Toggle Synchronization (SYNC + TOGGLE)
*   **Description**: Verifies that disabling the D2L Sync feature automatically disables and hides D2L settings options from the global settings panel.
*   **Steps**:
    1. Open Settings panel; confirm "D2L Private iCal Feed URL" input field is visible and editable.
    2. Slide the "D2L Calendar Sync" module toggle to OFF.
    3. Verify that the iCal URL input field disappears or becomes visually disabled and unclickable.
    4. Toggle the feature back to ON; confirm the input field immediately returns to an active, editable state.

### T3_COMB_3: Three.js WebGL Resize + Split Pane Drag Interaction (CORE + VIEW)
*   **Description**: Verifies that resizing the split-pane division slider recalculates the Three.js WebGL canvas aspect ratio and viewport bounds without distorting the mesh model.
*   **Steps**:
    1. Click on `gear.stl` in the explorer sidebar to render the 3D canvas.
    2. Locate the vertical resizer divider `div[data-testid="split-pane-resizer"]`.
    3. Click and drag the resizer to shrink the viewer pane to 30% of window width.
    4. Assert that the Three.js canvas height/width properties update and the rendered model aspect ratio remains proportional (not horizontally squished).

### T3_COMB_4: Markdown Text Editing Focus + Active 3D Render Loop (NOTE + VIEW)
*   **Description**: Confirms that active background rendering processes (like Three.js orbit rotation) do not interrupt keyboard typing focus in the Markdown editor.
*   **Steps**:
    1. Select `gear.stl` to load the 3D model.
    2. Turn on "Auto-Rotate" mode inside the CAD canvas control panel.
    3. Focus cursor inside the Markdown editor text input.
    4. Type a sentence rapidly.
    5. Verify that no keyboard inputs are dropped, input focus is never lost, and the 3D model continues to rotate in the background.

### T3_COMB_5: D2L Event Copy-to-Editor Clipboard Operation (NOTE + SYNC)
*   **Description**: Verifies that events displayed in the D2L Sync Dashboard can be selected and added to Markdown notes as standard formatted task references.
*   **Steps**:
    1. Sync D2L calendar feed to populate the task dashboard list.
    2. Open note file `weekly_plan.md` in the left editor.
    3. Click the "Add to Note" or "Copy Reference" button on the "Physics Lab Report" event card.
    4. Verify that a formatted markdown task (`- [ ] Physics Lab Report (Due: 2026-07-18)`) is inserted at the cursor position in the editor.

### T3_COMB_6: Toggle Feature + File Explorer Extensions Filter (NOTE + TOGGLE + VIEW)
*   **Description**: Verifies that disabling the 3D CAD Viewer automatically filters `.stl`/`.obj` files in the explorer sidebar or renders them as unclickable.
*   **Steps**:
    1. Confirm that `gear.stl` and `syllabus.pdf` are visible in the sidebar tree.
    2. Go to Settings, toggle OFF "3D CAD Viewer".
    3. Return to sidebar; verify that `gear.stl` is either hidden or marked grey and unclickable, while `syllabus.pdf` remains active.
    4. Attempt to click `gear.stl`; confirm that no file load is triggered and the viewer does not open.

---

## 6. Tier 4: Real-World Application Scenarios (5 Scenarios)

### T4_SCENARIO_1: Late-Night Study Session Setup (CORE + NOTE + VIEW + THEME)
*   **Narrative**: A student begins a late-night study session for mechanical engineering. They adjust the UI to AMOLED mode, open their homework file, and render the corresponding CAD model for reference.
*   **Steps**:
    1. Launch StudySpace (defaults to standard Dark theme).
    2. Navigate to Settings, choose **AMOLED Mode** (UI transitions to pure black, reducing eye strain).
    3. In the Sidebar File Explorer, locate and click `mech_notes.md` to load it in the editor.
    4. Select the split resizer and adjust the layout to 40% Editor / 60% Viewer.
    5. Select `gear.stl` in the explorer; verify the 3D Three.js canvas initializes and displays the gear.
    6. Double-click the 3D canvas to maximize, rotate the gear to view the bottom surface, and then restore.
    7. Toggle the Markdown Editor to **Preview Mode** to check mathematical formula rendering.
    8. Toggle back to **Edit Mode**, type a conclusion paragraph, and click **Save**.
    9. Restart the application; verify that the application loads directly in AMOLED mode, with `mech_notes.md` active and the latest content preserved.

### T4_SCENARIO_2: Weekly Coursework Planning & Code Analysis (SYNC + NOTE + VIEW + TOGGLE)
*   **Narrative**: A computer science student syncs their university assignments, lists tasks on their dashboard, and inspects programming code while writing up progress notes.
*   **Steps**:
    1. Launch app, go to Settings. Ensure **D2L Calendar Sync** is toggled ON.
    2. Enter private iCal feed URL and click **Sync**.
    3. Click the calendar dashboard icon in the layout panel.
    4. Review the parsed events checklist; locate "Memory Manager Submission" due in 48 hours.
    5. Click the event card; click "Create Study Note" to generate `Memory_Manager_Study.md`.
    6. Open the sidebar directory, and select `solver.cpp` to load the code in the viewer pane (syntax highlighting active).
    7. Highlight key lines in the code viewer, write comments in `Memory_Manager_Study.md` summarizing the program flow, and click **Save**.
    8. Re-open Settings, toggle **D2L Calendar Sync** OFF; verify that calendar dashboard indicators disappear from view, but the created note file `Memory_Manager_Study.md` remains intact in the workspace tree.

### T4_SCENARIO_3: distraction-free Markdown Writing Space (CORE + NOTE + TOGGLE + THEME)
*   **Narrative**: A student needs to focus solely on drafting an essay. They disable all distracting modules (3D rendering and calendar updates) to maximize workspace area and select a soothing theme.
*   **Steps**:
    1. Open Settings pane.
    2. Turn OFF **3D CAD Viewer** and **D2L Calendar Sync** features.
    3. Verify that the right viewer panel slides out of view or collapses, expanding the editor to full-window width.
    4. Change theme settings to **Colored Glass Mode** (applying soft purple visual accents).
    5. Click "New File" in the explorer header, type `history_essay.md`, and press Enter.
    6. Write 5 paragraphs in the editor.
    7. Toggle **Preview Mode** to proofread formatting.
    8. Click **Save** to write contents to disk.
    9. Reload the app; verify the workspace remains in full-width editor layout under Colored Glass styling with `history_essay.md` loaded.

### T4_SCENARIO_4: Project Presentation Asset Check (CORE + NOTE + VIEW + THEME)
*   **Narrative**: A student uses StudySpace to verify assignment handouts and model files during an active presentation, switching layouts and themes rapidly for visibility.
*   **Steps**:
    1. Select `syllabus.pdf` in the workspace list to render class guidelines on the right viewer panel.
    2. Adjust the split-pane resizer to 50% split.
    3. Open `presentation_script.md` in the editor panel.
    4. Toggle settings to **Light Mode** to enhance text legibility under projector lighting conditions.
    5. Select `gear.stl` in the file explorer to display the 3D model in Three.js, zooming in on the main teeth.
    6. Switch back to `syllabus.pdf` to double-check submission steps.
    7. Modify the presentation script note to add a delivery reminder, then save the note.

### T4_SCENARIO_5: Fresh User Initialization & Settings Workspace Setup (CORE + THEME + TOGGLE + SYNC + NOTE)
*   **Narrative**: A new student installs StudySpace and configures their layout preferences, themes, and assignments feed from scratch.
*   **Steps**:
    1. Launch the application for the first time. Verify default state (all features enabled, Dark Mode active).
    2. Open Settings, set theme preference to **AMOLED Mode**.
    3. Toggle the **3D CAD Viewer** OFF (since they are taking a pure Humanities course load). Verify CAD tab disappears.
    4. Enter their private D2L calendar iCal feed link. Click **Sync**.
    5. Navigate to the D2L Sync calendar dashboard; verify assignment event lists populate.
    6. Click "New Note" in the file explorer, rename to `Semester_Goals.md`, write goals, and click **Save**.
    7. Close and relaunch the application.
    8. Verify the theme is AMOLED, 3D features are disabled, the iCal URL persists in Settings, and D2L events load instantly from cache.

---

## 7. Execution Guide & CLI Commands

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm
- Tauri CLI (to build the application binary)

### Configuration Files

Create `playwright.config.ts` in the root directory:

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'mock-frontend',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Script Execution Commands

Configure `package.json` scripts:

```json
"scripts": {
  "test:unit": "vitest run",
  "test:e2e:mock": "playwright test --project=mock-frontend",
  "test:e2e:binary": "tauri-driver"
}
```

To run the suites:

1. **Install dependencies**:
   ```bash
   npm install @playwright/test vitest @tauri-apps/api -D
   npx playwright install chromium
   ```
2. **Execute Mocked Frontend E2E tests**:
   ```bash
   npm run test:e2e:mock
   ```
3. **Execute Unit Tests**:
   ```bash
   npm run test:unit
   ```

---

## 8. Requirements Coverage Matrix

| Test ID | R1 (Tauri Core) | R2 (Editor) | R3 (Viewer) | R4 (D2L) | R5 (Theme) | R6 (Toggle) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **T1_CORE_1** to **T1_CORE_5** | X | | | | | |
| **T1_NOTE_1** to **T1_NOTE_5** | | X | | | | |
| **T1_VIEW_1** to **T1_VIEW_5** | | | X | | | |
| **T1_SYNC_1** to **T1_SYNC_5** | | | | X | | |
| **T1_THEME_1** to **T1_THEME_5** | | | | | X | |
| **T1_TOGGLE_1** to **T1_TOGGLE_5**| | | | | | X |
| **T2_CORE_1** to **T2_CORE_5** | X | | | | | |
| **T2_NOTE_1** to **T2_NOTE_5** | | X | | | | |
| **T2_VIEW_1** to **T2_VIEW_5** | | | X | | | |
| **T2_SYNC_1** to **T2_SYNC_5** | | | | X | | |
| **T2_THEME_1** to **T2_THEME_5** | | | | | X | |
| **T2_TOGGLE_1** to **T2_TOGGLE_5**| | | | | | X |
| **T3_COMB_1** | | X | | | X | |
| **T3_COMB_2** | | | | X | | X |
| **T3_COMB_3** | X | | X | | | |
| **T3_COMB_4** | | X | X | | | |
| **T3_COMB_5** | | X | | X | | |
| **T3_COMB_6** | | X | | | | X |
| **T4_SCENARIO_1** | X | X | X | | X | |
| **T4_SCENARIO_2** | | X | X | X | | X |
| **T4_SCENARIO_3** | X | X | X | | | |
| **T4_SCENARIO_4** | X | X | | | X | X |
| **T4_SCENARIO_5** | X | X | | X | X | X |
