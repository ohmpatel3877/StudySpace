# StudySpace

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-alpha-orange.svg)
![Tauri](https://img.shields.io/badge/Tauri-2-ffc131.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg)

A Tauri 2 + React 19 desktop study workspace with a glassmorphic dark UI. Combines Markdown notes, file management, document/code viewing, a knowledge graph, and D2L Brightspace calendar sync into a single desktop application.

This is a personal, in-progress project (see [PKM_PLAN.md](PKM_PLAN.md) decision D4) — not a finished product. [AUDIT.md](AUDIT.md) documents what was found to be real vs. fiction in this codebase as of 2026-08-20, and [PKM_PLAN.md](PKM_PLAN.md) is the phased plan to close the gap. Read those two files before trusting a feature claim anywhere else in the repo.

## Status

| Feature | State | Notes |
|---|---|---|
| Markdown note editor | Working | |
| File explorer / vault navigation | Working | Vault root is currently hardcoded (`~/OneDrive/Obsidian/Obsidian-Education`); no path-traversal guard yet — see [AUDIT.md](AUDIT.md) Finding 4. |
| Custom theme engine (Dark, Light, AMOLED, Colored Glass) | Working | |
| D2L Brightspace iCal calendar sync | Partial | Parses feeds, but has no timezone handling, no `RRULE` expansion, and collapses `DTSTART`/`DUE` into one field. See AUDIT Finding 5. |
| C/C++ code viewer | Partial | Syntax highlighting is a hand-rolled regex tokenizer, not the installed `react-syntax-highlighter`. |
| PDF viewer | Stub | Backend file read is `fs::read_to_string`, which errors on any non-UTF8 file — PDFs cannot actually load. |
| Office document conversion | Stub | Calls real `soffice`, but returns a path that cannot be read back, and reports a fixed error string regardless of actual failure cause. |
| 3D CAD model viewer (STL/OBJ) | Stub | `CadViewer.tsx` renders a `<div>` containing the literal text "WebGL Canvas rendering with Auto-Rotation." `three` is installed and imported nowhere. |
| Knowledge graph | Real engine, fake data | The canvas force-directed renderer is genuine, original code. The entities and edges it displays are hardcoded fictional data, unconnected to any vault content. |
| External file location imports (WebDAV/SMB/local) | Stub | Appends a string to a settings array; nothing reads it back. |
| Tauri IPC (frontend ↔ Rust backend) | Working | Fixed 2026-08-20: the frontend previously spoke the Tauri 1 protocol against a Tauri 2 backend and silently fell through to a localStorage fallback on every call. It now uses `invoke()` from `@tauri-apps/api/core`. |

Full detail, evidence, and file/line references for every row above are in [AUDIT.md](AUDIT.md).

## Architecture

Tauri 2 backend (Rust) + React frontend (TypeScript, Vite, Tailwind CSS).

## Prerequisites

- Rust toolchain (latest stable)
- Node.js 20+
- npm
- Optional: LibreOffice for document conversion

## Quick Start

```bash
git clone https://github.com/ohmpatel3877/StudySpace.git
cd StudySpace
npm install
npm run dev          # Vite dev server only (browser, no Tauri backend)
npx tauri dev        # Full Tauri desktop app
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server (port 5173) |
| `npm run build` | Type-check (`tsc -b`) + Vite build |
| `npm run lint` | oxlint |
| `npm run preview` | Serve the built `dist/` (port 4173) |
| `npm run test:e2e` | Playwright E2E tests against the real app (built via `vite preview`) |
| `npm run test:e2e:ui` | Playwright UI mode, same target, for interactive dev |
| `npm run gate` | Full verification gate: lint → build → E2E → `cargo fmt`/`clippy`/`check`. Mirrors CI. |
| `npm run gate:rust` | Rust-only portion of the gate (`cargo fmt --check`, `cargo clippy -- -D warnings`, `cargo check`) |
| `npx tauri dev` | Tauri desktop dev mode |
| `npx tauri build` | Build installer/binary |

`test:e2e:mock` still exists as an alias of `test:e2e` for anything referencing the old name; there is no separate mock target any more.

## Building the Installer

```bash
npx tauri build
```

The installer will be in `src-tauri/target/release/bundle/`.

## Testing

118 Playwright tests (115 original spec assertions + 3 harness self-checks), run against the real React app served from a production build — not a hand-written mock.

- The suite builds the app (`npm run build`) and serves it with `vite preview` on port 4173; Playwright drives that, not a separate mock server.
- The frontend/backend boundary is faked in one place only: `tests/mocks/tauri-ipc-mock.ts` injects a Tauri 2 IPC layer (`window.__TAURI_INTERNALS__`) so the tests can run in a browser with no compiled Rust binary. Everything above that boundary — React rendering, state, routing, the theme engine, the editor — is the real `src/` code.
- `tests/gate-sentinel.spec.ts` asserts the harness itself is wired correctly (real app is loaded, the Tauri 2 IPC boundary is actually crossed, and rendered content reflects backend data), so silent detachment from the real app fails loudly rather than reporting false green.
- Run: `npm run gate` (full check, matches CI) or `npm run test:e2e` (E2E only).

**What the gate does not verify**, in detail in [GATE-BASELINE.md](GATE-BASELINE.md):

- `tests/mocks/tauri-ipc-mock.ts` is a hand-written stub of the 10 Rust commands. Nothing in this repo checks that its responses match what `commands.rs` actually returns — the fiction boundary moved from "mock app vs. real app" down to "mock backend vs. real backend," it was not eliminated.
- Several tests are deliberately left green while asserting stub behavior rather than being marked `fixme`, each tied to the plan phase that will make it real: the PDF viewer test accepts a widened regex matching the mock's sentinel string; the CAD viewer tests assert against the placeholder `<div>` and a fake WebGL-loss timer; the office conversion tests assert against a path the mock invents. See GATE-BASELINE.md for the full list and line references.
- The only current check that the mock and the real Rust backend agree is manual: running `npx tauri dev` and exercising the app by hand. Automated `tauri-driver` binary-mode E2E against the compiled app was specified in the original test design and has never been built.

## Project Structure

```
StudySpace/
├── src/            # React frontend
│   ├── components/ # Layout, Editor, Explorer, Viewer, CadViewer, KnowledgeGraph, etc.
│   ├── context/    # AppContext (global state, Tauri IPC via safeInvoke)
│   └── main.tsx    # Entry point
├── src-tauri/      # Rust backend
│   └── src/        # main.rs, commands.rs (10 commands)
└── tests/          # Playwright E2E tests against the real app, plus the IPC mock
```

## Configuration

- **TypeScript**: 3 tsconfigs with project references, strict unused locals/params
- **Linting**: oxlint (not ESLint)
- **Styling**: Tailwind CSS 3 + glassmorphic CSS variables
- **State**: Single React Context (no Redux/Zustand)

## Related Documents

- [AUDIT.md](AUDIT.md) — what is real vs. stub in this codebase, with file/line evidence
- [GATE-BASELINE.md](GATE-BASELINE.md) — what the test gate verifies and does not verify
- [PKM_PLAN.md](PKM_PLAN.md) — the phased plan and decisions of record
- `AGENTS.md` — agent onboarding instructions
- `PROJECT.md` — architecture spec and interface contracts (note: its milestone table currently marks some stubs as `DONE`; treat AUDIT.md as authoritative until PROJECT.md is corrected in Phase 2)
- `TEST_INFRA.md` — E2E test methodology (predates the Phase 0 retargeting; some details are stale)

## License

MIT
