# Project: StudySpace

Lightweight Tauri-based desktop study workspace integrating Markdown notes, local resources, interactive 3D CAD viewer, and D2L Brightspace iCal calendar feed sync.

**This document is a historical/architecture record of what was built through Milestone 7.** It is not a status board and not a plan. For what actually works today, what is stubbed, and what happens next, see `AUDIT.md` (findings) and `PKM_PLAN.md` (the forward-looking, phased plan of record). Where this document and those two disagree, `AUDIT.md`/`PKM_PLAN.md` are ground truth — they were written 2026-08-20 against the current commit; this file describes original intent and has not been kept current milestone-by-milestone.

## Architecture
StudySpace is structured as a desktop application with:
1. **Tauri Backend (Rust)**:
   - File system access for reading/writing local vault Markdown notes and assets.
   - HTTP Client proxy (if required) to fetch external iCal feeds to bypass CORS.
   - Local state storage for settings (themes, toggles) and parsed D2L events.
2. **React Frontend (TypeScript + Vite + Tailwind CSS)**:
   - **Glassmorphic Layout**: Sidebar layout with a glass-like blur effect, consistent dark-mode styling.
   - **Split Pane**: File Explorer & Markdown Note Editor on the left, Dynamic Resource Viewer on the right.
   - **Custom Theme Engine**: Theme state injected globally, applying CSS variables for background glass effects, text colors, and accents (Dark, Light, AMOLED, Colored Glass).
   - **Feature Toggles**: Conditional rendering of the D2L Sync dashboard and the 3D CAD Viewer.
   - **3D CAD Viewer**: Intended to be Three.js-powered (via `@react-three/fiber` or vanilla Three.js) to parse STL/OBJ files with orbital controls. As shipped this is a placeholder — see Interface Contracts and AUDIT.md Finding 5.
   - **PDF Document Viewer**: HTML5 PDF embed or PDF.js/react-pdf viewer.
   - **Code Viewer**: Syntax highlighting for C/C++ files.

## Code Layout
Verified against the filesystem 2026-08-20. Two items in the originally-planned layout do not exist and have been corrected below: `src/hooks/` (there is no `useTheme.ts` or `useFeatures.ts`) and `src/styles/` (there is no such directory). Theme and feature-toggle state both live directly in `AppContext.tsx` instead of dedicated hooks (see AUDIT.md Finding 7 — `theme`/`settings.theme` and `features`/`settings.active_features` are hand-synced duplicate copies of the same state, not a hook abstraction). The Tailwind/theme CSS lives at `src/index.css`, not under a `styles/` subdirectory.

```
StudySpace/
├── src-tauri/               # Tauri Backend (Rust)
│   ├── src/
│   │   ├── main.rs          # Entry point and custom commands
│   │   └── commands.rs      # File I/O, D2L fetch & store commands
│   ├── Cargo.toml           # Rust dependencies (tauri, reqwest, serde, ical)
│   └── tauri.conf.json      # Tauri application config (fs, http permissions)
├── src/                     # React Frontend (TypeScript)
│   ├── assets/              # Static assets
│   ├── components/          # React components
│   │   ├── Editor.tsx       # Markdown Note Editor (Live edit/preview toggle)
│   │   ├── Explorer.tsx     # File explorer sidebar (lists files in local vault)
│   │   ├── Viewer.tsx       # Dynamic resource viewer (switch on file ext)
│   │   ├── CadViewer.tsx    # 3D STL/OBJ viewer — currently a placeholder <div>, no Three.js (AUDIT.md Finding 5)
│   │   ├── CodeViewer.tsx   # C/C++ source code editor/viewer with syntax highlighting
│   │   ├── PdfViewer.tsx    # PDF document embedded viewer
│   │   ├── D2LDashboard.tsx # D2L calendar feed sync dashboard
│   │   ├── KnowledgeGraph.tsx # Force-directed graph view (see AUDIT.md Finding 6 — real renderer, fictional demo data)
│   │   ├── Settings.tsx     # Settings panel (URL input, Theme selector, Toggles)
│   │   └── Layout.tsx       # Layout container (sidebar + panes)
│   ├── context/
│   │   └── AppContext.tsx   # Global state: theme, feature toggles, active file, vault contents, D2L sync. No src/hooks/ exists — this file is the only state layer.
│   ├── graph/                # academy-graph.js / academy-data.js (untyped JS; see AUDIT.md Finding 6)
│   ├── App.tsx               # Application entry layout
│   ├── main.tsx               # React DOM mounting
│   └── index.css              # Tailwind styles, glassmorphic utility classes, theme variables (there is no src/styles/ directory)
├── package.json             # Frontend dependencies (react, three, lucide-react, tailwindcss)
├── tailwind.config.js       # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite build tool configuration
```

