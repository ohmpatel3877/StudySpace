# E2E Test Suite Architecture & Design

This document describes the E2E test harness as it exists on `audit/pkm-plan` today, after the
Phase 0 retargeting recorded in [GATE-BASELINE.md](GATE-BASELINE.md). It replaces an earlier
version of this file whose description of the harness was false as implemented — see
[AUDIT.md](AUDIT.md) Finding 1 for what was wrong and why it went unnoticed.

---

## 1. Overview & Testing Methodology

StudySpace E2E testing is Playwright-driven, opaque-box testing against **the real React app**,
built to `dist/` and served by `vite preview` on port 4173. There is a single Playwright project,
`mock-frontend` (Desktop Chrome), configured in `playwright.config.ts`.

The name `mock-frontend` is legacy and slightly misleading now: nothing about the frontend is
mocked. What's mocked is the Tauri IPC boundary underneath it — see Section 2.

This is **not** the dual-mode architecture ("compiled desktop binary or React web frontend with
mocked Tauri IPC") that an earlier draft of this document claimed. There is no binary mode.
`tests/mocks/tauri-driver/`, the directory that would have held it, was a one-line
`module.exports = {}` stub and has since been deleted. A `tauri-driver`-based binary mode against
the compiled desktop app remains unbuilt; PKM_PLAN.md tracks whether it gets built.

There is also no Vitest unit tier. The original design document
(`.agents/sub_orch_e2e_testing/proposed_test_infra.md`) specified one; it was never implemented,
and this suite is Playwright-only.

### Target: the real app, not a mock

Until this change, every spec ran against `tests/mock-app/`, a 996-line hand-written HTML/JS
re-implementation of the app served statically on port 5188. It shared `data-testid` values with
the real React components, which is why the tests looked like they were driving real UI while
testing nothing in `src/`. That directory has been deleted. The suite now:

1. Runs `npm run build` (Vite build of `src/` to `dist/`).
2. Serves `dist/` with `vite preview --port 4173 --strictPort`.
3. Points Playwright's `baseURL` at `http://localhost:4173`.

This is configured in `playwright.config.ts`'s `webServer` block, so `npm run test:e2e` triggers
the build itself — there is no separate "build first" step to remember.

### Tier structure

The spec files still reflect the tier structure from the original design, verified against the
files on disk:

| Tier | Name | File(s) | Tests |
|---|---|---|---|
| **Tier 1 + 2** | Feature Coverage / Boundary & Corner Cases | `core.spec.ts`, `note.spec.ts`, `view.spec.ts`, `sync.spec.ts`, `theme.spec.ts`, `toggle.spec.ts`, `import.spec.ts`, `office.spec.ts`, `inline.spec.ts`, `bridge.spec.ts` | 10 each = 100 |
| **Tier 3** | Cross-Feature Combinations | `combinations.spec.ts` | 10 |
| **Tier 4** | Real-World Scenarios | `scenarios.spec.ts` | 5 |
| **Harness** | Gate self-verification | `gate-sentinel.spec.ts` | 3 |

100 + 10 + 5 = 115 original tests (T1/T2 tiers live combined in one file per feature rather than
split across separate Tier-1/Tier-2 files, unlike the original document's phrasing — each of the
10 feature files contains both its `T1_*` and `T2_*` cases). Adding the 3 gate sentinels gives the
current total of **118 passing**, matching [GATE-BASELINE.md](GATE-BASELINE.md).

### Core Feature Scope (R1–R10)

1. **CORE** (R1): Core Tauri desktop app architecture — layout, theming shell, IPC connectivity.
2. **NOTE** (R2): Markdown note editor & file explorer.
3. **VIEW** (R3): Resource viewer — PDF embedding, C/C++ syntax highlighting, 3D CAD canvas.
4. **SYNC** (R4): D2L calendar feed sync — iCal feed URL, fetch/parse, event display.
5. **THEME** (R5): Custom theme engine — swapping, persistence.
6. **TOGGLE** (R6): Modular feature toggles — enabling/disabling D2L and CAD features.
7. **IMPORT** (R7): External file location imports.
8. **OFFICE** (R8): Office document viewer — Word/PowerPoint/Excel conversion via `convert_office_doc`.
9. **INLINE** (R9): C/C++ inline editing.
10. **BRIDGE** (R10): Open in Default App.

Per [AUDIT.md](AUDIT.md) Finding 5, several of these features are stubs behind the tests that
cover them — see Section 5 below before treating a green test as proof a feature works.

---

## 2. Test Harness & Mocking Design

### The single IPC fake: `tests/mocks/tauri-ipc-mock.ts`

Playwright drives the real app in Chrome, where no Tauri backend process exists. Without an
injected IPC layer, every `invoke()` call would simply have nothing to talk to. This file is that
injected layer, and it is **the only IPC fake in the repository** — nothing else stands in for
Tauri. It works by calling `page.addInitScript()` to install `window.__TAURI_INTERNALS__` —
specifically `.invoke`, `.transformCallback`, and `.convertFileSrc` — before the page's own
scripts run, so that `@tauri-apps/api/core`'s `invoke()` (which the app now actually imports and
calls, per the Tauri 2 IPC fix — see [AUDIT.md](AUDIT.md) Finding 2) resolves against the mock
instead of throwing.

