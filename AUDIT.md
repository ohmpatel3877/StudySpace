# StudySpace — Architecture Audit

**Date:** 2026-08-20 · **Commit:** `3fd3d9f` · **Method:** static analysis of `src/`, `src-tauri/`, `tests/`, CI config, and project docs. No runtime verification was performed (see Open Questions).

---

## Executive summary

StudySpace presents as a finished 7-milestone application: 115 passing E2E tests, green CI, MIT license, issue templates, README badges, six milestones marked `DONE`. The audit finds that **none of those signals measure the shipped application.**

Three independent failures compound:

1. **The E2E suite tests a different program.** All 115 tests run against a 996-line hand-written HTML/JS mock in `tests/mock-app/`. No spec ever loads the React app. The suite would report 115/115 green if `src/` were deleted entirely.
2. **The frontend speaks the wrong IPC protocol.** `safeInvoke` probes `window.__TAURI_IPC__` — the Tauri **1** global — in a Tauri **2** app. If that global is absent at runtime, every backend call silently falls through to a 250-line localStorage shadow implementation, and the Rust backend is never invoked.
3. **CI cannot fail on Rust.** `cargo check 2>&1 || echo "cargo not available, skipping"` swallows every failure, not just a missing toolchain.

The consequence: **CI green currently means oxlint passed, `tsc -b` passed, and a hand-written mock behaved.** There is zero automated coverage of `src/` runtime behavior and zero of Rust. Under that blind spot, several features marked `DONE` are stubs, and a class of security defects went unnoticed.

**This is not a project that needs a rewrite. It needs a verification gate that can fail, and then the truth surfaces on its own.**

---

## Finding 1 — The test suite does not test the application

**Severity: critical.** This is the root cause that permits every other finding to persist.

| Evidence | Location |
|---|---|
| `baseURL: 'http://localhost:5188'`, `webServer: node tests/mock-app/server.cjs` | `playwright.config.ts:11,22` |
| Server is a bare static file server for `tests/mock-app/` — no Vite, no bundler, no `src/` | `tests/mock-app/server.cjs` |
| Every spec's `beforeEach` is `page.goto('/')` → resolves to `tests/mock-app/index.html` | all 12 spec files |
| No spec references port 5173, `vite`, or `src/` | grep across `tests/*.spec.ts` — zero matches |
| `package.json` has no `vite dev`/`vite preview` step in any test script | `package.json:11` |

`tests/mock-app/app.js` (996 LOC) is a from-scratch DOM re-implementation of the app: its own theme engine, markdown regex, code highlighter, D2L sync state machine, office-conversion flow, toast system, settings persistence. It reuses the **same `data-testid` values** as the React components, which is precisely why the deception holds — the selectors match, so the tests look like they're driving the real UI.

Nothing is shared between the two trees. A behavior change in `src/` has **zero effect on any test outcome** unless someone remembers to hand-edit `app.js` too.

### Tests that can only ever assert the mock's own behavior

- `view.spec.ts` T2_VIEW_5 calls `window.__triggerWebGLContextLoss()` and asserts recovery text. That function and its 1200ms timing exist only in `app.js`. There is no WebGL context anywhere in this repo — `CadViewer.tsx:76-83` is a `<div>` containing the literal text `[WebGL Canvas rendering with Auto-Rotation]`.
- `core.spec.ts` T1_CORE_4 ("Tauri IPC Bridge Connectivity") inspects `window.__MOCK_STATE__.commandsLog` — a construct defined only in the Playwright init script. It verifies the mock called the mock.
- `theme.spec.ts` T2_THEME_5 ("Theme Injection Guard") tests XSS against the mock's fixed `<option>` dropdown, which is immune by construction. It says nothing about `Settings.tsx`.
- `sync.spec.ts` T1_SYNC_1 asserts against `__MOCK_STATE__.settings` — the real `AppContext` persistence path is never touched.
- `view.spec.ts` T2_VIEW_3 asserts a `span.keyword` equals `'int'`, produced by `app.js`'s bespoke regex tokenizer (`app.js:473-490`).

Several tests are additionally weak on their own terms: T2_CORE_5 ("DPI Scale Change Adaptation") re-sets the same viewport and checks the sidebar is visible; T1_THEME_5 ("Accessibility Contrast Evaluation") performs no contrast computation, only `toBeVisible()`.