## Milestones
Status column reworked 2026-08-20 to reflect verified reality rather than the original all-`DONE` self-report. `DONE` = the shipped code does what the milestone scope promises. `PARTIAL` = some of the scope is real, some is stub/broken. `STUB` = the surface exists (UI, command, route) but does not do the described work. Evidence cites `file:line`; see AUDIT.md for the full writeup behind each line.

| # | Name | Scope | Dependencies | Status | Evidence |
|---|------|-------|-------------|--------|-----------------|
| 0 | E2E Testing Track | Build opaque-box E2E test suite (Tiers 1-4) | None | `PARTIAL` | Suite existed and ran green, but against a hand-written mock app, not `src/` (AUDIT.md Finding 1). As of the current commit the mock app is deleted and the suite runs against the real app via `vite preview` (see GATE-BASELINE.md); this row describes the milestone as originally delivered. |
| 1 | App Skeleton & Tauri Core | Tauri+React+Vite init, tauri.conf.json fs/http/shell scopes, glassmorphic layout | None | `PARTIAL` | Scaffold, layout, and capabilities file are real (`tauri.conf.json`), but `vite.config.ts` lacked the Tauri dev-server settings needed for `tauri dev` to run at all until fixed today (AUDIT.md Finding 8) — the desktop app had never launched. |
| 2 | Markdown Note Editor & File Explorer | Sidebar explorer, split-pane layout, local Markdown read/write | M1 | `PARTIAL` | `get_vault_files`/`read_vault_file`/`write_vault_file` (`commands.rs:124,133,139`) are real for text files, but the Tauri 2 IPC bridge was misconfigured until this commit (AUDIT.md Finding 2), so reads/writes silently fell through to a localStorage fixture rather than the real backend for the milestone's working life. |
| 3 | CAD, Office, Inline Editor & Native Bridge | R3, R8, R9, R10. Three.js 3D viewer, LibreOffice CLI conversion, C/C++ inline editor, native shell open | M1, M2 | `STUB` (CAD, office conversion) / `PARTIAL` (native open) | 3D viewer: `src/components/CadViewer.tsx:76-83` renders a `<div>` containing the literal string `[WebGL Canvas rendering with Auto-Rotation]` — no `<canvas>`, no Three.js scene; `three` is installed and imported nowhere in `src/`. Office conversion: `commands.rs:204-227` really invokes `soffice`, but returns `format!("/temp/{}", pdf_name)` (`commands.rs:222`), a leading-slash path that cannot be read back (AUDIT.md Finding 5). Native open (`open_in_default_app`, `commands.rs:230-233`) works but has no extension allowlist (AUDIT.md Finding 4). |
| 4 | D2L Calendar Feed Sync | iCal settings, Rust fetch & parse, JSON store, UI calendar display | M1 | `PARTIAL` | `fetch_and_parse_d2l` (`commands.rs:148-183`) really fetches and parses iCal via the `ical` crate. But `DTSTART`/`DUE` collide into one field (`commands.rs:167`), there is no `TZID`/timezone handling, no `RRULE` support, and events without `UID` are silently dropped (AUDIT.md Finding 5). |
| 5 | Theme Engine & Feature Toggles | Dynamic swap/persist, feature toggles toggle/persist | M1, M2, M3, M4 | `DONE` | Four-theme CSS-variable engine works (AUDIT.md "What is actually solid"). State duplication (`theme`/`settings.theme`, `features`/`settings.active_features` hand-synced in `AppContext.tsx:369,376-377`) is a code-quality defect, not a functional one. |
| 6 | External File Location Imports | R7 Settings input, dynamic explorer rendering, read/write for external locations | M1, M2, M5 | `STUB` | `import_external_location` (`commands.rs:186-193`) only appends `{location_type, path_or_url}` to a settings array and calls `save_settings`. `get_vault_files` walks only `vault_root()` (`commands.rs:124-130`) and never surfaces anything from `external_locations`. There is no read/write path for imported locations at all (AUDIT.md Finding 5). |
| 7 | Final Integration & E2E Verification | E2E verification pass, white-box adversarial coverage | M0, M1, M2, M3, M4, M5, M6 | `PARTIAL` | Superseded by events since this milestone was opened: the mock-app E2E target, the Tauri 1/2 IPC mismatch, and the never-run `tauri dev` were all found and partially fixed in the commit range documented in AUDIT.md and GATE-BASELINE.md. This milestone's original "IN_PROGRESS" status was stale and has been corrected here; it is not tracked forward from this document — see PKM_PLAN.md for the phases that now own remaining verification work. |

### What happens next

This table is a record of milestones 0-7 as built. It does not track future work. All forward-looking scope — fixing the STUB/PARTIAL items above, hardening the security defects in AUDIT.md Finding 4, deciding the fate of the knowledge graph's fictional demo data (Finding 6), and the phased remediation plan — is tracked in **`PKM_PLAN.md`**, which is the plan of record. Check there before starting new work; do not resume from this file's milestone table as if it were an open task list.

