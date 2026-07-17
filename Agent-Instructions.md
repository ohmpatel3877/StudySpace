# StudySpace — Agent Instructions

Tauri 2 + React 19 + TypeScript 6 + Vite 8 desktop study workspace. Glassmorphic dark UI, Markdown notes, 3D CAD viewer, D2L iCal sync.

> This file is for AI agents. Every line answers: "Would an agent likely miss this without help?"

---

## Commands

| Action | Command | Notes |
|--------|---------|-------|
| Dev server (Vite only) | `npm run dev` | Port 5173 |
| Build (full typecheck) | `npm run build` | Runs `tsc -b` first, then `vite build` |
| Lint | `npm run lint` | Uses **oxlint**, not ESLint. No config for prettier. |
| E2E tests | `npm run test:e2e:mock` | Playwright, mock frontend only (not real Tauri) |
| Tauri dev | `npx tauri dev` | Starts Vite + Tauri desktop window |
| Tauri build | `npx tauri build` | Full release binary |

> `npm run build` requires both `tsc` invocations (`tsconfig.app.json` + `tsconfig.node.json`) to pass. `tsc -b` uses project references, so both tsconfigs are checked.

## Testing

- **Framework**: Playwright with `mock-frontend` project (Desktop Chrome only).
- **No unit tests** — only E2E via Playwright. Test code lives in `tests/`.
- **Mock web server** runs on port **5188** via `node tests/mock-app/server.cjs` — auto-managed by Playwright's `webServer` config.
- **Custom test fixture** in `tests/mocks/tauri-ipc-mock.ts` extends Playwright's `test`. Injects `window.__TAURI_IPC__` mock via `page.addInitScript` before every test. Use `import { test } from './mocks/tauri-ipc-mock'` in all spec files, not `@playwright/test`.
- **Mock state** is accessible at `window.__MOCK_STATE__` during tests — persists in sessionStorage under `__MOCK_STATE_OVERRIDE__`.
- **data-testid** selectors used throughout.
- Test organization mirrors features: `core.spec.ts`, `note.spec.ts`, `view.spec.ts`, `sync.spec.ts`, `theme.spec.ts`, `toggle.spec.ts`, `import.spec.ts`, `office.spec.ts`, `inline.spec.ts`, `bridge.spec.ts`, `combinations.spec.ts`, `scenarios.spec.ts`.
- `beforeEach` always does `await page.goto('/')`.

## Architecture

### Code Layout

```
StudySpace/
├── src-tauri/          # Rust backend (Tauri 2)
│   ├── src/main.rs     # 10 commands registered here
│   ├── src/commands.rs # All command implementations
│   ├── Cargo.toml      # reqwest (blocking), ical, serde, open, dirs
│   └── tauri.conf.json # Port 5173 devUrl, dist/ frontendDist
├── src/                # React frontend
│   ├── main.tsx        # Mount point
│   ├── App.tsx         # Provider + toast
│   ├── context/AppContext.tsx  # Single global context — all state
│   ├── components/     # Layout, Explorer, Editor, Viewer, CadViewer,
│   │                   # CodeViewer, PdfViewer, D2LDashboard, Settings
│   └── index.css       # Tailwind + glassmorphic theme CSS variables
└── tests/              # Playwright E2E tests
    ├── mocks/tauri-ipc-mock.ts  # Custom test fixture — MUST import from here
    └── mock-app/       # Static file server for test HTML/JS
```

### Tauri IPC Bridge

- `safeInvoke(cmd, args)` wraps `window.__TAURI_IPC__` with a callback-based protocol.
- When `__TAURI_IPC__` is absent (plain browser dev), falls back to `handleFallback()` which uses `localStorage` for state.
- Tauri commands (all in `commands.rs`): `load_settings`, `save_settings`, `get_vault_files`, `read_vault_file`, `write_vault_file`, `fetch_and_parse_d2l`, `import_external_location`, `remove_external_location`, `convert_office_doc`, `open_in_default_app`.
- Vault root (Rust): `~/OneDrive/Obsidian/Obsidian-Education`.
- Settings path (Rust): `~/.config/studyspace/settings.json`.
- Tauri capabilities are minimal: only `core:default`.

### Layout & Navigation

- Navigation: sidebar tabs with `data-testid="tab-workspace"`, `tab-d2l`, `tab-settings`.
- Views: `'notes'` (default split-pane), `'d2l'` (overlay), `'settings'` (overlay).
- Split pane: Editor (left) + Viewer (right) with draggable resizer.

### State Management

- **Single** `AppContext` in `AppContext.tsx` provides all global state.
- No external state library (no Zustand/Redux/Jotai).
- Context exports: `useApp()` hook, `safeInvoke()` utility, `FileObject`/`AppSettings`/`D2LEvent` types.

### Theme Engine

- 4 themes: `'Dark Mode'` (default), `'Light Mode'`, `'AMOLED Mode'`, `'Colored Glass Mode'`.
- CSS class mapped: `theme-dark`, `theme-light`, `theme-amoled`, `theme-colored-glass`.
- Applied to `<html>` element. CSS variables defined in `index.css`.
- Toasts have adaptive border colors (`border-blue-500` / `border-violet-500` / `border-cyan-400`).

### Feature Toggles

- Two toggles: `'d2l_sync'`, `'cad_viewer'`.
- Both enabled by default.
- Disabling `cad_viewer` grays out .stl files in explorer (data-testid pattern: `file-item-gear.stl-disabled`).
- Disabling `d2l_sync` hides the D2L tab and the iCal URL input in settings.

## TypeScript Config Quirks

- **3 tsconfigs** with project references. Root `tsconfig.json` only covers `tests/` and `playwright.config.ts`.
- `tsconfig.app.json` — covers `src/`. Key flags:
  - `noUnusedLocals: true`, `noUnusedParameters: true`
  - `verbatimModuleSyntax: true` → use `import type` for type-only imports
  - `erasableSyntaxOnly: true` → no enums, no namespaces, no `constructor` parameter properties
  - `allowArbitraryExtensions: true`
  - `jsx: "react-jsx"`
- `tsconfig.node.json` — covers `vite.config.ts` only. Uses `module: "nodenext"`.

## Tooling Quirks

- **oxlint** replaces ESLint. Config in `.oxlintrc.json` — only `react/rules-of-hooks` (error) and `react/only-export-components` (warn).
- **No prettier** config found. oxlint may do some formatting but no auto-formatter is configured.
- **React Compiler not enabled** (by design — dev/build performance impact).
- Project package name is `temp_vite` (placeholder, not renamed).
- `index.html` `<title>` is `temp_vite` (placeholder, not renamed).
- TypeScript ~6.0.2, Vite ~8.1.1 — very new versions. Check compatibility before adding deps.
