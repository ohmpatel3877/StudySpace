# Worker Instructions for Milestone 1 (App Skeleton & Tauri Core) - Generation 2

Your working directory is: `C:\Users\ohmpa\OneDrive\Obsidian\Obsidian-Education\StudySpace\.agents\worker_milestone1_gen2`
Your parent conversation ID is: `f76a83d9-2e89-4233-afec-b7d28263ca58` (Milestone 1 Sub-orchestrator).

## Objective
Implement the Tauri backend skeleton and configure core scopes (`fs`, `http`, and `shell`). Build the React + Vite + TypeScript + Tailwind frontend shell, including global context, glassmorphic layout, and functional UI components (with test ID selectors) that satisfy the Playwright E2E test suite.

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

---

## Step-by-Step Instructions

### Step 1: Rust Toolchain & Environment Configuration
1. Check if Rustup, `cargo`, and `rustc` are installed and in the PATH.
2. If they are not found, check standard locations or use a PowerShell command to locate them, or run `rustup-init.exe` silently to install them if not present.
3. Verify `cargo --version` compiles successfully.

### Step 2: Initialize Vite React + TS Frontend
Note: The repository already has some frontend configurations. You must NOT overwrite `.agents` or `PROJECT.md`.
1. If Vite is not fully initialized, run `npm create vite@latest . -- --template react-ts` (choose to merge/keep existing files if prompted).
2. Install frontend dependencies:
   `npm install @tauri-apps/api lucide-react react-resizable-panels three @react-three/fiber @react-three/drei react-syntax-highlighter`
   `npm install -D tailwindcss postcss autoprefixer @types/three @types/react-syntax-highlighter @types/node`

### Step 3: Configure Tailwind CSS & Theme Styles
1. Ensure Tailwind is configured. Initialize with `npx tailwindcss init -p` if needed.
2. Configure `tailwind.config.js` to include the `src` paths:
   ```javascript
   /** @type {import('tailwindcss').Config} */
   export default {
     content: [
       "./index.html",
       "./src/**/*.{js,ts,jsx,tsx}",
     ],
     theme: {
       extend: {},
     },
     plugins: [],
   }
   ```
3. Update `src/styles/index.css` (or create if missing) to define the CSS variables and classes for themes:
   - Accents and layout classes using glassmorphism (`backdrop-blur-md`, transcluent backgrounds).
   - Theme variables:
     - `.theme-dark`: dark theme styling, body classes.
     - `.theme-light`: light theme styling.
     - `.theme-amoled`: AMOLED black theme styling.
     - `.theme-colored-glass`: high-contrast or colorful translucent theme styling.
   - Body must have class `.glass` or contain a matching selector.

### Step 4: Scaffold Tauri Backend
1. Ensure `@tauri-apps/cli` is installed as a devDependency.
2. Run `npx tauri init` (or manually create `src-tauri` folder if needed to avoid conflicts).
   Use the following parameters:
   - App Name: `StudySpace`
   - Window Title: `StudySpace`
   - Assets path: `../dist`
   - Dev Server URL: `http://localhost:5173`
   - Dev Command: `npm run dev`
   - Build Command: `npm run build`
3. Configure `src-tauri/tauri.conf.json` with the required scopes:
   - **fs**: allow all commands (`all: true` or specify readFile, writeFile, readDir, createDir, removeFile), with scope restricted to:
     `["$DOCUMENT/*", "$APPDATA/*", "$DESKTOP/*", "$DOWNLOAD/*"]`
   - **http**: allow request (`all: true`), with scope restricted to:
     `["https://*"]`
   - **shell**: allow opening default applications (`open: true`).

### Step 5: Implement React State Context (`src/context/AppContext.tsx`)
Create a global context with `AppProvider` managing:
1. `theme`: active theme (options: 'Dark Mode', 'AMOLED Mode', 'Colored Glass Mode', 'Dark Mode'). Defaults to loading from stored settings (via Tauri `load_settings` command). If `load_settings` fails, default to 'Dark Mode'. Set the root `html` class to `theme-dark`, `theme-light`, `theme-amoled`, or `theme-colored-glass` accordingly.
2. `activeFile`: active selected file object (e.g. `{ name, path, is_dir, ext }`), defaults to `null`.
3. `features`: active features array, default `['d2l_sync', 'cad_viewer']`. Loaded/saved via tauri commands.
4. `currentNav`: active navigation tab (e.g., 'notes', 'd2l', 'settings'), defaults to 'notes'.
5. `explorerOpen`: boolean, default `true`.
6. `vaultFiles`: array of files in the workspace vault. Populated by invoking Tauri command `get_vault_files`.
7. `settings`: settings state (themes, toggles, external locations, d2l URL).
8. `externalLocations`: array of imported external folders.
9. `toast`: toast state for notifications (message and visibility). Expose a function to show toasts: `showToast(msg: string)`.
10. D2L events caching.

Make sure to call the Tauri IPC commands for storage:
- Load settings on boot: `invoke('load_settings')`
- Save settings on update: `invoke('save_settings', { settings })`
- File read/write: `invoke('read_vault_file', { path })`, `invoke('write_vault_file', { path, content })`
- External locations: `invoke('import_external_location', { location_type, path_or_url, credentials })`, `invoke('remove_external_location', { path_or_url })`
- D2L fetch: `invoke('fetch_and_parse_d2l', { url })`
- Default application opening: `invoke('open_in_default_app', { file_path })`

