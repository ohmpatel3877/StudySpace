# StudySpace — Agent Instructions

Tauri 2 + React 19 + TypeScript 6 + Vite 8 desktop study workspace. Glassmorphic dark UI, Markdown notes, 3D CAD viewer (stub — see below), D2L iCal sync.

> **This file is for OpenCode agents.** Every line answers: "Would an agent likely miss this without help?"

> **Read `AUDIT.md`, `GATE-BASELINE.md`, and `PKM_PLAN.md` first.** They are the current ground truth on what is real vs. stubbed in this codebase and what phase of work is underway. This file describes mechanics (commands, layout, config); those three describe status and plan.

---

## Do not delete: `tests/mocks/tauri-ipc-mock.ts`

This file is **load-bearing**, not scaffolding. It is the only thing that lets the real React app reach a fake backend under Playwright — it injects `window.__TAURI_INTERNALS__` (the Tauri 2 IPC entry point) via `page.addInitScript` before the app boots, and `core.spec.ts` / `import.spec.ts` deliberately break parts of that injection mid-test to prove their assertions aren't vacuous (see `GATE-BASELINE.md`). Deleting or "cleaning up" it as unused/dead code will silently degrade every spec that imports `test` from it back to testing nothing. Every spec file must import `test` from here, not from `@playwright/test` directly.

`tests/mocks/tauri-driver/` is a separate, unrelated, effectively-empty stub (no real WebDriver binary mode exists yet) — do not confuse the two.

---

## Commands

| Action | Command | Notes |
|--------|---------|-------|
| Dev server (Vite only) | `npm run dev` | Port 5173 |
| Build (full typecheck) | `npm run build` | Runs `tsc -b` first, then `vite build` |
| Lint | `npm run lint` | Uses **oxlint**, not ESLint. No config for prettier. |
| E2E tests | `npm run test:e2e` | Playwright, against the real React app (see Testing below). `npm run test:e2e:mock` is now just an alias for this — it no longer means "mock frontend". |
| E2E tests (UI mode) | `npm run test:e2e:ui` | Same, with Playwright's UI runner |
| Full gate | `npm run gate` | `lint && build && test:e2e && gate:rust` — the closest local equivalent to CI |
| Rust gate | `npm run gate:rust` | `cd src-tauri && cargo fmt --check && cargo clippy -- -D warnings && cargo check` — this now actually fails on error (see CI below) |
| Tauri dev | `npx tauri dev` | Starts Vite + Tauri desktop window |
| Tauri build | `npx tauri build` | Full release binary |

> `npm run build` requires both `tsc` invocations (`tsconfig.app.json` + `tsconfig.node.json`) to pass. `tsc -b` uses project references, so both tsconfigs are checked.

## Testing

