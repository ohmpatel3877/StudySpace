# Handoff Report - Explorer 2 (Milestone 1 Setup & Layout Strategy)

This handoff report summarizes the findings, reasoning, and suggested structure for setting up the Tauri desktop application with a React + Vite + TypeScript + Tailwind CSS frontend.

---

## 1. Observation

1. **Workspace Inspection**: Running `list_dir` on `C:\Users\ohmpa\OneDrive\Obsidian\Obsidian-Education\StudySpace` returned an empty workspace except for the project documentation and subagent metadata:
   * Directory items:
     ```json
     {"name":".agents","isDir":true}
     {"name":"PROJECT.md","sizeBytes":"5821"}
     ```
2. **Environment Toolchain Diagnostic Check**: Executed `node --version; npm --version; cargo --version; rustc --version` under task `task-25`. The result was:
   * Node version: `v25.3.0`
   * NPM version: `11.13.0`
   * Cargo failure: 
     ```
     cargo: The term 'cargo' is not recognized as a name of a cmdlet, function, script file, or executable program.
     Check the spelling of the name, or if a path was included, verify that the path is correct and try again.
     ```
   * Rustc failure:
     ```
     rustc: The term 'rustc' is not recognized as a name of a cmdlet, function, script file, or executable program.
     Check the spelling of the name, or if a path was included, verify that the path is correct and try again.
     ```
3. **Core Requirements (from `PROJECT.md`)**:
   * Rust backend dependencies: `tauri`, `reqwest`, `serde`, `ical`.
   * Custom commands: `get_vault_files`, `read_vault_file`, `write_vault_file`, `fetch_and_parse_d2l`, `save_settings`, `load_settings`.
   * Frontend: Glassmorphic dark UI layout, split pane (Explorer/Editor left, Viewer right), theme engine, features toggles, 3D CAD viewer, PDF viewer, code viewer, and calendar dashboard.

---

## 2. Logic Chain

1. **Toolchain Status & Init Plan**:
   * Since Node.js and NPM are present (Observation 2), initialization of the React+Vite skeleton can proceed immediately using npm.
   * However, because Cargo and Rustc are not in the current shell's PATH (Observation 2), the system will fail to build or compile the Rust backend. Therefore, installing Rustup and setting up C++ Build Tools is the necessary first step of the project setup.
   * The cleanest setup path for a Tauri v2 (or v1) app is using `npm create tauri-app@latest .` which configures a dual Rust/TypeScript workspace automatically.
2. **Dependency Design**:
   * To fulfill the requirements of a 3D CAD Viewer, Lucide icons, and a glassmorphic responsive layout, the package manager must install:
     * `three` and `@types/three` + `@react-three/fiber` and `@react-three/drei` (enables declarative WebGL rendering inside React components).
     * `lucide-react` (provides layout icons).
     * `tailwindcss`, `postcss`, `autoprefixer` (standard Tailwind chain).
     * `clsx` & `tailwind-merge` (for dynamic styling transitions).
3. **Security & Scope Configurations**:
   * `PROJECT.md` states all file operations and network fetches are handled via custom Rust backend commands (Observation 3).
   * This backend-centric design is highly secure because it avoids giving raw, unconstrained `fs` and `http` APIs directly to the frontend webview.
   * If the direct Tauri JS APIs are utilized, `tauri.conf.json` must limit the file system scope (e.g. to `$DOCUMENT/StudySpaceVault/*`) and restrict HTTP URLs to Brightspace endpoints to mitigate XSS-to-RCE security vectors. Scopes for both Tauri v1 and Tauri v2 plugins have been detailed in `analysis.md`.
4. **Glassmorphic UI & Layout Architecture**:
   * A glassmorphic theme requires dynamic blur backdrops (`backdrop-blur-md`), background transparency overlays, and border strokes (Observation 3).
   * We structure this in `App.tsx` by wrapping the UI in a global provider, adding a glowing absolute-positioned gradient overlay, and loading a split-pane `Layout.tsx` shell.
   * In `Layout.tsx`, a flexbox container partitions the screen into a sidebar (`w-64`), a resizable editor/explorer pane, and a dynamic viewer pane. Resizing is handled via client-side pointer event tracking to update split percentage states dynamically.

---

## 3. Caveats

1. **Rust Installation Environment**: We assume Rust is not installed on the system based on the shell's failure to recognize `cargo` or `rustc`. If it is installed but omitted from the active shell's environment variables, the system must be rebooted or re-configured to register Cargo.
2. **Tauri Version Coexistence**: This design defines structures for both Tauri v1 and Tauri v2. Depending on which version the orchestrator adopts, minor imports or configuration properties (e.g., v1 allowlist vs v2 capability files) will vary.

---

## 4. Conclusion

* **Setup Strategy**: Install Rustup first, then run `npm create tauri-app@latest .` with the React/Vite/TypeScript setup.
* **Dependencies**: Install Tailwind CSS, ThreeJS stack (`three`, `@react-three/fiber`, `@react-three/drei`), Lucide icons, and layout utility libraries.
* **Tauri Config**: Enable restricted scopes for `fs` (confined to `$DOCUMENT/StudySpaceVault/*`) and `http` (confined to D2L endpoints) inside `tauri.conf.json` (or capabilities in v2) to establish a secure perimeter.
* **UI Layout**: Deploy an absolute glowing radial canvas with a glass-blur sidebar on the left and a resizable two-pane workspace on the right, as coded in `analysis.md`.

---

## 5. Verification Method

To verify the setup:
1. **Rust Check**: Confirm Rust compiler availability:
   ```powershell
   rustc --version
   cargo --version
   ```
2. **Project Initialization & Dependency Installation**:
   Initialize and run:
   ```powershell
   npm install
   npm run dev
   ```
   Verify that the Vite dev server boots on `http://localhost:5173`.
3. **Verify Config Integrity**: Verify that `tauri.conf.json` parses without issues by starting the Tauri dev client:
   ```powershell
   npm run tauri dev
   ```
4. **Layout Verification**: Ensure the glassmorphic shell renders correctly, the sidebar links are interactive, and the pane divider can be dragged to alter the split ratio.
