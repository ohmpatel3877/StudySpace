# E2E Test Suite Architecture & Design

This document details the E2E testing framework, test harness design, and the 4-tier opaque-box test suite for **StudySpace**.

---

## 1. Overview & Testing Methodology

StudySpace E2E testing is built on a **4-tier, requirement-driven, opaque-box testing methodology**. The application is verified from the user's perspective, either by launching the compiled desktop binary or by running the React web frontend with mocked Tauri IPC interfaces.

### The 4-Tier Test Structure

| Tier | Name | Target Quantity | Purpose |
|---|---|---|---|
| **Tier 1** | **Feature Coverage** | 50 tests (5 per feature) | Verify that every core requirement works correctly under normal operating parameters. |
| **Tier 2** | **Boundary & Corner Cases** | 50 tests (5 per feature) | Stress the system with invalid inputs, massive payloads, permission failures, and extreme resolutions. |
| **Tier 3** | **Cross-Feature Combinations** | 10 tests | Verify that features do not interfere with each other and interact cleanly. |
| **Tier 4** | **Real-World Scenarios** | 5 scenarios | Verify multi-step, complex user journeys representing actual collegiate use cases. |

### Core Feature Scope (R1 - R10)

1. **Feature 1 (CORE)**: Core Tauri Desktop Application Architecture (glassmorphic dark UI, main container, layout responsiveness) [R1]
2. **Feature 2 (NOTE)**: Markdown Note Editor & File Explorer (reading, writing, previewing notes, vault sidebar) [R2]
3. **Feature 3 (VIEW)**: Resource Viewer (PDF embedding, C/C++ syntax code highlighting, Three.js 3D canvas for STL/OBJ) [R3]
4. **Feature 4 (SYNC)**: D2L Calendar Feed Sync (private iCal feed setting, syncing, parsing, storing, and rendering tasks) [R4]
5. **Feature 5 (THEME)**: Custom Theme Engine (dynamic theme swapping, persistence, styling variations) [R5]
6. **Feature 6 (TOGGLE)**: Modular Feature Toggles (enabling/disabling D2L and CAD features, layout reflow, configuration persistence) [R6]
7. **Feature 7 (IMPORT)**: External File Location Imports (importing local, WebDAV, SMB paths, listing files, unmounting) [R7]
8. **Feature 8 (OFFICE)**: Office Document Viewer (Word, PowerPoint, Excel conversion to PDF using convert_office_doc, conversion loader, LibreOffice fallback) [R8]
9. **Feature 9 (INLINE)**: C/C++ Inline Editing (inline editor for code documents, toggle edit/view modes, saving inline edits) [R9]
10. **Feature 10 (BRIDGE)**: Open in Default App (bridges layout buttons to open files in external default apps via shell command) [R10]

---

## 2. Test Harness & Mocking Design

The test harness uses **Playwright** for browser-based visual and interaction tests.

### Mocked IPC Setup (Playwright Init Script)

During frontend testing, we intercept Tauri IPC calls by injecting a mock handler into `window.__TAURI_IPC__` before the DOM loads.

---

## 3. Tier 1: Feature Coverage (50 Tests)

### CORE: Core Tauri App (R1)

| ID | Test Name |
|----|-----------|
| T1_CORE_1 | Glassmorphic Dark UI Theme Validation |
| T1_CORE_2 | Sidebar Layout Grid and Panes Presence |
| T1_CORE_3 | Layout Adaptability on Window Resize |
| T1_CORE_4 | Tauri Frontend IPC Bridge Connectivity |
| T1_CORE_5 | Dark-Theme Active by Default |

### NOTE: Markdown Note Editor & File Explorer (R2)

| ID | Test Name |
|----|-----------|
| T1_NOTE_1 | Sidebar Explorer Populates File Tree |
| T1_NOTE_2 | Selecting Markdown File Loads into Editor |
| T1_NOTE_3 | Editor File Editing & Save Operation |
| T1_NOTE_4 | Title/Filename Rendering in Header |
| T1_NOTE_5 | Live Markdown Rendering Toggle (Edit vs Preview) |

### VIEW: CAD Model & Document Viewer (R3)

| ID | Test Name |
|----|-----------|
| T1_VIEW_1 | Resource Panel Dynamic Switching by Extension |
| T1_VIEW_2 | PDF Viewer Embedding |
| T1_VIEW_3 | C/C++ Syntax Highlighting |
| T1_VIEW_4 | Three.js 3D Viewport Initialization |
| T1_VIEW_5 | 3D Camera Controls Verification |

### SYNC: D2L Calendar Feed Sync (R4)

| ID | Test Name |
|----|-----------|
| T1_SYNC_1 | Settings Input accepts iCal Feed URL |
| T1_SYNC_2 | Feed Fetch & Parse Execution |
| T1_SYNC_3 | Calendar Dashboard Events Display |
| T1_SYNC_4 | Invalid URL Warning Presentation |
| T1_SYNC_5 | Local Event Data Load Persistence |