- **Framework**: Playwright, `mock-frontend` project (Desktop Chrome only) — the project name is a historical label from when it targeted `tests/mock-app/`; that app is gone, the project name was not renamed.
- **No unit tests** — only E2E via Playwright. Test code lives in `tests/`.
- **Target is the real app.** `playwright.config.ts`'s `webServer` runs `npm run build && npx vite preview --port 4173 --strictPort` and `baseURL` is `http://localhost:4173`. Every spec now exercises `src/` compiled to `dist/`, not a hand-written twin. (Until 2026-08-20 the suite ran against `tests/mock-app/`, a 996-LOC hand-written HTML/JS mock on port 5188, which meant 115/115 could pass with `src/` deleted entirely — see `AUDIT.md` Finding 1. That directory and its server are deleted.)
- **Custom test fixture** in `tests/mocks/tauri-ipc-mock.ts` extends Playwright's `test` and injects a `window.__TAURI_INTERNALS__` mock via `page.addInitScript` before every test — the Tauri **2** IPC surface (`@tauri-apps/api`'s `invoke()` calls `window.__TAURI_INTERNALS__.invoke`). Use `import { test } from './mocks/tauri-ipc-mock'` in all spec files, not `@playwright/test`. See the warning above — this file must not be deleted.
- `tests/gate-sentinel.spec.ts` is new: 3 tests that assert the harness is actually attached to the real app (i.e. that the gate itself hasn't silently regressed to testing a mock again).
- Test count: **118 passing** (115 original specs + 3 gate sentinels), per `GATE-BASELINE.md`.
- **data-testid** selectors used throughout — see existing spec files for pattern.
- Test organization mirrors features: `core.spec.ts`, `note.spec.ts`, `view.spec.ts`, `sync.spec.ts`, `theme.spec.ts`, `toggle.spec.ts`, `import.spec.ts`, `office.spec.ts`, `inline.spec.ts`, `bridge.spec.ts`, `combinations.spec.ts`, `scenarios.spec.ts`, plus `gate-sentinel.spec.ts`.
- `beforeEach` always does `await page.goto('/')`.
- A test passing with its IPC override in place proves nothing by itself — `GATE-BASELINE.md` documents at least one spec (`T2_THEME_2`) that passed while asserting nothing until it was rewritten to distinguish its failure path from its happy path. Keep that bar in mind when adding new specs against the mock IPC layer.

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
│   ├── App.tsx          # Provider + toast
│   ├── context/AppContext.tsx  # Single global context — all state
│   ├── components/     # Layout, Explorer, Editor, Viewer, CadViewer,
│   │                   # CodeViewer, PdfViewer, D2LDashboard, Settings
│   └── index.css       # Tailwind + glassmorphic theme CSS variables
└── tests/              # Playwright E2E tests
    ├── mocks/tauri-ipc-mock.ts  # Custom test fixture — MUST import from here, load-bearing (see warning above)
    ├── mocks/tauri-driver/      # Unrelated empty stub, not wired to anything real
    └── gate-sentinel.spec.ts    # Asserts the suite is attached to the real app
```

`tests/mock-app/` (the 996-LOC hand-written HTML/JS twin of the app) and `playwright.config.js` (a stale duplicate of `playwright.config.ts`) have been **deleted**. If you see either referenced in an older doc or PR, that reference is stale.

### Tauri IPC Bridge

- `safeInvoke(cmd, args)` (`src/context/AppContext.tsx`) checks `hasTauriBackend()`, which tests `typeof window.__TAURI_INTERNALS__?.invoke === 'function'`, and on success calls `invoke(cmd, args)` imported from `@tauri-apps/api/core`. This is the correct Tauri 2 transport.
  - Previously it probed `window.__TAURI_IPC__` (the Tauri **1** global, which does not exist anywhere in `@tauri-apps/api@2`), so the guard was always falsy in the packaged desktop app and every call silently fell through to the localStorage fallback below — see `AUDIT.md` Finding 2. That has been fixed; `@tauri-apps/api` is now actually imported and used.
- When `hasTauriBackend()` is false (plain browser dev, or the packaged app in some failure mode), `safeInvoke` falls back to `handleFallback()`, which uses `localStorage` for state with fabricated seed data. This fallback is real and still present — do not assume every code path talks to Rust just because the transport is now correct.
- Tauri commands (all in `commands.rs`): `load_settings`, `save_settings`, `get_vault_files`, `read_vault_file`, `write_vault_file`, `fetch_and_parse_d2l`, `import_external_location`, `remove_external_location`, `convert_office_doc`, `open_in_default_app`.
- Vault root (Rust, `commands.rs:44-47`): hardcoded to `~/OneDrive/Obsidian/Obsidian-Education`. Not user-configurable, not canonicalized, and joined with untrusted paths with no `..` rejection or absolute-path guard (see `AUDIT.md` Finding 4 for the resulting traversal/override defects). Per `PKM_PLAN.md` decision D1, this hardcoded root is planned for **removal**, not preservation — StudySpace is meant to become an independent store, not an Obsidian-vault reader.
- Settings path (Rust): `~/.config/studyspace/settings.json`.
- Tauri capabilities (`src-tauri/capabilities/default.json`): **not minimal.** The file grants `core:default`, `fs:default` plus explicit `fs:allow-read`/`fs:allow-write` scoped to the vault path and `$APPDATA`, `http:default` plus explicit `http:allow-fetch` allowing **both** `https://*` and `http://*` (not HTTPS-only), and `shell:default` plus `shell:allow-open`. `csp` is `null` in `tauri.conf.json` — no CSP is configured.
  - Important nuance: in Tauri 2, the ACL/capabilities system gates **plugin** commands only. All 10 commands above are custom `#[tauri::command]` functions registered via `generate_handler!`, and capabilities do **not** constrain them at all — they are reachable from the webview regardless of what `default.json` says. The `fs:allow-read`/`fs:allow-write` vault scoping is therefore decorative with respect to the actual file I/O, which goes through unscoped `std::fs` calls in `commands.rs`. See `AUDIT.md` Finding 4.

### Layout & Navigation

- Navigation: sidebar tabs with `data-testid="tab-workspace"`, `tab-d2l`, `tab-settings`.
- Views: `'notes'` (default split-pane), `'d2l'` (overlay), `'settings'` (overlay).
- Split pane: Editor (left) + Viewer (right) with draggable resizer.

### State Management

- **Single** `AppContext` in `AppContext.tsx` provides all global state.
- No external state library (no Zustand/Redux/Jotai).
- Context exports: `useApp()` hook, `safeInvoke()` utility, `FileObject`/`AppSettings`/`D2LEvent` types.

### Known stubs — do not describe these as working

Per `AUDIT.md` Finding 5, several features marked `DONE` in `PROJECT.md` are not functionally real yet. When touching this code, describe status accurately:

- **3D CAD viewer** (`CadViewer.tsx`): renders a `<div>` containing the literal text `[WebGL Canvas rendering with Auto-Rotation]`. No `<canvas>`, no Three.js scene. `three`, `@react-three/fiber`, `@react-three/drei` are installed but imported nowhere in `src/`. Real implementation is planned per `PKM_PLAN.md` D2.
- **External location import** (`import_external_location` in `commands.rs`): appends a string to a settings array and does nothing else. `get_vault_files` never surfaces external paths.
- **Office conversion** (`convert_office_doc`): invokes real `soffice`, but returns a path (`/temp/{name}`) that does not resolve back to a readable location on Windows.
- **Binary file loading** (`read_vault_file`): is `fs::read_to_string` only — it errors on any non-UTF-8 file, yet it is the load path used for `.pdf` and `.stl` files.
- **Knowledge graph**: the renderer (`academy-graph.js`) is real, original, working canvas physics code. The data it renders (`academy-data.js`) is entirely fictional demo content unrelated to the user's notes. Per `PKM_PLAN.md` D3, the plan is to keep the renderer and delete the fictional data, pointing the graph at real vault links instead.

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

## TypeScript Config

- **3 tsconfigs** with project references. Root `tsconfig.json` only covers `tests/` and `playwright.config.ts`.
- `tsconfig.app.json` — covers `src/`. Key flags:
  - `noUnusedLocals: true`, `noUnusedParameters: true`
  - `verbatimModuleSyntax: true` → use `import type` for type-only imports
  - `erasableSyntaxOnly: true` → no enums, no namespaces, no `constructor` parameter properties
  - `allowArbitraryExtensions: true`
  - `jsx: "react-jsx"`
- `tsconfig.node.json` — covers `vite.config.ts` only. Uses `module: "nodenext"`.

## Tooling Quirks

- **oxlint** replaces ESLint. Config in `.oxlintrc.json` — only `react/rules-of-hooks` (error) and `react/only-export-components` (warn). Note: this rule has historically false-flagged `await use(page)` in Playwright fixtures as a call to React's `use` hook — `tests/mocks/tauri-ipc-mock.ts` works around this by naming its fixture callback's second argument `provide` instead of `use`. Do not rename it back.
- **No prettier** config found. oxlint may do some formatting but no auto-formatter is configured.
- **React Compiler not enabled** (by design — dev/build performance impact).
- Project package name is `studyspace` (`package.json` `name` field — no longer the `temp_vite` placeholder).
- `index.html` `<title>` is `StudySpace` (no longer the `temp_vite` placeholder).
- TypeScript ~6.0.2, Vite ~8.1.1 — very new versions. Check compatibility before adding deps.
- `vite.config.ts` includes Tauri-specific settings that are load-bearing, not optional polish: `server.watch.ignored` excludes `src-tauri/**` (without it, `tauri dev` crashes with `EBUSY` the moment cargo links its output binary — see `AUDIT.md` Finding 8), plus `strictPort` and `clearScreen: false`, and an explicit `preview` block on port 4173 that the E2E gate depends on.

## CI

`.github/workflows/ci.yml` runs `cargo fmt --check`, `cargo clippy -- -D warnings`, and `cargo check` as steps that can actually fail the build. Previously `cargo check` was wrapped in `|| echo "skipping"`, which swallowed every Rust compile error, not just a missing toolchain — see `AUDIT.md` Finding 3. CI now also installs Playwright browsers before running E2E, which it previously never did.

## Important Files

| File | Purpose |
|------|---------|
| `AUDIT.md` | What is real vs. fiction in this codebase, as of the audit date — read first |
| `GATE-BASELINE.md` | What the E2E/CI gate does and does not verify |
| `PKM_PLAN.md` | The phased plan and decisions of record for where this project is going |
| `PROJECT.md` | Full spec: architecture, code layout, milestone table, interface contracts. Some milestone statuses in this file are inaccurate — cross-check against `AUDIT.md` Finding 5 before trusting a `DONE` marker. |
| `tests/mocks/tauri-ipc-mock.ts` | **Must import test from here**, not `@playwright/test`. Load-bearing — do not delete (see warning above). |
| `src/context/AppContext.tsx` | Global state, Tauri IPC wrapper (`safeInvoke`) with localStorage fallback |
| `.oxlintrc.json` | Linter config — oxlint, not ESLint |

## Related Repositories

| Repo | Description | URL |
|------|-------------|-----|
| study-tutor | Adaptive exam prep PWA with spaced repetition, AcademyGraph knowledge graph | github.com/ohmpatel3877/study-tutor |
| ai-memory-core | Python 68-tool MCP server (BM25 memory, skill router, trace system) | github.com/ohmpatel3877/ai-memory-core |
| agent-memory-mcp | TypeScript MCP memory server (LanceDB, cortical architecture, KG) | github.com/ohmpatel3877/agent-memory-mcp |
| wshobson-agents | Multi-harness agentic plugin marketplace (94 plugins, 203 agents) | github.com/ohmpatel3877/wshobson-agents |
| opencad | CAD collaboration pnpm monorepo | github.com/ohmpatel3877/opencad |
