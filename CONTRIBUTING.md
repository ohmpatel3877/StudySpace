# Contributing to StudySpace

## Development Setup

1. **Prerequisites**
   - Rust toolchain (latest stable): `rustup update`
   - Node.js 20+: `nvm use 20` or install from nodejs.org
   - npm (comes with Node.js)

2. **Clone and install**
   ```bash
   git clone https://github.com/ohmpatel3877/StudySpace.git
   cd StudySpace
   npm install
   ```

3. **Run in development**
   ```bash
   npm run dev           # Vite dev server (browser only, port 5173)
   npx tauri dev         # Full Tauri desktop app
   ```

## Testing

```bash
npm run test:e2e:mock   # Run E2E tests (no real Tauri needed)
npm run lint            # oxlint
npm run build           # TypeScript type-check + Vite build
```

See [TEST_INFRA.md](TEST_INFRA.md) for the full test methodology.

## Code Style

- **TypeScript**: strict unused locals/params, `verbatimModuleSyntax` (use `import type`), `erasableSyntaxOnly` (no enums)
- **Linting**: oxlint (not ESLint) — config in `.oxlintrc.json`
- **Styling**: Tailwind CSS 3 with custom CSS variables in `src/index.css`
- **State**: Single React Context (`src/context/AppContext.tsx`) — no external state libraries

## Architecture

| Directory | Purpose |
|-----------|---------|
| `src/` | React frontend (TypeScript + Vite + Tailwind) |
| `src-tauri/` | Rust backend (Tauri 2, 10 commands) |
| `tests/` | Playwright E2E tests with mocked Tauri IPC |
| `src/graph/` | AcademyGraph knowledge graph engine |

See [PROJECT.md](PROJECT.md) for interface contracts between frontend and backend.

## PR Guidelines

1. Branch from `main`
2. Run `npm run build` and `npm run test:e2e:mock` before committing
3. Use `data-testid` selectors for any new UI elements
4. Add E2E tests for new features (follow the pattern in `tests/`)
5. Update `AGENTS.md` if adding new commands or changing architecture

## Related Repositories

- [study-tutor](https://github.com/ohmpatel3877/study-tutor) — Standalone exam prep PWA with AcademyGraph
- [ai-memory-core](https://github.com/ohmpatel3877/ai-memory-core) — MCP server for persistent memory
- [agent-memory-mcp](https://github.com/ohmpatel3877/agent-memory-mcp) — TypeScript MCP memory server
