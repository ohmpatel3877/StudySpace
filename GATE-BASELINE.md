# Verification Gate — Baseline

**Established:** 2026-08-20 · **Branch:** `audit/pkm-plan` · **Phase 0 of [PKM_PLAN.md](PKM_PLAN.md)**

---

## What changed

The E2E suite previously ran against a hand-written HTML/JS app in `tests/mock-app/` on port 5188 and would have reported 115/115 green with `src/` deleted entirely ([AUDIT.md](AUDIT.md) Finding 1). It now runs against the real React app.

| | Before | After |
|---|---|---|
| Target | `tests/mock-app/index.html` (static, 996 LOC of parallel logic) | the real app in `src/`, built to `dist/` |
| Server | `node tests/mock-app/server.cjs` on :5188 | `vite preview` on :4173, gated behind `npm run build` |
| IPC transport | `window.__TAURI_IPC__` (**Tauri 1**, absent in Tauri 2) | `window.__TAURI_INTERNALS__.invoke` (**Tauri 2**) |
| App-side call | hand-rolled callback-global shim | `invoke()` from `@tauri-apps/api/core` |
| Rust in CI | `cargo check \|\| echo "skipping"` — could not fail | `cargo fmt --check`, `cargo clippy -D warnings`, `cargo check` |
| Playwright browsers in CI | never installed | `npx playwright install --with-deps chromium` |

## Baseline result

First run of the existing specs against the real app:

```
112 passed, 3 failed  (24.6s)
```

**This is far less breakage than expected, and the reason is worth recording:** both implementations were written against the same `data-testid` contract from the original design document, so the majority of assertions transferred unchanged. The mock was a faithful *twin* of the app's happy path — which is precisely why its drift went unnoticed for seven milestones.

### Failure triage