This is a rewrite of what shipped before: the prior version installed `window.__TAURI_IPC__`, the
**Tauri 1** callback-style global (`{cmd, callback, error}`), which does not exist in the
`@tauri-apps/api@2` surface the app actually links against. The current version matches the
`__TAURI_INTERNALS__.invoke(cmd, args, options) -> Promise` shape Tauri 2 expects — the same
contract the official `mockIPC` test helper installs.

**This mock is load bearing, not incidental scaffolding.** Once `AppContext.tsx`'s
`handleFallback` localStorage shadow implementation is removed (a Phase 1 item — see
[PKM_PLAN.md](PKM_PLAN.md)), this mock becomes the *only* thing standing between the app and a
totally absent backend during E2E runs. Deleting it as "test cruft" would break every spec, not
just the IPC-specific ones.

It backs a mutable `window.__MOCK_STATE__` object (files, settings, D2L events, file contents, a
`commandsLog` of every invoked command) that specs read and mutate directly to set up scenarios and
assert on outcomes. State persists across a `page.reload()` within one test via `sessionStorage`,
which is what lets tests like GATE_3 mutate the store and confirm the UI re-renders from it.

### Why the fixture parameter is named `provide`, not `use`

The Playwright fixture pattern is `page: async ({ page }, use) => { ...; await use(page); }`. This
suite names the second argument `provide` instead:

```ts
page: async ({ page }, provide) => {
  await page.addInitScript(() => { ... });
  await provide(page);
}
```

Playwright passes this argument positionally — the name is arbitrary. The reason to rename it away
from `use` is `.oxlintrc.json`'s `react/rules-of-hooks` rule (set to `error`), which pattern-matches
any bare `use(...)` call as an invocation of the React `use` hook and flags it, regardless of
context. Under the name `use`, `npx oxlint` failed unconditionally on this file — this was true in
every prior commit, meaning the Lint CI step could never have passed (see
[AUDIT.md](AUDIT.md) Finding 3). Renaming the parameter avoids the false positive without a rule
suppression.

---

## 3. `tests/gate-sentinel.spec.ts` — proving the harness is attached to the real app

This spec does not test the product. It tests the **test harness itself**, so that if the suite
ever silently detaches from the real app again — the way it did for however long
`tests/mock-app/` stood in for `src/` — these tests fail first and loudest, rather than the whole
suite quietly going back to testing nothing.

Three tests, all currently passing:

- **`GATE_1`** — the page under test is the real React app, not a static mock. Asserts `#root` is
  attached and has at least one child (the mock app wrote directly into `<body>` with no root
  container), and that a `<script type="module">` tag references a hashed `/assets/` bundle path
  (what `vite preview` serves; a static HTML file would not have one).
- **`GATE_2`** — `src/` actually crosses the Tauri 2 IPC boundary. Asserts
  `window.__TAURI_INTERNALS__.invoke` is a function, `window.__TAURI_IPC__` is `undefined` (the
  app must not be depending on the old Tauri 1 global), and that `__MOCK_STATE__.commandsLog` —
  appended to only inside the mock's own invoke handler — contains `load_settings` and
  `get_vault_files` after boot. A non-empty log is only possible if the app actually called
  `invoke()`; it cannot be produced by a page that never crosses the IPC boundary at all.
- **`GATE_3`** — rendered content originates from backend data, not hardcoded markup. Mutates
  `__MOCK_STATE__.files` to a single synthetic file, reloads, and asserts that file appears in the
  explorer. A static page or a UI reading fixed markup would not change.

---

## 4. Spec files and what each covers

| File | Covers |
|---|---|
| `core.spec.ts` | R1 — layout, theming shell, resize handling, IPC connectivity checks |
| `note.spec.ts` | R2 — file explorer population, file selection/load/save, header title rendering, markdown preview toggle |
| `view.spec.ts` | R3 — resource panel switching by extension, PDF embedding, syntax highlighting, 3D viewport (see Section 5 — several of these are fiction) |
| `sync.spec.ts` | R4 — D2L feed URL input, fetch/parse, event display, error handling |
| `theme.spec.ts` | R5 — theme switching, persistence, fallback-on-failure behavior |
| `toggle.spec.ts` | R6 — feature enable/disable, layout reflow, config persistence |
| `import.spec.ts` | R7 — external location add/remove/list, credential handling |
| `office.spec.ts` | R8 — office document conversion trigger, loader, fallback (see Section 5) |
| `inline.spec.ts` | R9 — inline code editing, save, highlighting refresh |
| `bridge.spec.ts` | R10 — Open in Default App button and command invocation |
| `combinations.spec.ts` | Tier 3 — cross-feature interactions (10 tests) |
| `scenarios.spec.ts` | Tier 4 — multi-step user journeys (5 scenarios) |
| `gate-sentinel.spec.ts` | Harness self-verification (3 tests, Section 3) |