## Interface Contracts
### Tauri commands ↔ React Frontend

Each contract below was checked against `src-tauri/src/commands.rs` on 2026-08-20. Violations are marked `VIOLATION` with the actual signature/behavior.

#### `get_vault_files`
- **Description**: Returns recursive list of files and folders in the workspace directory.
- **Input**: None
- **Output**: Array of file objects: `[{ name: string, path: string, is_dir: boolean, ext: string }]`
- **Verified**: matches `commands.rs:123-130`. Note `ext` is always present (empty string if none), not optional as `ext?` implied.

#### `read_vault_file`
- **Description**: Reads content of a local file in the vault.
- **Input**: `path: string`
- **Output**: `string` (text content) or base64 (for binary files)
- **VIOLATION**: `commands.rs:132-136` is `fs::read_to_string(&full)` only — there is no base64 branch, no binary handling at all. It returns `Err` on any non-UTF8 file. It is called directly for `.pdf` (`PdfViewer.tsx`) and `.stl` (`CadViewer.tsx`), both binary formats, so the documented contract was never implemented for the file types that need it (AUDIT.md Finding 5).

#### `write_vault_file`
- **Description**: Writes string content to a local Markdown file.
- **Input**: `path: string, content: string`
- **Output**: `void` (Rust: `Result<(), String>`)
- **Verified**: matches `commands.rs:138-145`. Note (not a contract violation, but relevant): no path containment check — `vault_root().join(&path)` accepts `..` traversal and, on Windows, an absolute `path` argument discards the vault root entirely (AUDIT.md Finding 4).

#### `fetch_and_parse_d2l`
- **Description**: Fetches iCal feed from a private URL and returns parsed events.
- **Input**: `url: string`
- **Output**: Array of parsed events: `[{ id: string, title: string, description: string, due_date: string }]`
- **Verified**: field shape matches `commands.rs:29-35, 148-183`. Not a contract-shape violation, but `due_date` is populated from whichever of `DTSTART`/`DUE` is seen last in the iCal source (`commands.rs:167`) — the two are not distinguished in the output despite being semantically different.

#### `save_settings` / `load_settings`
- **Description**: Persists and loads theme preferences, feature toggles, and external sync locations.
- **Input/Output**: JSON object with theme name, active features, and external locations array.
- **Verified**: matches `AppSettings` (`commands.rs:7-13`) and `commands.rs:112-121`. Note the struct also carries `d2l_feed_url`, which the original contract text omitted; adding it here for accuracy.

#### `import_external_location`
- **Description**: Adds a new external directory or remote location to import.
- **Input**: `location_type: 'local' | 'webdav' | 'smb', path_or_url: string, credentials?: object`
- **Output**: `void`
- **VIOLATION**: the actual Rust signature is `import_external_location(location_type: String, path_or_url: String)` (`commands.rs:186`) — there is no `credentials` parameter at all, optional or otherwise. There is also no type validation restricting `location_type` to `'local' | 'webdav' | 'smb'`; any string is accepted and stored. Functionally the command only pushes `{location_type, path_or_url}` onto `settings.external_locations` and saves — nothing reads, mounts, or imports anything from it afterward (AUDIT.md Finding 5).

#### `remove_external_location`
- **Description**: Removes an imported location from the configurations.
- **Input**: `path_or_url: string`
- **Output**: `void`
- **Verified**: matches `commands.rs:195-201`.

#### `convert_office_doc`
- **Description**: Converts `.docx`, `.pptx`, `.xlsx` to PDF using LibreOffice CLI `soffice` on the host system.
- **Input**: `file_path: string`
- **Output**: `pdf_path: string` (path to temporary converted PDF file)
- **VIOLATION**: the shape matches (`OfficeConversionResult { pdf_path: String }`, `commands.rs:37-40`), and `soffice` is genuinely invoked (`commands.rs:213-218`). But the returned `pdf_path` is `format!("/temp/{}", pdf_name)` (`commands.rs:222`) — a leading-slash string, not the actual output directory (`vault_root().join("temp")`, `commands.rs:210`). On Windows this re-resolves to `C:\temp\`, not the vault temp dir, so the path handed back cannot be used to read the file that was actually written. Additionally, every non-zero `soffice` exit is reported as the fixed string `"Conversion failed: File corrupted"` (`commands.rs:225`) regardless of the real cause.

#### `open_in_default_app`
- **Description**: Opens the selected file in the host system's default native application.
- **Input**: `file_path: string`
- **Output**: `void`
- **Verified**: matches `commands.rs:229-233`. Not a shape violation, but there is no extension allowlist before `open::that()` is called (AUDIT.md Finding 4) — this is a security note, not a contract-text discrepancy.
</content>