`TEST_INFRA.md`'s claim of an opaque-box suite verifying "the React web frontend with mocked Tauri IPC" is **false as implemented**. The mocking technique is sound; it is pointed at the wrong target.

### The mock app was never the design — it was a silent deviation from it

`.agents/sub_orch_e2e_testing/proposed_test_infra.md` is the original design document for this test suite. It specifies, verbatim (lines 529, 539-540):

```ts
baseURL: 'http://localhost:5173',
webServer: { command: 'npm run dev', url: 'http://localhost:5173' }
```

**The design targeted the real Vite app.** It also specified a dual-execution architecture — mocked-frontend mode *and* a `tauri-driver` binary mode against the compiled app (line 46-53) — plus a Vitest unit layer (`"test:unit": "vitest run"`, line 552).

What shipped: port 5188, a static server for a hand-written HTML app, no binary mode (`tests/mocks/tauri-driver/` is a one-line `module.exports = {}` stub), no Vitest. The implementation drifted from its own spec and nothing caught it, because the thing that would have caught it was the test suite.

Two further inheritances from this document are worth noting, because they explain rather than excuse:

- It prescribed `window.__TAURI_IPC__` (line 58, 93) — the source of Finding 2. The design predates or ignores the Tauri 2 API change.
- Its test descriptions demand things that were never built: T1_VIEW_4 requires "a `<canvas>` element with Three.js rendering engine initialized" (line 223); T2_VIEW_5 requires dispatching a real `webglcontextlost` event (line 331). The shipped tests assert against a `<div>` and a hand-written `setTimeout`. **The specification was correct; the implementation faked it and the mock app made the fake pass.**

This changes Phase 0's framing: retargeting Playwright at the real app is not a new idea, it is **restoring the documented original design.**

---

## Finding 2 — The Tauri IPC bridge is written against the wrong protocol version

**Severity: critical. CONFIRMED** — verified against the installed `@tauri-apps/api@2.11.1` in `node_modules`:

- `grep -rl "__TAURI_INTERNALS__" node_modules/@tauri-apps/api/` → `core.js`, `core.cjs`, `mocks.js`, `mocks.cjs`, `mocks.d.ts`
- `grep -rl "__TAURI_IPC__" node_modules/@tauri-apps/api/` → **no matches**
- `core.js:202`: `return window.__TAURI_INTERNALS__.invoke(cmd, args, options);`

The v1 global does not exist in the Tauri 2 API surface. `safeInvoke`'s guard is therefore falsy in the packaged desktop app, and **every backend call falls through to localStorage.** No app launch is required to establish this.

`src/context/AppContext.tsx:344-379`:

```js
if (typeof window !== 'undefined' && (window as any).__TAURI_IPC__) {
  (window as any).__TAURI_IPC__({ cmd, callback, error, cmd_args: args, ...args })
} else {
  handleFallback(cmd, args)   // 250 lines of localStorage
}
```

`{cmd, callback, error}` is the **Tauri v1** invoke wire format. Tauri v2 exposes `window.__TAURI_INTERNALS__.invoke`, which is what `@tauri-apps/api`'s `invoke()` wraps. `Cargo.toml:12` pins `tauri = "2"`. `@tauri-apps/api ^2.11.1` is declared in `package.json` and **imported nowhere in `src/`** (grep confirms zero matches).

Consequences in the packaged desktop app:

- every one of the 10 commands falls through to `handleFallback`
- the app runs entirely on browser `localStorage` with fabricated seed data
- the Rust backend is dead code that has never executed in production
- Milestones 2, 3, 4, 6 (`DONE`) — vault I/O, office conversion, D2L sync, external imports — are unverified end to end

The mock suite injects `__TAURI_IPC__` itself, so it passes 115/115 either way. **That is how this survived seven milestones.**

Note that `@tauri-apps/api` ships `mocks.js` exporting `mockIPC` — the officially supported Tauri 2 test-mocking helper. That is what Phase 0's harness should use instead of a hand-rolled global.

---

## Finding 3 — CI cannot fail on the Rust backend

`.github/workflows/ci.yml`:

```yaml
- name: Cargo check (src-tauri)
  run: |
    cd src-tauri
    cargo check 2>&1 || echo "cargo not available, skipping"
```

`|| echo` catches **every** non-zero exit, not only a missing toolchain. A compile error in `commands.rs` produces a green build. The Rust backend has never been compile-checked by CI.