---

## 5. What the gate does NOT verify

**Read this before trusting "118 passed" as proof the app works.** Retargeting the suite at the
real React app moved the fiction boundary down one layer; it did not remove it. Full detail and
evidence citations live in [GATE-BASELINE.md](GATE-BASELINE.md) — summarized here:

- **Nothing checks that `tests/mocks/tauri-ipc-mock.ts` matches `src-tauri/src/commands.rs`.**
  The mock is a hand-written contract stub. `GATE_2` proves `src/` calls `invoke()`; it proves
  nothing about whether the mock's responses resemble what the real Rust commands return. The only
  current check on mock/Rust divergence is running `npx tauri dev` and exercising the app by hand.
  The `tauri-driver` binary-mode E2E tier that would automate this was specified in the original
  design and was never built.

- **Several tests are green while asserting stub behavior**, not because they weren't retargeted,
  but because their assertions were written to match what the mock returns rather than what the
  real backend does:

  | Test | Why it's fiction |
  |---|---|
  | `T1_VIEW_2` (PDF Viewer Embedding) | Asserts against a regex widened to accept the mock's `BASE64_MOCK_DATA_STREAM` sentinel string. The real `read_vault_file` is `fs::read_to_string` and errors on any non-UTF8 file — this load path is known broken, and the test doesn't catch it. |
  | `T1_VIEW_4` (Three.js 3D Viewport Initialization) | Asserts a `[data-testid="three-canvas"]` div is visible and a status reads "WebGL Context Active." `three-canvas` is a `<div>` (`CadViewer.tsx`), not a `<canvas>`; the status is a hardcoded ternary. No WebGL, no Three.js scene exists — `three` and `@react-three/fiber` are installed and imported nowhere in `src/`. |
  | `T1_VIEW_5` (3D Camera Controls Verification) | Dispatches a `wheel` event, then asserts a status string that event cannot change. Passes whether or not a camera-control handler exists at all. |
  | `T2_VIEW_5` (WebGL Context Loss) | Drives `window.__triggerWebGLContextLoss()` — a test-only hook shipped inside `CadViewer.tsx` production code — and asserts its fake, hardcoded 1-second recovery. There is no real WebGL context to lose. |

  These are deliberately left green rather than marked `fixme`: doing so would remove the pressure
  to build the underlying feature. They are recorded here, bound to PKM_PLAN.md's Phase 7, which
  is where both the assertion and the implementation get rewritten together.

- **Office conversion specs** assert against `/temp/...` paths the mock invents. The real
  `convert_office_doc` returns a leading-slash path that re-resolves to `C:\temp\` on Windows and
  cannot be read back — see [AUDIT.md](AUDIT.md) Finding 5.

Treat a green run as: lint passed, the app built, the React frontend behaves as specified against
a hand-written IPC contract, and the Rust backend independently compiles, formats, and lints
clean. It is not proof that the contract the frontend was tested against is the contract the
backend actually implements.

---

## 6. Commands

```bash
npm run gate
```

The full local gate, mirroring CI: `npm run lint && npm run build && npm run test:e2e && npm run gate:rust`, where `gate:rust` is `cd src-tauri && cargo fmt --check && cargo clippy -- -D warnings && cargo check`. Run this before treating anything as done.

```bash
npm run test:e2e:ui
```

Playwright UI mode against the same `mock-frontend` project — the inner development loop for
writing and debugging specs interactively.

```bash
npm run test:e2e
```

Headless run of the full suite. `npm run test:e2e:mock` is kept as an alias to this for anyone
still typing the old command name; it is not a separate mode and does not point at
`tests/mock-app/`, which no longer exists.

---

## 7. Proving the gate can fail — sentinel mutation test

A gate that is green means nothing unless breaking the app can turn it red. This was verified by
deliberately mutating `src/components/Editor.tsx`'s rendered `{currentName}` to a hardcoded
`{"MUTATED_SENTINEL"}`, rerunning the suite, and confirming `T1_NOTE_4` ("Title/Filename Rendering
in Header") and `T2_NOTE_3` flipped from pass to fail while the other tests continued to pass —
i.e., the failure was specific to the tests that actually exercise that line, not a suite-wide
false alarm. The mutation was reverted afterward (`git diff` clean). Full record in
[GATE-BASELINE.md](GATE-BASELINE.md).
