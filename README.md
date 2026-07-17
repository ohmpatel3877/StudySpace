# StudySpace

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-alpha-orange.svg)
![Tauri](https://img.shields.io/badge/Tauri-2-ffc131.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg)

A Tauri 2 + React 19 desktop study workspace with a glassmorphic dark UI. Combines Markdown notes, file management, document/code viewing, 3D CAD preview, and D2L Brightspace calendar sync into a single offline-first desktop application.

## Features

- **Core Tauri desktop app** with glassmorphic dark UI
- **Markdown note editor** with live preview
- **File explorer sidebar** with vault navigation
- **PDF document viewer**
- **C/C++ code viewer** with syntax highlighting and inline editing
- **3D CAD model viewer** (STL/OBJ) with Three.js
- **Office document conversion** via LibreOffice
- **D2L Brightspace iCal calendar sync**
- **Custom theme engine** (Dark, Light, AMOLED, Colored Glass)
- **Modular feature toggles**
- **External file location imports** (local, WebDAV, SMB)
- **Open in default system application**

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
npm run dev          # Vite dev server only (browser)
npx tauri dev        # Full Tauri desktop app
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server (port 5173) |
| `npm run build` | Type-check + build |
| `npm run lint` | oxlint |
| `npm run test:e2e:mock` | Playwright E2E tests |
| `npx tauri dev` | Tauri desktop dev mode |
| `npx tauri build` | Build installer/binary |

## Building the Installer

```bash
npx tauri build
```

The installer will be in `src-tauri/target/release/bundle/`.

## Testing

- 115 E2E tests across 12 spec files
- 4-tier methodology: Feature Coverage, Boundary/Corner Cases, Cross-Feature Combinations, Real-World Scenarios
- Run: `npm run test:e2e:mock`
- Tests use a mocked Tauri IPC layer — no real Tauri runtime needed
- Test infrastructure detailed in `TEST_INFRA.md`

## Project Structure

```
StudySpace/
├── src/            # React frontend
│   ├── components/ # Layout, Editor, Explorer, Viewer, etc.
│   ├── context/    # AppContext (global state)
│   └── main.tsx    # Entry point
├── src-tauri/      # Rust backend
│   └── src/        # main.rs, commands.rs (10 commands)
└── tests/          # Playwright E2E tests + mock infrastructure
```

## Configuration

- **TypeScript**: 3 tsconfigs with project references, strict unused locals/params
- **Linting**: oxlint (not ESLint)
- **Styling**: Tailwind CSS 3 + glassmorphic CSS variables
- **State**: Single React Context (no Redux/Zustand)

## Related Documents

- `AGENTS.md` — Agent onboarding instructions
- `PROJECT.md` — Full architecture spec and interface contracts
- `TEST_INFRA.md` — E2E test methodology and test case listing

## License

MIT
