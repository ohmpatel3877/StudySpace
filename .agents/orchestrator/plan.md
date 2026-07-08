# StudySpace Execution Plan

This plan details the parallel tracks, milestone division, and verification steps for implementing StudySpace.

## 1. Directory Structure Convention
We will follow the File Workspace Convention. All subagents will have directories under `.agents/` as:
- `.agents/explorer_milestone[N]`
- `.agents/worker_milestone[N]`
- `.agents/reviewer_milestone[N]`
- `.agents/challenger_milestone[N]`
- `.agents/auditor_milestone[N]`
- `.agents/e2e_testing_orch`
- `.agents/sub_orch_milestone[N]`

Source code and tests will reside in the root directory and standard Tauri/React structures.

## 2. Parallel Track Decomposition

### Track A: E2E Testing Track
- **Orchestrator**: `sub_orch_e2e_testing`
- **Objective**: Design, build, and document an opaque-box E2E test suite mapped to the user requirements.
- **Output**: `TEST_READY.md` containing test suite commands, feature coverage checklist, and Tier 1-4 test coverage.
- **Tiers**:
  - **Tier 1 (Feature Coverage)**: >=5 tests per feature (Tauri, Editor, Explorer, PDF, CAD, C/C++, D2L Sync, Themes, Toggles, R7 Imports).
  - **Tier 2 (Boundary & Corner Cases)**: >=5 tests per feature.
  - **Tier 3 (Cross-Feature Combinations)**: Pairwise coverage.
  - **Tier 4 (Real-World Scenarios)**: >=5 application-level scenarios.

### Track B: Implementation Track
We decompose the implementation into 7 sequential milestones.
Each milestone is delegated to a sub-orchestrator which runs the iteration loop: Explorer -> Worker -> Reviewer -> Challenger -> Auditor.

#### Milestone 1: App Skeleton & Tauri Core
- **Goal**: Initialize Tauri + React + Vite + TypeScript. Allow `fs`, `http`, and `shell` scopes in `tauri.conf.json`. Create basic glassmorphic dark UI layout.
- **Verification**: Compilation and window launch.

#### Milestone 2: Markdown Note Editor & File Explorer
- **Goal**: Sidebar file explorer that lists notes. Split pane layout. Live rendering Markdown editor (Edit/Preview) reading/writing directly to local `.md` files. Header with note title.
- **Verification**: Opening, editing, and saving `.md` files.

#### Milestone 3: CAD, Office, Inline Editor & Native Bridge (R3, R8, R9, R10)
- **Goal**: Right pane resource viewer supporting PDF display and Three.js 3D STL/OBJ. Integrate with LibreOffice CLI `soffice` to convert `.docx`/`.xlsx`/`.pptx` files to PDF (with fallback to default app if LibreOffice is missing). Add an inline code editor for C/C++ files with local file saving. Implement an "Open in Default App" button utilizing Tauri's shell APIs to launch active files in native host applications.
- **Verification**: Opening/viewing PDFs and 3D files; editing and saving C/C++ files; converting and rendering office documents; launching files in default OS apps via native bridge.

#### Milestone 4: D2L Brightspace iCal Sync
- **Goal**: Settings panel input for D2L iCal feed URL. Local fetch (bypass CORS), parse, store events, and display in dashboard.
- **Verification**: Syncing, parsing events, listing with titles/descriptions/due dates.

#### Milestone 5: Theme Engine & Feature Toggles
- **Goal**: Custom theme engine (Dark, Light, AMOLED, colored glassmorphic presets) and modular feature toggles (hiding/disabling D2L sync or 3D viewer). Local persistence.
- **Verification**: Dynamic theme change, module hiding, persistence.

#### Milestone 6: External File Location Imports (R7)
- **Goal**: Add settings options to enter paths for OneDrive/GDrive, and credentials/connection settings for SMB and Nextcloud. Render imported locations dynamically in the file explorer sidebar, enabling browsing, reading, and writing notes/files in these external directories.
- **Verification**: UI inputs validation, dynamic explorer population, file read/write operations on imported sync/remote locations.

#### Milestone 7: Final Integration & E2E Verification (Phase 1 & Phase 2)
- **Goal**: Integrate all modules (including R7), run 100% of E2E tests (including R7 coverage), and perform White-box Adversarial Testing (Tier 5).
- **Verification**: 100% pass on E2E test suite, zero coverage gaps reported by Challenger in Phase 2, clean Forensic Auditor report.
