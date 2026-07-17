# StudySpace

Lightweight Tauri-based desktop study workspace integrating Markdown notes, local resources, interactive 3D CAD viewer, and D2L Brightspace iCal calendar feed sync.

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
   - **3D CAD Viewer**: Canvas powered by Three.js (using `@react-three/fiber` or vanilla Three.js context) to parse STL and OBJ files, displaying them with camera orbital controls.
   - **PDF Document Viewer**: HTML5 PDF embed or PDF.js/react-pdf viewer.
   - **Code Viewer**: Syntax highlighting for C/C++ files.

## Code Layout

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
│   │   ├── CadViewer.tsx    # Three.js 3D STL/OBJ model renderer
│   │   ├── CodeViewer.tsx   # C/C++ source code editor/viewer with syntax highlighting
│   │   ├── PdfViewer.tsx    # PDF document embedded viewer
│   │   ├── D2LDashboard.tsx # D2L calendar feed sync dashboard
│   │   ├── Settings.tsx     # Settings panel (URL input, Theme selector, Toggles)
│   │   └── Layout.tsx       # Layout container (sidebar + panes)
│   ├── context/
│   │   └── AppContext.tsx   # Global state for theme, toggles, active file
│   ├── hooks/
│   │   ├── useTheme.ts      # Theme engine switcher and persistence
│   │   └── useFeatures.ts   # Feature toggle state and persistence
│   ├── styles/
│   │   └── index.css        # Tailwind styles, glassmorphic utility classes, theme variables
│   ├── App.tsx              # Application entry layout
│   ├── main.tsx             # React DOM mounting
│   └── index.html           # HTML template
├── package.json             # Frontend dependencies (react, three, lucide-react, tailwindcss)
├── tailwind.config.js       # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite build tool configuration
```

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 0 | E2E Testing Track | Build opaque-box E2E test suite (Tiers 1-4) | None | `DONE` |
| 1 | App Skeleton & Tauri Core | Tauri+React+Vite init, tauri.conf.json fs/http/shell scopes, glassmorphic layout | None | `DONE` |
| 2 | Markdown Note Editor & File Explorer | Sidebar explorer, split-pane layout, local Markdown read/write | M1 | `DONE` |
| 3 | CAD, Office, Inline Editor & Native Bridge | Three.js 3D viewer, LibreOffice CLI conversion, C/C++ inline editor, native shell open | M1, M2 | `DONE` |
| 4 | D2L Calendar Feed Sync | iCal settings, Rust fetch & parse, JSON store, UI calendar display | M1 | `DONE` |
| 5 | Theme Engine & Feature Toggles | Dynamic swap/persist, feature toggles toggle/persist | M1, M2, M3, M4 | `DONE` |
| 6 | External File Location Imports | Settings input, dynamic explorer rendering, read/write for external locations | M1, M2, M5 | `DONE` |
| 7 | Final Integration & E2E Verification | E2E verification pass, white-box adversarial coverage | M0-M6 | `IN_PROGRESS` |

## Interface Contracts

### Tauri Commands ↔ React Frontend

#### `get_vault_files`
- **Description**: Returns recursive list of files and folders in the workspace directory.
- **Input**: None (or root path)
- **Output**: Array of file objects: `[{ name: string, path: string, is_dir: boolean, ext?: string }]`

#### `read_vault_file`
- **Description**: Reads content of a local file in the vault.
- **Input**: `path: string`
- **Output**: `string` (text content) or base64 (for binary files)

#### `write_vault_file`
- **Description**: Writes string content to a local Markdown file.
- **Input**: `path: string, content: string`
- **Output**: `void`

#### `fetch_and_parse_d2l`
- **Description**: Fetches iCal feed from a private URL and returns parsed events.
- **Input**: `url: string`
- **Output**: Array of parsed events: `[{ id: string, title: string, description: string, due_date: string }]`

#### `save_settings` / `load_settings`
- **Description**: Persists and loads theme preferences, feature toggles, and external sync locations.
- **Input/Output**: JSON object with theme name, active features, and external locations array.

#### `import_external_location`
- **Description**: Adds a new external directory or remote location to import.
- **Input**: `location_type: 'local' | 'webdav' | 'smb', path_or_url: string, credentials?: object`
- **Output**: `void`

#### `remove_external_location`
- **Description**: Removes an imported location from the configurations.
- **Input**: `path_or_url: string`
- **Output**: `void`

#### `convert_office_doc`
- **Description**: Converts `.docx`, `.pptx`, `.xlsx` to PDF using LibreOffice CLI `soffice` on the host system.
- **Input**: `file_path: string`
- **Output**: `pdf_path: string` (path to temporary converted PDF file)

#### `open_in_default_app`
- **Description**: Opens the selected file in the host system's default native application.
- **Input**: `file_path: string`
- **Output**: `void`