Combined with Findings 1 and 2, the full meaning of a green CI run today is: oxlint passed, TypeScript type-checked, and a hand-written HTML mock behaved as its author intended.

---

## Finding 4 — Security defects in the Rust file commands

The vault root is **never enforced**. `vault_root()` (`commands.rs:44-47`) returns `~/OneDrive/Obsidian/Obsidian-Education`, and all four file commands do `vault_root().join(&path)` with no canonicalization, no `..` rejection, and no prefix check after joining.

| Defect | Location | Impact |
|---|---|---|
| Relative traversal — `../../../Windows/System32/...` escapes the vault | `read_vault_file:122`, `write_vault_file:128`, `convert_office_doc:184`, `open_in_default_app:205` | arbitrary read |
| **Absolute-path override** — on Windows `PathBuf::join` with an absolute path *discards the base entirely* | same four sites | arbitrary read **and write** |
| `write_vault_file` calls `create_dir_all(parent)` first | `commands.rs:129-131` | arbitrary write becomes a create-anywhere primitive |
| `open::that()` with no extension allowlist | `commands.rs:206` | write a `.bat`/`.cmd`/`.hta` anywhere, then open it — plausible RCE chain |
| `soffice` resolved via `PATH` | `commands.rs:189` | PATH-hijack (not shell injection — no shell is involved) |
| D2L feed URL (token-bearing, private) stored as plaintext JSON | `commands.rs:106-109` | credential at rest, no OS keychain |
| `http:allow-fetch` permits `http://*`, not just `https://*` | `capabilities/default.json` | a copy-pasted `http://` feed URL leaks its token in cleartext |
| `csp: null` | `tauri.conf.json:21` | no CSP; relevant because iCal `DESCRIPTION` fields reach the UI |

**Capabilities do not mitigate any of this.** In Tauri 2 the ACL system gates *plugin* commands only. All 10 commands here are custom `#[tauri::command]` functions registered via `generate_handler!` (`main.rs:10-21`) — they are callable from the webview regardless of `capabilities/default.json`. The `fs:allow-read`/`fs:allow-write` scoping to the vault is **decorative** with respect to the actual I/O, which happens through unscoped `std::fs` calls inside `commands.rs`.

Separately: `tauri-plugin-fs`, `tauri-plugin-http`, and `tauri-plugin-shell` are registered and `init()`'d (`main.rs:7-9`), granted broad default permissions, and **used by nothing** — no `@tauri-apps/plugin-*` import exists in `src/`. They are pure added attack surface.

> Note: `AGENTS.md:63` states "Tauri capabilities are minimal: only `core:default`." That is factually wrong — the file grants `fs`, `http`, and `shell` defaults plus explicit allows. Documentation drift, corrected here.

---

## Finding 5 — Features marked `DONE` that are stubs