All 3 failures were one category: **stale transport, valid intent.** Each overrode the IPC layer to inject a backend error using the Tauri 1 callback protocol. The intent (verify the app's error handling) was sound; only the transport was dead.

| Test | Was | Now |
|---|---|---|
| `T2_SYNC_1` Network Timeout Recovery | overrode `__TAURI_IPC__`, no-op | rejects `fetch_and_parse_d2l` at the invoke boundary — **passes** |
| `T2_SYNC_2` Invalid iCal Content Parsing | overrode `__TAURI_IPC__`, no-op | rejects with a parse error — **passes** |
| `T2_TOGGLE_2` Disk Full on Settings Write | overrode `__TAURI_IPC__`, no-op | rejects `save_settings` — **passes** |

Notably, the real app **does** handle all three correctly: it surfaces "Sync failed" and "Failed to persist configurations" as the assertions demanded. No `src/` bug was uncovered by these three; the tests simply could not previously see the behavior they were written to check.

**No test was skipped, weakened, or marked `fixme` to reach green.**

### Silently vacuous tests found

Three further specs still referenced `__TAURI_IPC__` and therefore **passed while testing nothing** — a dead override is worse than a failure, because it reports success. Each was retargeted by a worker and then checked by an independent skeptic that neutralized the override and re-ran, on the principle that a test which passes with its own fixture disabled is still vacuous.

| Spec | Outcome |
|---|---|
| `core.spec.ts` | **Load-bearing.** Now deletes `__TAURI_INTERNALS__` in `addInitScript`. Neutralizing it fails `T2_CORE_2` immediately. |
| `import.spec.ts` | **Load-bearing.** Now wraps `invoke` to fail `load_settings`. Neutralizing it fails `T2_IMPORT_4`. |
| `theme.spec.ts` | **Caught still-vacuous.** See below. |

`T2_THEME_2` ("Theme file configuration Read Failure") had its transport correctly upgraded, yet **still passed with the override entirely removed.** Root cause: the mock's default `settings.theme` is `'Dark Mode'`, so the assertion "falls back to dark on config-read failure" is indistinguishable from "loaded normally." The test could not tell its own failure path from the happy path.

Fixed by seeding a non-default theme first: persist `'AMOLED Mode'`, assert it applied, *then* break `load_settings` and assert the app falls back to dark and is **not** AMOLED. Re-verified both directions — passes with the override, fails without it.

This is the single most valuable thing the gate caught, because it is the same class of defect as Finding 1 in miniature: a test that reports success while measuring nothing.

### Two more CI defects found during this work

- **The Lint step never passed.** `npx oxlint` exits non-zero because `react/rules-of-hooks` (set to `error`) flags Playwright's `await use(page)` fixture callback as a React hook call. Byte-identical in committed history. Fixed by renaming the fixture parameter to `provide` — Playwright passes it positionally, so no rule suppression was needed.
- **Playwright browsers were never installed in CI.** No `npx playwright install` step existed, so the E2E job could not have launched a browser at all.

Combined with the `cargo check || echo` swallow, **no CI step that mattered could have passed.** See [AUDIT.md](AUDIT.md) Finding 3.

## What this gate still does NOT verify

**Read this before trusting "118 passed."** The gate did not eliminate the fiction boundary — it moved it one layer down.

| | Before Phase 0 | After Phase 0 |
|---|---|---|
| Fiction boundary | mock **app** vs. real app | mock **backend** vs. real Rust |

`tests/mocks/tauri-ipc-mock.ts` is a hand-written contract stub. **Nothing in this repo verifies it matches the real command signatures in `commands.rs`.** `GATE_2` proves `src/` calls `invoke`; it does not prove the mock's responses resemble what Rust actually returns.

### Tests that are green while asserting stub behavior

These pass today and would **fail against the real backend, or assert nothing at all.** They were not caught by the retargeting triage because they never failed — someone had already softened them to match the fake.

| Test | Why it is fiction | Made real in |
|---|---|---|
| `T1_VIEW_2` PDF Viewer Embedding | Asserts `src` matches `/base64\|MOCK/` — the regex was **widened to accept the mock's sentinel string**. The real `read_vault_file` is `fs::read_to_string` ([commands.rs:121](src-tauri/src/commands.rs:121)) and errors on any non-UTF8 file, so this green test covers a load path that is known broken. | Phase 3 (binary read) + Phase 11 |
| `T1_VIEW_4` Three.js Viewport Init | Asserts `[data-testid="three-canvas"]` is visible and status reads `WebGL Context Active`. `three-canvas` is a `<div>` ([CadViewer.tsx:78](src/components/CadViewer.tsx:78)); the status is a hardcoded ternary ([CadViewer.tsx:52](src/components/CadViewer.tsx:52)). No WebGL exists. | Phase 11 |
| `T1_VIEW_5` 3D Camera Controls | Dispatches a `wheel` event, then asserts a status string **that the wheel event cannot change**. Passes whether or not the handler exists. | Phase 11 |
| `T2_VIEW_5` WebGL Context Loss | Drives `window.__triggerWebGLContextLoss()` — a test-only hook shipped inside production code ([CadViewer.tsx:41](src/components/CadViewer.tsx:41)) — and asserts its fake 1s recovery. | Phase 11 |
| Office conversion specs | Assert against `/temp/...` paths the mock invents. The real `convert_office_doc` returns a leading-slash path that re-resolves to `C:\temp\` and cannot be read back ([commands.rs:197](src-tauri/src/commands.rs:197)). | Phase 11 |

The original design document demanded better: `T1_VIEW_4` was specified as "a `<canvas>` element with Three.js rendering engine initialized" and `T2_VIEW_5` as dispatching a real `webglcontextlost` event. The assertions were weakened to match what got built.

**These are deliberately left green rather than marked `fixme`.** Marking them would remove the pressure to build the feature and quietly shrink the suite. They are listed here instead, each bound to the phase that makes them real. Phase 11 must rewrite the assertion *and* the implementation together.

### The only current check on mock/Rust divergence is manual

Running `npx tauri dev` and exercising the app by hand. The automated version is the `tauri-driver` binary mode the original design specified and which was never built (`tests/mocks/tauri-driver/` was a `module.exports = {}` stub). Until that exists, **the gate verifies the frontend against a contract nobody validates.**

## Sentinel — proof the gate can fail

The gate being green means nothing unless breaking the app turns it red. Recorded mutation test:

| | |
|---|---|
| **Sentinel test** | `T1_NOTE_4: Title/Filename Rendering in Header` (`tests/note.spec.ts:34`) |
| **Covered line** | `src/components/Editor.tsx:96` — `{currentName}` |
| **Mutation** | replace with `{"MUTATED_SENTINEL"}` |
| **Result** | `T1_NOTE_4` and `T2_NOTE_3` flip pass→fail; 8 others still pass |
| **Reverted** | yes — `git diff` clean, rebuild verified |

The failure is *specific*: one line change breaks exactly the two tests that read that line, not the whole file. That is sensitivity, not noise.

> Deliberately not "the whole gate goes red" — an always-red gate would satisfy that trivially. Sensitivity must be demonstrated per-test.

## Standing self-verification

`tests/gate-sentinel.spec.ts` asserts properties of the **harness**, not the product, so silent detachment fails loudly and first:

- **GATE_1** — the page under test is the real React app: `#root` is populated and a hashed `/assets/` module bundle is loaded. A static mock has neither.
- **GATE_2** — `src/` crosses the Tauri 2 boundary: `__TAURI_INTERNALS__.invoke` is a function, `__TAURI_IPC__` is `undefined`, and `commandsLog` (appended only inside the mock's invoke handler) contains `load_settings` and `get_vault_files` after boot.
- **GATE_3** — rendered content comes from backend data: mutating the store and reloading changes what the explorer displays.

All 3 pass.

## Commands

```bash
npm run gate
```

Full gate: lint → build → E2E → `cargo fmt`/`clippy`/`check`. Mirrors CI exactly.

**Final state, verified end to end:**

```
oxlint            exit 0   (was non-zero)
tsc -b + vite     built
playwright        118 passed   (115 original + 3 harness self-checks)
cargo fmt         clean    (formatter applied; had never been enforced)
cargo clippy -D warnings   clean
cargo check       clean
```

The Rust backend does compile. It had simply never been checked in seven milestones.

```bash
npm run test:e2e:ui
```

Inner development loop — Playwright UI mode for edit/run/read iteration.

## First desktop launch — 2026-08-20

`npx tauri dev` had never been run on this machine. Recorded here because it is the empirical counterpart to everything above.

**Attempt 1 — failed.** Rust compiled to 440/441 and linked successfully; **Vite** died:

```
Error: EBUSY: resource busy or locked, watch
'...\src-tauri\target\debug\deps\studyspace.exe'
    Error The "beforeDevCommand" terminated with a non-zero status code.
```

`vite.config.ts` was the bare template and lacked `server.watch.ignored: ['**/src-tauri/**']`, which the stock Tauri scaffold ships. Vite's watcher walked into `src-tauri/target/` and hit the binary while cargo was still writing it. See [AUDIT.md](AUDIT.md) Finding 8. Fixed, along with `strictPort` and `clearScreen: false`.

**Attempt 2 — the app launched.** `Running target\debug\studyspace.exe`, window rendered, process alive.

### What the first launch immediately revealed

| Observation | Meaning |
|---|---|
| `%APPDATA%\studyspace\` was created on boot | `settings_path()` and its `create_dir_all` ran — **the Rust backend is genuinely being reached.** |
| `settings.json` absent | Expected: only `load_settings` ran, and it returns `AppSettings::default()` on miss without writing. Writing requires a `save_settings`, i.e. a UI interaction. |
| `Failed to load file contents ... (os error 3)` | The absolute-path-override defect, live. See AUDIT Finding 4 "Confirmed live". |

That error is itself the proof the Phase 0 IPC fix landed: under the old Tauri 1 shim the same call would have silently returned fixture data from localStorage and displayed a fake `welcome.md`. **Getting a real error was the win.**

### Second desktop launch, after the fallback removal

Re-ran `npx tauri dev` after deleting `handleFallback` and replacing the editor's fixture-path default with a real empty state (`eb003e8`).

**The boot-time `Failed to load file contents ... (os error 3)` no longer appears.** It previously fired within seconds of every launch. The app ran until deliberately terminated (exit 143 = SIGTERM from a timeout; the `Chrome_WidgetWin_0` unregister line is benign Windows teardown noise).

That confirms the fix in the real desktop app, not only under Playwright.

### Phase 1 done-condition: NOT MET — four of six steps landed

Done-conditions in [PKM_PLAN.md](PKM_PLAN.md) are binary by design. This one reads unmet until it is met.

**Landed:** the desktop app launches; `settings_path()`'s `create_dir_all` demonstrably executed; `handleFallback` deleted (291 lines) so `safeInvoke` throws `NoBackendError` when no backend is present; the editor's fixture-path default replaced with a real empty state, confirmed by the disappearance of the boot-time `os error 3`; `T2_CORE_2` inverted to the new contract and verified load-bearing.

**Outstanding:**

- `settings.json` has never been observed being written. Needs a click in a native window — so a manual pass, or the `tauri-driver` binary mode the original design specified and nobody built.
- Remaining shipped test scaffolding in product code: the 800ms artificial delay (`Viewer.tsx:30`), the hardcoded "50%" progress (`Viewer.tsx:85-96`), `window.__triggerWebGLContextLoss` (`CadViewer.tsx:41`).
- The state defects in AUDIT Finding 7: functional-update form for `updateSettings`, the duplicated `theme`/`features` state, dead `explorerOpen`.

## Incidental changes in the Phase 0 commit

Disclosed here because the commit message is about the test harness and these are unrelated to it:

- **`cargo fmt` was applied**, not just checked. `src-tauri/src/commands.rs` and `src-tauri/build.rs` are reformatted. The formatter had never been enforced, so `--check` failed on first run. Formatter-only, no semantic change — but Phase 13's security diffs will sit on top of reformatted code.
- **`src-tauri/gen/schemas/*.json` were regenerated** as a side effect of running `cargo check` for the first time.

## Known gap

`handleFallback` (`AppContext.tsx:54-342`) still exists, so a plain browser without the injected mock silently runs on localStorage instead of failing. Phase 1 removes it. **When it goes, `tests/mocks/tauri-ipc-mock.ts` becomes the single IPC fake in the repository and is load-bearing for the entire gate** — it is not dead code.

Two layers from the original design document remain unbuilt: a Vitest unit tier and `tauri-driver` binary-mode E2E against the compiled app. Phase 2 decides whether to build them or strike them from the spec.
