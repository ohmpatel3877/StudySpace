## 2026-07-06T14:06:48-04:00

You are the Worker subagent for the E2E Testing Track of the StudySpace project.
Your task is to implement the E2E testing infrastructure and test suite as designed in the E2E Test Suite Design.

Please follow these steps:
1. Write the test suite architecture and design to C:\Users\ohmpa\OneDrive\Obsidian\Obsidian-Education\StudySpace\TEST_INFRA.md. Use the content of C:\Users\ohmpa\OneDrive\Obsidian\Obsidian-Education\StudySpace\.agents\sub_orch_e2e_testing\proposed_test_infra.md as your design reference.
2. Initialize or configure C:\Users\ohmpa\OneDrive\Obsidian\Obsidian-Education\StudySpace\package.json. It should declare scripts like "test:e2e:mock": "playwright test --project=mock-frontend". It should include devDependencies for @playwright/test, vitest, typescript, tauri-driver (or local equivalents).
3. Create C:\Users\ohmpa\OneDrive\Obsidian\Obsidian-Education\StudySpace\playwright.config.ts and C:\Users\ohmpa\OneDrive\Obsidian\Obsidian-Education\StudySpace\tsconfig.json for compiler/runner settings.
4. Implement the Playwright mock IPC bridge at C:\Users\ohmpa\OneDrive\Obsidian\Obsidian-Education\StudySpace\tests\mocks\tauri-ipc-mock.ts.
5. Create a mock frontend application under C:\Users\ohmpa\OneDrive\Obsidian\Obsidian-Education\StudySpace\tests\mock-app/ (e.g. a simple index.html and script.ts/js) that implements the StudySpace UI structure, theme engine, toggle behaviors, and displays. This mock app will serve as the target for the E2E tests during this stage, allowing us to verify the tests actually run and assert correctly.
6. Implement all 71 tests (Tiers 1-4) across the following files:
   - tests/core.spec.ts (T1_CORE_1..5, T2_CORE_1..5)
   - tests/note.spec.ts (T1_NOTE_1..5, T2_NOTE_1..5)
   - tests/view.spec.ts (T1_VIEW_1..5, T2_VIEW_1..5)
   - tests/sync.spec.ts (T1_SYNC_1..5, T2_SYNC_1..5)
   - tests/theme.spec.ts (T1_THEME_1..5, T2_THEME_1..5)
   - tests/toggle.spec.ts (T1_TOGGLE_1..5, T2_TOGGLE_1..5)
   - tests/combinations.spec.ts (T3_COMB_1..6)
   - tests/scenarios.spec.ts (T4_SCENARIO_1..5)
   Each test must be a genuine Playwright test that interacts with the mock-app DOM, inputs text, clicks elements, and verifies style variables or classes.
7. Run the test suite using Playwright (npx playwright test) and verify that all 71 tests execute and pass successfully.
8. Once verified, write C:\Users\ohmpa\OneDrive\Obsidian\Obsidian-Education\StudySpace\TEST_READY.md at the project root following the template.
9. Write a detailed handoff report in your folder (.agents/worker_e2e_implementation/handoff.md) and send a completion message.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-07-06T18:11:46Z

**Context**: R7 (External File Location Imports) Integration
**Content**: We have received a new requirement R7 (External File Location Imports) from the parent. 

The Tauri command contracts in `PROJECT.md` have been updated to include:
- `import_external_location(location_type: 'local' | 'webdav' | 'smb', path_or_url: string, credentials?: object)`
- `remove_external_location(path_or_url: string)`
- `load_settings`/`save_settings` now includes `external_locations` array.

With N = 7 features, we must scale our test suite to at least 82 tests:
- Tier 1: 35 tests (adding 5 for R7)
- Tier 2: 35 tests (adding 5 for R7)
- Tier 3: 7 tests (adding 1 combination test: T3_COMB_7 - NOTE + TOGGLE + IMPORT)
- Tier 4: 5 scenarios (already covering R7 in Scenario 5)

Please:
1. Update `TEST_INFRA.md` with the new design, cases, and mapping matrix.
2. In the Playwright mock IPC (`tests/mocks/tauri-ipc-mock.ts`), mock `import_external_location` and `remove_external_location`, and add mock locations/files in settings.
3. Update the mock app (`tests/mock-app`) to render R7 components (Settings paths/URL inputs for local sync/remote shares, external location directories in sidebar explorer, and file read/write).
4. Implement the new test cases:
   - `tests/import.spec.ts` (T1_IMPORT_1..5, T2_IMPORT_1..5)
   - `tests/combinations.spec.ts` (add T3_COMB_7)
5. Run the suite to verify that all 82 tests pass.
6. Publish the final `TEST_READY.md` containing the updated coverage summary and checklist.
**Action**: Please implement these R7 additions as part of your current work and verify all 82 tests run successfully.


## 2026-07-06T18:28:08Z

**Context**: R8, R9, R10 Integration into E2E Test Suite
**Content**: We have received three new requirements (R8, R9, R10) from the parent.

The Tauri command contracts in `PROJECT.md` have been updated to include:
- `convert_office_doc(file_path: string)` returning `pdf_path: string` (path to temporary converted PDF file).
- `open_in_default_app(file_path: string)` returning `void` (shell invocation).

With N = 10 features, we must scale our test suite to at least 115 tests:
- Tier 1: 50 tests (adding 15: 5 for R8, 5 for R9, 5 for R10)
- Tier 2: 50 tests (adding 15: 5 for R8, 5 for R9, 5 for R10)
- Tier 3: 10 tests (adding 3: T3_COMB_8, T3_COMB_9, T3_COMB_10)
- Tier 4: 5 scenarios

Please integrate these requirements by:
1. Updating `TEST_INFRA.md` with the new design, cases, and mapping matrix.
2. In the Playwright mock IPC (`tests/mocks/tauri-ipc-mock.ts`), mock `convert_office_doc` and `open_in_default_app`, and add mock Word/PowerPoint/Excel files to the file list.
3. Updating the mock app (`tests/mock-app`) to render:
   - Word/PowerPoint/Excel files in file list, which when clicked show loader and then display PDF viewer, or show LibreOffice missing fallback.
   - C/C++ files displaying "Edit Inline" button, which toggles textarea and saves changes.
   - "Open in Default App" button for files, which triggers toast notifications.
4. Implementing the new test cases:
   - `tests/office.spec.ts` (T1_OFFICE_1..5, T2_OFFICE_1..5)
   - `tests/inline.spec.ts` (T1_INLINE_1..5, T2_INLINE_1..5)
   - `tests/bridge.spec.ts` (T1_BRIDGE_1..5, T2_BRIDGE_1..5)
   - `tests/combinations.spec.ts` (add T3_COMB_8, T3_COMB_9, T3_COMB_10)
5. Running the suite to verify that all 115 tests pass.
6. Publishing the final `TEST_READY.md` containing the updated coverage summary and checklist.
**Action**: Please implement these R8, R9, R10 additions as part of your current work and verify all 115 tests run successfully.