| Feature | PROJECT.md status | Reality |
|---|---|---|
| 3D CAD viewer (M3) | `DONE` | `CadViewer.tsx:76-83` renders a `<div>` containing the literal string `[WebGL Canvas rendering with Auto-Rotation]`. No `<canvas>`, no Three.js scene. `three`, `@react-three/fiber`, `@react-three/drei` are installed and imported **nowhere**. |
| External location imports (M6) | `DONE` | `import_external_location` (`commands.rs:169-173`) appends a string to a settings array and does nothing else. `get_vault_files` walks only `vault_root()` and never surfaces external paths. The contract's `credentials?: object` parameter does not exist in the Rust signature. |
| Office conversion (M3) | `DONE` | Real `soffice` invocation exists, but returns `format!("/temp/{}", pdf_name)` (`commands.rs:197`) — a leading-slash path that re-resolves to `C:\temp\` on Windows, not the vault temp dir, so the result cannot be read back. Every non-zero exit reports the fixed string `"Conversion failed: File corrupted"` regardless of cause — written to match the test double's magic string rather than surface real stderr. |
| PDF / CAD file loading | shipped | `read_vault_file` is `fs::read_to_string` only (`commands.rs:121-124`). It errors on any non-UTF8 file. It is called directly for `.pdf` (`PdfViewer.tsx:15`) and `.stl` (`CadViewer.tsx:19`). PROJECT.md:80 promises base64 for binaries; that was never implemented. These viewers only "work" because the mock returns the string `'BASE64_MOCK_DATA_STREAM'`. |
| Knowledge graph | shipped, ungated | See Finding 6. |
| D2L iCal sync (M4) | `DONE` | Parses, but: no timezone handling (`TZID` params never read); `DTSTART` and `DUE` collide into one field (`commands.rs:155`) so whichever comes last wins; no `RRULE` — recurring events appear once; events lacking `UID` silently dropped. `chrono` is declared in `Cargo.toml:18` and used **zero** times, which is precisely why none of this is normalized. |

Shipped test scaffolding also leaks into product code: `Viewer.tsx:30` contains `setTimeout(resolve, 800)` commented "Artificial delay for UI loader visibility in E2E tests"; `Viewer.tsx:85-96` renders a hardcoded "Conversion Progress: 50%" keyed off the magic filename `large.pptx`; `CadViewer.tsx:41` installs a global `window.__triggerWebGLContextLoss` hook; `AppContext.tsx:186-198` seeds an 11-file fixture vault including QA edge cases `zero.docx`, `corrupt.docx`, `large.pptx`.

---

## Finding 6 — The knowledge graph is a real engine driving fictional data

Two files, 1,551 LOC of untyped JS in a strict-TS project.

**`academy-graph.js` (1,226 LOC) is genuinely good code.** A dependency-free canvas force-directed renderer: spring/electric physics, drag, zoom/pan, particle pulse effects, a clean `AcademyGraph` class with `destroy()`/`exportData()`/`pulseConnection()`. This is the most substantial original engineering in the repository and it works.

**`academy-data.js` (325 LOC) is 100% synthetic.** Six fictional AI-tutor entities (`eng-tutor`, `chemistry-mcp`, `fea-mcp`, `nuclear-mcp`, `orchestrator-mcp`, `materials-mcp`), 12 hardcoded `CROSS_POLLINATION_EDGES`, 8 hardcoded `OBSERVATIONS`. No fetch, no IPC, no connection to `AppContext`, `safeInvoke`, or any user note. It is pitch data for an "AI tutor academy" concept with no other presence in this app.

So the Knowledge Graph tab — **not feature-gated**, always visible (`Layout.tsx:70-78`), unlike D2L which checks `features.includes('d2l_sync')` — occupies prime UI real estate rendering content that has nothing to do with the user's notes.

Bug: `destroy()` (`academy-graph.js:1185-1194`) calls `removeEventListener('resize', this._resize)`, but the listener was registered at line 923 as an anonymous arrow `() => this._resize()`. The references don't match, so removal silently no-ops and **one window listener leaks per graph mount/unmount cycle**.

TS integration risk: `KnowledgeGraph.tsx:2` imports from `'../graph/academy-graph.js'` with no `.d.ts`, and `tsconfig.app.json` sets neither `allowJs` nor `checkJs`.

**Verdict (you deferred this pending audit): keep the renderer, delete the data.** The engine is worth porting to TS and pointing at real vault links. `academy-data.js` should be deleted outright — it is the single clearest piece of demo-ware in the repo.

---

## Finding 7 — State management defects

| Defect | Location |
|---|---|
| `updateSettings` spreads `{...settings, ...newSettings}` from a render-time snapshot with no functional-update form. Two rapid calls (double-clicking Import) clobber each other. | `AppContext.tsx:485-511` |
| `theme` and `settings.theme` are two copies of one fact, hand-synced across three call sites. | `AppContext.tsx:382,388` |
| `features` duplicates `settings.active_features` the same way. | `AppContext.tsx:384` |
| `explorerOpen`/`setExplorerOpen` are declared, typed, and exposed on the context — never set, never read, no collapse UI exists. Dead state. | `AppContext.tsx:33-34` |
| `refreshVaultFiles` swallows all errors into `console.error`, no toast. Silent failure. | `AppContext.tsx:435-442` |
| Init effect sets no loading flag; `Editor.tsx` races it loading `/vault/welcome.md`. Correct only by accident of matching fixtures. | `AppContext.tsx:445-483` |
| All file contents stored as one JSON blob under one key — entire vault re-serialized on every single-file save. No quota handling; `QuotaExceededError` surfaces as a mislabeled "Permission denied". | `AppContext.tsx:207-239` |
| `handleFallback` contains **two** independently-written implementations of the same 10 commands (mock-state branch `62-156`, localStorage branch `159-341`) with divergent defaults and copy-pasted error strings. | `AppContext.tsx:54-342` |
| `syncD2LEvents` gates on `navigator.onLine`, which reports `true` for an unreachable server. | `AppContext.tsx:513-530` |
| `reqwest::blocking` inside a Tauri command, with `panic = "abort"` in `Cargo.toml:25` — a "runtime within a runtime" panic aborts the whole process rather than returning `Err`. | `commands.rs:137` |

---

## Dead file inventory

| Path | Size | Verdict | Evidence |
|---|---|---|---|
| `.agents/**` (66 tracked files) | 394 KB | **ARCHIVE OUT OF REPO — do not hard-delete** | Prior multi-agent orchestration scratch. Referenced by no build config, so it is dead *to the build*. But `sub_orch_e2e_testing/proposed_test_infra.md` is the original test-suite design document and is the primary evidence for Finding 1's deviation analysis. Move the tree outside the repo; do not destroy it. |
| `study_space.html` | 35 KB | **ARCHIVE, then delete** | Standalone pre-React prototype. Zero references repo-wide, not a Vite entry. But its inline `notesDatabase` encodes a real note taxonomy (`Sem 2/Computer Programming/Lectures/...`) that is direct input to the Phase 3 store schema. Mine it first. |
| `tests/mock-app/**` | 996+ LOC | **DELETE (Phase 0)** | The parallel app from Finding 1. Delete, do not port. |
| `playwright.config.js` | 27 lines | **DELETE** | Functional duplicate of `.ts`; Playwright resolves `.ts`. Silent-divergence hazard. |
| `tests/mock-app/server.js` | 41 lines | **DELETE** | Differs from `server.cjs` by one comment. Nothing invokes it. |
| `tsconfig.tsbuildinfo` | 387 B | **GITIGNORE + untrack** | Build cache, tracked in git, absent from `.gitignore`. |
| `test-results/.last-run.json` | tiny | **GITIGNORE + untrack** | Playwright run output, tracked in git. |
| `src/assets/react.svg`, `vite.svg` | 12.8 KB | **DELETE** | Vite template scaffolding. Zero references. |
| `src/assets/hero.png` | 13 KB | **DELETE** (confirm) | No textual reference found; binary, so worth one manual check. |
| `tests/mocks/tauri-driver/` | ~100 B | **DELETE with Phase 0** | One-line `module.exports = {}` stub satisfying a `package-lock.json` entry. No spec imports it. Real WebDriver E2E was never wired. |

### Dependencies with zero imports in `src/` (verified by grep)

`three` · `@react-three/fiber` · `@react-three/drei` · `react-syntax-highlighter` · `react-resizable-panels` · `lucide-react` · `@tauri-apps/api`

Plus `@types/three` and `@types/react-syntax-highlighter` in devDependencies, and `chrono` in `Cargo.toml`.

`@tauri-apps/api` is the interesting one: it is the correct way to talk to a Tauri 2 backend and it is installed but unused, while a hand-rolled v1-protocol shim sits in its place. **Phase 1 deletes the shim and uses the dependency.** The remaining six should be removed — or, for `three`, kept deliberately *because* the CAD viewer is being built for real (your call: all four surfaces are core).

Also note the resizer in `Layout.tsx` is hand-rolled while `react-resizable-panels` sits installed and unused.

---

## What is actually solid

Worth stating plainly, because the findings above are lopsided:

- The React Context architecture, split-pane layout, file-switching UI, and Explorer/Editor/Viewer composition are clean and readable.
- `academy-graph.js`'s physics renderer is real, original, working engineering.
- The Rust command surface is well-organized; `load_settings`, `save_settings`, `get_vault_files`, `write_vault_file`, and `remove_external_location` are correct implementations.
- The IPC-boundary mocking *technique* in `tests/mocks/tauri-ipc-mock.ts` is exactly right. It is aimed at the wrong target, which is a config problem, not a design problem.
- The four-theme CSS-variable engine is a genuinely nice piece of styling.

The bones are good. The problem is that a test suite which cannot fail removed all pressure to finish anything, and half-built features got marked `DONE` because a mock said so.

---

## Open questions requiring runtime verification

1. Does `window.__TAURI_IPC__` exist under this Tauri 2 build? (Finding 2 — everything downstream depends on the answer.)
2. Has `npx tauri dev` ever produced a working window on this machine?
3. Does `npm run build` type-check the untyped `.js` graph imports cleanly, given no `allowJs`?
4. Is `src/assets/hero.png` referenced dynamically anywhere?
