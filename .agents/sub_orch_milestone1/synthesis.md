# Synthesis Report - Milestone 1 Investigation

## Consensus
1. **Toolchain Check**: The system currently has Node.js (v25.3.0) and NPM (11.13.0) installed and in the PATH, but lacks the Rust toolchain (`cargo` / `rustc`) in the current shell's PATH. The first action must be to install or configure Rustup.
2. **Bootstrapping Strategy**: To avoid directory collision with existing `.agents/` and `PROJECT.md` folders, initialization should use a manual hybrid approach:
   - Run `npm create vite@latest . -- --template react-ts` (and choose to merge/keep existing files).
   - Install dependencies (Tailwind, Three.js, Lucide Icons, Resizable Panels, Syntax Highlighter, etc.).
   - Install `@tauri-apps/cli` and run `npx tauri init` to scaffold the `src-tauri` Rust project.
3. **Security & Permissions**: Define explicit `fs` (file system) and `http` (CORS proxy bypass) permissions.
   - For Tauri v1, configure the `"allowlist"` in `src-tauri/tauri.conf.json` with restricted scopes (e.g. `fs` scoped to `$DOCUMENT/*` and `http` scoped to `https://*`).
   - For Tauri v2, if used, register the `@tauri-apps/plugin-fs` and `@tauri-apps/plugin-http` plugins and configure permissions in a capability file.
4. **UI Layout**: Deploy a modern glassmorphic dark theme.
   - Utilize a root context `AppContext.tsx` managing navigation state (`notes`, `calendar`, `settings`), active file, theme values, and feature toggles.
   - Use `Layout.tsx` for the shell layout: a left navigation icon-bar, a collapsible folder explorer, and a split pane utilizing `react-resizable-panels` separating the editor and the visual viewer.

## Resolved Conflicts / Decision Points
- **Tauri Version Selection**: We will target Tauri v1.x because `PROJECT.md` references a single `Cargo.toml` containing `tauri`, `reqwest`, `serde`, and `ical` without indicating plugin separation (typical of Tauri v2). The worker will configure `src-tauri/tauri.conf.json` with Tauri v1 allowlist format.
- **Tailwind Version**: We will configure Tailwind CSS v3 using postcss/autoprefixer for ease of configuration and compatibility with standard React templates.

## Action Plan for Worker
1. **Initialize Rust environment**: Install Rustup if not present, and ensure `cargo` and `rustc` are accessible.
2. **Scaffold frontend**: Initialize the React + Vite + TypeScript application in the workspace root.
3. **Configure Tailwind CSS**: Setup Tailwind config, PostCSS, and index.css with custom glassmorphic CSS variables and classes.
4. **Scaffold Tauri backend**: Run `npx tauri init` to create `src-tauri`.
5. **Configure Permissions**: Add `fs` and `http` allowlist settings in `tauri.conf.json` to allow necessary filesystem access and HTTP requests.
6. **Implement UI shell components**: Write `src/context/AppContext.tsx`, `src/App.tsx`, `src/components/Layout.tsx`, and place placeholders for the subcomponents (`Editor.tsx`, `Explorer.tsx`, `Viewer.tsx`, `Settings.tsx`).
7. **Verify**: Ensure both frontend and backend compile and run correctly.
