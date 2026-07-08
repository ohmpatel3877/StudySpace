# Original User Request

## Initial Request — 2026-07-06T18:03:30Z

<USER_REQUEST>
A lightweight, Tauri-based desktop study workspace (StudySpace) designed for personal use to streamline college coursework by integrating Markdown notes, local resources (PDF slides, code, textbooks), an interactive 3D CAD viewer, and D2L sync functionality.

Working directory: C:\Users\ohmpa\OneDrive\Obsidian\Obsidian-Education\StudySpace
Integrity mode: development

## Requirements

### R1. Core Tauri Desktop Application (React + Vite)
- The application must be structured as a Tauri desktop app.
- The frontend must be built using React with Vite.
- The UI must have a clean, dark-themed, glassmorphic layout.

### R2. Markdown Note Editor & File Explorer
- Must feature a file explorer sidebar displaying the local vault directory structure.
- Must provide a split-pane layout: a Markdown text editor with live rendering (Edit/Preview mode) on the left side, and a resource viewer on the right side.
- Opening and editing notes must read and write directly to local `.md` files.

### R3. CAD Model & Document Viewer
- The right panel must dynamically display selected files from the vault.
- PDFs must render in an embedded document viewer.
- C/C++ source code files must render with syntax highlighting.
- STL and OBJ files must render in an interactive 3D canvas using Three.js with mouse controls (rotation, zoom, pan).

### R4. D2L Calendar Feed Sync
- The application must include a settings input for a private D2L Brightspace iCal feed URL.
- The app must fetch, parse, and store the events/assignments locally, rendering them in a calendar or task dashboard.

### R5. Custom Theme Engine
- The application must support swapping themes dynamically (e.g. Dark Mode, Light Mode, and custom AMOLED or colored glassmorphism presets).
- The theme settings must persist locally across application launches.

### R6. Modular Feature Toggles
- Provide a settings configuration panel to dynamically toggle specific application modules (like D2L Sync or the 3D CAD Viewer) on or off.
- Toggling a module off must cleanly hide or disable its tab/container in the user interface.

## Acceptance Criteria

### Tauri & React Architecture
- [ ] `tauri.conf.json` is configured with `fs` and `http` scopes allowed.
- [ ] App compiles and launches successfully as a desktop window.

### Note Editor & File Explorer
- [ ] Opening a `.md` file loads its text content into the editor.
- [ ] Saving changes writes the updated text back to the local file.
- [ ] Title/filename of the active note displays in the editor header.

### Resource Viewer
- [ ] Selecting a `.pdf` file loads it in the viewer.
- [ ] Selecting a `.stl` or `.obj` file renders the 3D model in the Three.js viewport.
- [ ] Selecting a `.c` or `.cpp` file displays the code with syntax styling.

### D2L Sync Dashboard
- [ ] Parsing a valid iCal feed URL successfully retrieves calendar events.
- [ ] Retargeted events display with correct titles, descriptions, and due dates in the dashboard.

### Theme Engine & Feature Toggles
- [ ] Changing themes changes the styling elements immediately.
- [ ] Toggling D2L Sync or CAD Viewer off removes their visual tabs/panels from the layout.
- [ ] Selected themes and feature toggles persist after restarting the application.
</USER_REQUEST>

## Follow-up — 2026-07-06T18:09:40Z

<USER_REQUEST>
Hello Orchestrator,

We have received a new requirement R7 (External File Location Imports) from the parent. Please update your planning files (PROJECT.md, plan.md, progress.md), integrate tests for R7 into the E2E test suites, and implement the features.

### R7. External File Location Imports
- The application must support importing file directories from external locations: local sync directories (OneDrive, Google Drive), local network shares (SMB/Samba), or remote storage (Nextcloud/WebDAV).
- Imported directories must appear dynamically in the sidebar file explorer, allowing the user to browse, read, and write notes or load resources directly from those locations.

### New Acceptance Criteria
- [ ] The settings panel allows entering paths for local sync directories (OneDrive, GDrive) and configuring connection details for remote shares (Nextcloud, SMB).
- [ ] Files and subdirectories in imported locations are displayed in the explorer sidebar.
- [ ] Reading and writing `.md` files in imported locations works successfully.
</USER_REQUEST>

## Follow-up — 2026-07-06T18:26:51Z

<USER_REQUEST>
Hello Team,

We have received a major update to the requirements from the user. The primary goal is for StudySpace to serve as a unified hub allowing manipulation or external editing for *any* file type.

Please integrate these requirements and their acceptance criteria into the active planning documents and implementation/testing tracks:

### R8. LibreOffice Document Viewer Conversion
- The app must integrate with LibreOffice CLI (`soffice`) on the host system to convert `.docx`, `.pptx`, and `.xlsx` files to PDF.
- If LibreOffice is installed, clicking an Office file in the explorer converts it and renders it inline. If not, the app displays a fallback view offering to open it in the default system app.

### R9. Inline Code Editor
- C/C++ source code files loaded in the resource viewer must be editable inline, with changes saved directly back to the local file.

### R10. Native Application Bridge ("Edit Externally")
- The application must provide an "Open in Default App" button for any active file.
- Using Tauri's shell APIs, this button must open the selected file (e.g. `.docx`, `.pptx`, `.stl`, `.c`, or `.pdf`) in the host system's default native application.

### Updated Acceptance Criteria:
- [ ] `tauri.conf.json` is configured with `shell` scopes allowed.
- [ ] Selecting a `.c` or `.cpp` file displays the code, allowing inline editing and saving.
- [ ] Clicking a `.docx` or `.pptx` converts it to PDF and displays it (if LibreOffice is present).
- [ ] Clicking "Open in Default App" launches the file in the OS default handler (Word, AutoCAD, etc.).
</USER_REQUEST>

## Follow-up — 2026-07-06T21:16:35Z

<USER_REQUEST>
Hello Team,

Due to a server restart, some background tasks and subagents might have paused or been interrupted. 

Please review the current workspace state at C:\Users\ohmpa\OneDrive\Obsidian\Obsidian-Education\StudySpace, check your plan and progress logs, and revive your active development and testing tracks (including restarting the Project Orchestrator and any sub-orchestrators/E2E test runners).

Report back with your current status and progress once resumed.
</USER_REQUEST>