### THEME: Custom Theme Engine (R5)

| ID | Test Name |
|----|-----------|
| T1_THEME_1 | Light Mode Styling Switch |
| T1_THEME_2 | AMOLED Preset Application |
| T1_THEME_3 | Custom Palette Variable Injection |
| T1_THEME_4 | Theme Selection Persistence |
| T1_THEME_5 | Accessibility Contrast Evaluation |

### TOGGLE: Modular Feature Toggles (R6)

| ID | Test Name |
|----|-----------|
| T1_TOGGLE_1 | Disabling D2L Sync hides UI Tabs |
| T1_TOGGLE_2 | Disabling CAD Viewer hides UI Controls |
| T1_TOGGLE_3 | Re-enabling Features restores visual components |
| T1_TOGGLE_4 | Toggle Config Persistence |
| T1_TOGGLE_5 | Screen Realignment on Feature Hiding |

### IMPORT: External Location Imports (R7)

| ID | Test Name |
|----|-----------|
| T1_IMPORT_1 | Settings panel shows input fields for location types |
| T1_IMPORT_2 | Adding a valid local path adds it to the imported list |
| T1_IMPORT_3 | Selecting an imported directory displays files inside that location |
| T1_IMPORT_4 | Removing an external location updates the sidebar list |
| T1_IMPORT_5 | Remote WebDAV/SMB credential saving validates credentials |

### OFFICE: Office Document Viewer (R8)

| ID | Test Name |
|----|-----------|
| T1_OFFICE_1 | Clicking .docx file triggers conversion loader |
| T1_OFFICE_2 | Successful conversion loads PDF iframe src |
| T1_OFFICE_3 | Clicking .xlsx file renders Excel conversion view |
| T1_OFFICE_4 | Clicking .pptx file renders PowerPoint conversion view |
| T1_OFFICE_5 | Missing LibreOffice installation renders fallback warning |

### INLINE: C/C++ Inline Editing (R9)

| ID | Test Name |
|----|-----------|
| T1_INLINE_1 | Viewer panel for C/C++ files includes an Edit Inline button |
| T1_INLINE_2 | Clicking Edit Inline renders a textarea with source code |
| T1_INLINE_3 | Modifying text and clicking inline Save triggers write command |
| T1_INLINE_4 | Inline code edits reflect in syntax highlighting upon toggle back |
| T1_INLINE_5 | Edit Inline button is hidden if active file is not a code document |

### BRIDGE: Open in Default App (R10)

| ID | Test Name |
|----|-----------|
| T1_BRIDGE_1 | File header contains Open in Default App button |
| T1_BRIDGE_2 | Clicking Open in Default App triggers Tauri shell command |
| T1_BRIDGE_3 | Executing Open in Default App displays confirmation toast |
| T1_BRIDGE_4 | Open in Default App works for all file formats |
| T1_BRIDGE_5 | Clicking button invokes command with correct path argument |

---

## 4. Tier 2: Boundary & Corner Cases (50 Tests)

### CORE: Core Tauri App (R1)
- **T2_CORE_1**: Ultra-Narrow Aspect Ratio Handling (Mobile dimensions)
- **T2_CORE_2**: Ultra-Wide Aspect Ratio Layout Stability
- **T2_CORE_3**: IPC Timeout Graceful Degradation
- **T2_CORE_4**: Missing CSS Variable Fallback on Theme Load
- **T2_CORE_5**: Multiple Fast Window Resizes Maintain Layout Integrity

### NOTE: Markdown Note Editor & File Explorer (R2)
- **T2_NOTE_1**: Empty Vault Directory Shows Placeholder Screen
- **T2_NOTE_2**: Extremely Long Markdown Document Loading & Scrolling
- **T2_NOTE_3**: Non-existent File Selection Returns Error UI
- **T2_NOTE_4**: Editing with Mixed UTF-8, Emoji, and Special Characters
- **T2_NOTE_5**: Concurrent Save with Rapid Toggling of Edit/Preview Mode

### VIEW: Resource Viewer (R3)
- **T2_VIEW_1**: Non-ASCII Filename on Model/PDF Loading
- **T2_VIEW_2**: 3D Model with Zero Polygons or Degenerate Geometry
- **T2_VIEW_3**: Password-Protected PDF File Handling
- **T2_VIEW_4**: Extremely Large File Extension Triggers Resource Viewer Warning
- **T2_VIEW_5**: Unsupported File Type Shows Viewer Placeholder

### SYNC: D2L Calendar Feed Sync (R4)
- **T2_SYNC_1**: Empty iCal Feed Returns Clean Empty State
- **T2_SYNC_2**: D2L Calendar with 500+ Due Dates
- **T2_SYNC_3**: Network Failure During Feed Fetch Shows Network Error State
- **T2_SYNC_4**: Malformed iCal Feed Response Handling
- **T2_SYNC_5**: Invalid URL Shows Input Validation Error

