# Developer Setup

## Prerequisites

- **Rust toolchain** (stable) — install via [rustup.rs](https://rustup.rs)
- **Node.js 20+** — install via [nodejs.org](https://nodejs.org) or nvm
- **npm** (ships with Node.js)

### Tauri Build Dependencies

#### Windows
- Microsoft Visual Studio Build Tools 2022 (or Visual Studio 2022 with C++ workload)
- WebView2 (ships with Windows 10 1803+ / Windows 11)

#### Linux
```bash
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev \
  libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

#### macOS
- Xcode Command Line Tools: `xcode-select --install`

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/ohmpatel3877/StudySpace.git
cd StudySpace

# Install JavaScript dependencies
npm install

# Install Tauri CLI (if not already installed)
cargo install tauri-cli --version "^2"
```

---

## Development

### Run Dev Server (Vite only — browser)

```bash
npm run dev
```

Starts Vite dev server on **port 5173**. The app runs in a browser with mocked Tauri IPC (falls back to `localStorage`).

### Run Dev Server with Tauri Desktop

```bash
npx tauri dev
```

Starts Vite + opens a native Tauri window. Requires Rust toolchain and Tauri build dependencies.

---

## Testing

```bash
# Run E2E tests with mocked frontend
npm run test:e2e:mock
```

Uses Playwright with a custom mock frontend project (Desktop Chrome). The mock web server runs on port 5188, auto-managed by Playwright's `webServer` config.

---

## Build

```bash
# Full typecheck + Vite build
npm run build

# Release binary
npx tauri build
```

`npm run build` runs `tsc -b` first (checks both `tsconfig.app.json` and `tsconfig.node.json`), then `vite build`.

---

## Lint

```bash
npm run lint
```

Uses **oxlint** (not ESLint). Config in `.oxlintrc.json`.

---

## Project Structure

```
StudySpace/
├── src-tauri/          # Rust backend (Tauri 2)
│   ├── src/
│   │   ├── main.rs     # Entry point, 10 commands registered
│   │   └── commands.rs # Command implementations
│   └── tauri.conf.json # Tauri config
├── src/                # React frontend
│   ├── main.tsx        # Mount point
│   ├── App.tsx         # Root component
│   ├── context/        # Global state (AppContext)
│   ├── components/     # UI components
│   └── styles/         # Tailwind CSS + theme variables
├── tests/              # Playwright E2E tests
│   ├── mocks/          # Tauri IPC mock fixture
│   └── mock-app/       # Test static file server
└── package.json        # Dependencies & scripts
```

---

## Configuration Files

| File | Purpose |
|------|---------|
| `tsconfig.json` | Root TS config (covers tests/) |
| `tsconfig.app.json` | TS config for src/ |
| `tsconfig.node.json` | TS config for vite.config.ts |
| `vite.config.ts` | Vite build configuration |
| `tailwind.config.js` | Tailwind CSS configuration |
| `.oxlintrc.json` | oxlint linter rules |
| `playwright.config.ts` | Playwright E2E test config |