### Step 6: Implement Frontend Shell Components
Build the shell with appropriate `data-testid` attributes to pass the E2E tests:
1. **Layout (`src/components/Layout.tsx`)**:
   - Sidebar component with test-ids:
     - `tab-workspace`: switches `currentNav` to 'notes'.
     - `tab-d2l`: switches to D2L (hidden if `d2l_sync` is disabled in `features`).
     - `tab-settings`: switches to settings.
   - Middle & Right Panel:
     - Split layout using `react-resizable-panels`.
     - Left pane: `[data-testid="editor-pane"]` containing the Explorer and Editor.
     - Right pane: `[data-testid="viewer-pane"]` containing the Resource Viewer.
     - Entire container: `[data-testid="sidebar"]` for sidebar navigation.
2. **Explorer (`src/components/Explorer.tsx`)**:
   - Lists files. Each item has:
     - `[data-testid="file-item-<filename>"]` (e.g., `file-item-welcome.md`).
     - If the file is an `.stl` and `cad_viewer` is disabled in `features`, it must render as `[data-testid="file-item-gear.stl-disabled"]` and clicking it does nothing.
   - Text input for creating a new file: `[data-testid="new-file-name"]`.
   - Button to trigger file creation: `[data-testid="create-file-btn"]`.
   - If files array is empty, render a div: `[data-testid="empty-folder-message"]` containing the text `No workspace files found`.
3. **Editor (`src/components/Editor.tsx`)**:
   - Title rendering in header: `[data-testid="editor-header-title"]` (shows current `activeFile.name` or `welcome.md` by default).
   - Textarea: `[data-testid="markdown-textarea"]` (for editing, hidden in preview mode).
   - Preview div: `[data-testid="markdown-preview"]` (shows rendered markdown HTML, hidden in edit mode).
   - Preview toggle button: `[data-testid="preview-toggle"]`.
   - Save button: `[data-testid="save-button"]`.
   - Open in Default App button: `[data-testid="open-default-app-btn"]` (disabled for new unsaved drafts with no file extension).
4. **Viewer (`src/components/Viewer.tsx` / `CadViewer.tsx` / `CodeViewer.tsx` / `PdfViewer.tsx`)**:
   - Renders based on `activeFile` extension:
     - `.pdf`: renders `<iframe data-testid="pdf-iframe" src="..."></iframe>`
     - `.docx`, `.xlsx`, `.pptx`: triggers conversion loader `[data-testid="office-loader"]`. Calls `convert_office_doc`. On success, loads PDF iframe. Displays conversion progress `[data-testid="office-progress"]` for large `.pptx`. Renders `[data-testid="viewer-fallback"]` on conversion error/missing LibreOffice.
     - `.stl`, `.obj`: renders CAD viewer `[data-testid="cad-viewer"]` containing `[data-testid="three-canvas"]` and a status element `[data-testid="canvas-status"]` (default text: "WebGL Context Active"). Include checkbox `[data-testid="auto-rotate-toggle"]` for rotation. Expose a global function `window.__triggerWebGLContextLoss` to simulate WebGL context loss. When triggered, status text should show "WebGL context lost. Restoring..." and then restore back to "WebGL Context Active" after 1 second.
     - `.cpp`, `.h`, `.c`: renders `[data-testid="code-viewer"]` with syntax highlighted code (wrap keywords `#include`, `int`, `return` in `<span class="keyword">` tags). Provide a button `[data-testid="edit-inline-btn"]` to toggle inline editing. When clicked, replace code with a textarea `[data-testid="inline-code-textarea"]`. Clicking the button again saves changes (calling `write_vault_file`) and toggles back.
5. **D2L Dashboard (`src/components/D2LDashboard.tsx`)**:
   - Sync button: `[data-testid="d2l-sync-button"]`.
   - Sync status: `[data-testid="d2l-sync-status"]`.
   - Event items: `[data-testid="d2l-event-item"]` (renders event details, filters out duplicate event IDs).
6. **Settings (`src/components/Settings.tsx`)**:
   - Theme selector: `<select data-testid="theme-select">` with options 'Light Mode', 'AMOLED Mode', 'Colored Glass Mode', 'Dark Mode'.
   - Save settings button: `[data-testid="save-settings-btn"]`.
   - Toggle buttons: `[data-testid="toggle-d2l-sync"]` (for D2L Sync), `[data-testid="toggle-cad-viewer"]` (for CAD Viewer).
   - Feed URL input: `[data-testid="d2l-feed-url-input"]`.
   - Import fields:
     - Select import type: `[data-testid="import-type-select"]`.
     - Path/URL input: `[data-testid="import-path-input"]`.
     - Username: `[data-testid="import-username-input"]`.
     - Password: `[data-testid="import-password-input"]`.
     - Submit button: `[data-testid="import-submit-btn"]`.
     - List container: `[data-testid="imported-locations-list"]` (displays list of locations or "No external locations imported").
     - Remove button: `[data-testid="remove-location-btn"]`.
7. **Toast Notifications**:
   - Toast container: `[data-testid="toast-notification"]` displaying temporary messages (e.g., "File saved successfully", "Opening welcome.md in default application", "Failed to persist configurations").

### Step 7: Verification
1. Run `npm run build` to verify the React frontend compiles without TypeScript or Vite errors.
2. Compile and build the Tauri backend application to ensure the Rust workspace and crates are intact.
3. Run the Playwright mock tests: `npm run test:e2e:mock` and ensure all core layout and styling tests pass.
4. Document all your changes, build logs, and test results in `handoff.md`.

---

Send a message when you have successfully completed the tasks. Good luck!