### THEME: Custom Theme Engine (R5)
- **T2_THEME_1**: Rapid Successive Theme Switching
- **T2_THEME_2**: Corrupted Persisted Theme Value Graceful Fallback
- **T2_THEME_3**: AMOLED Mode True Black Pixel Validation
- **T2_THEME_4**: Multiple Palette Variable Override Loading
- **T2_THEME_5**: Theme Application on Browser Zoom Variations

### TOGGLE: Modular Feature Toggles (R6)
- **T2_TOGGLE_1**: Toggling All Features Off — Only CORE UI Visible
- **T2_TOGGLE_2**: Toggling Features During Active D2L Sync
- **T2_TOGGLE_3**: Restoring Default Toggle Settings
- **T2_TOGGLE_4**: Toggle State Persistence Across Hard Refresh
- **T2_TOGGLE_5**: Layout Measurement Assertions After Multiple Toggles

### IMPORT: External Location Imports (R7)
- **T2_IMPORT_1**: Adding Duplicate External Location Shows Warning
- **T2_IMPORT_2**: Invalid Remote URL Shows Error Toast
- **T2_IMPORT_3**: Removing All External Locations Resets Explorer
- **T2_IMPORT_4**: Adding Invalid Path Characters in Import Location
- **T2_IMPORT_5**: Import Path With Unicode Characters

### OFFICE: Office Document Viewer (R8)
- **T2_OFFICE_1**: 0-byte office document conversion displays fallback warning
- **T2_OFFICE_2**: Malformed office file triggers conversion failure
- **T2_OFFICE_3**: Concurrent office conversions cancel previous ones
- **T2_OFFICE_4**: Read-only office file conversion loads preview safely
- **T2_OFFICE_5**: Large PowerPoint file conversion displays progress percentage

### INLINE: C/C++ Inline Editing (R9)
- **T2_INLINE_1**: Extremely large code file editing remains responsive
- **T2_INLINE_2**: Concurrent inline editor modifications warn users of collisions
- **T2_INLINE_3**: Inline edit on permission-denied file displays toast error
- **T2_INLINE_4**: Blank file inline edit allows adding code from scratch
- **T2_INLINE_5**: Code changes update syntax highlighted tokens instantly

### BRIDGE: Open in Default App (R10)
- **T2_BRIDGE_1**: Triggering default app for missing file displays error toast
- **T2_BRIDGE_2**: Command failure (no default program associated) shows warning
- **T2_BRIDGE_3**: Double-clicking Open in Default App invokes command only once
- **T2_BRIDGE_4**: Access-denied system files show warning when default app fails
- **T2_BRIDGE_5**: Default app button is disabled for unsaved new markdown drafts

---

## 5. Tier 3: Cross-Feature Combinations (10 Tests)

| ID | Test Name |
|----|-----------|
| T3_COMB_1 | Switching theme to Light Mode while D2L sync is active shows proper contrast |
| T3_COMB_2 | Enabling CAD Viewer while an STL file is actively loaded refreshes the 3D canvas |
| T3_COMB_3 | Opening Settings, changing theme, and then returning to Notes (no state corruption) |
| T3_COMB_4 | Import external location while D2L sync modal is open — both panels work |
| T3_COMB_5 | Toggle D2L off; navigate away; toggle on; D2L tab re-appears with prior settings |
| T3_COMB_6 | Toggle CAD off while STL is open — fallback viewer appears |
| T3_COMB_7 | Switching from a code file to a Markdown file while in inline edit mode resets toolbar |
| T3_COMB_8 | Disabling CAD Viewer disables default app button for STL files |
| T3_COMB_9 | Editing C++ file inline updates the code viewer in other pane views |
| T3_COMB_10 | Office conversion to PDF respects active theme styling for loader panel |

---

## 6. Tier 4: Real-World Scenarios (5 Scenarios)

| ID | Scenario Name |
|----|--------------|
| T4_SCENARIO_1 | Morning Study Session: Open app, browse CS notes, edit a C++ file, compile reference |
| T4_SCENARIO_2 | Assignment Deadline Check: Switch to D2L dashboard, review upcoming due dates, sync new calendar |
| T4_SCENARIO_3 | CAD Model Review: Import STL, rotate/zoom, switch to dark AMOLED mode, take visual reference |
| T4_SCENARIO_4 | Multi-Document Workflow: Open PDF, switch to notes, open report (docx), convert to PDF, review |
| T4_SCENARIO_5 | Settings Reconfiguration: Disable CAD, set external NAS path, switch theme, verify persistence on reload |

---

## 7. Execution Guide & CLI Commands

Run E2E tests:

```bash
npm run test:e2e:mock
```
