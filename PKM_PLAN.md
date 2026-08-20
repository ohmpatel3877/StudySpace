# StudySpace → Bespoke PKM Tool — Phased Plan

**Created:** 2026-08-20 · **Basis:** [AUDIT.md](AUDIT.md) · **Status file — update `Phase status` as work lands.**

---

## Decisions of record

These were answered directly and are not up for re-litigation in later sessions.

| # | Decision | Answer | Consequence |
|---|---|---|---|
| D1 | Relationship to Obsidian | **Independent store.** Own format, own directory. Import/export only. | No wikilink/frontmatter compat layer required. StudySpace owns its schema and may use a SQLite index as the source of truth for structure. The hardcoded `~/OneDrive/Obsidian/Obsidian-Education` vault root is **removed**, not honored. |
| D2 | Feature scope | **All four surfaces are core:** notes+linking, knowledge graph, D2L calendar, resource viewers (PDF/office/CAD). | Nothing is cut. But per AUDIT Finding 5, the CAD viewer and external imports must be **built**, not kept — they are currently placeholder text and a settings-array append. `three` stays in `package.json` deliberately. |
| D3 | Knowledge graph | **Keep the engine, delete the data.** | `academy-graph.js` (1,226 LOC canvas physics renderer) is ported to TypeScript and pointed at real vault links. `academy-data.js` (325 LOC of fictional AI-tutor entities) is deleted outright. |
| D4 | Audience | **Public someday, personal now.** | Build for one user; don't burn bridges. Deletions proceed without ceremony. Docs must be *accurate* (they currently are not) but need no contributor polish. Keep LICENSE/CI; deprioritize CONTRIBUTING/issue-template upkeep. |

### Working method

- **Opus 5 orchestrates; Sonnet subagents at low reasoning effort do the fan-out work.** Use the `Workflow` tool for fan-out (its `agent()` accepts `{model:'sonnet', effort:'low'}`); the plain `Agent` tool has no effort parameter.
- **Prompt caching is automatic, per-conversation, 1-hour TTL.** There is nothing to configure, and subagents do **not** inherit the orchestrator's warm cache — each starts cold. The case for fanning out is parallelism, context isolation, and cheaper per-token workers; it is not cache reuse.
- **Every fan-out gets an adversarial verifier.** Workers self-report success; a skeptic that neutralizes the worker's own fixture and re-runs is what catches work that is green but vacuous. This caught `T2_THEME_2` in Phase 0, which no amount of worker self-reporting would have.
- **Continue across phases while context stays healthy; stop when it degrades** — not at a boundary merely because one exists. Degradation signals: re-reading files already read, re-deriving settled conclusions, contradicting earlier findings without new evidence. Commit at each phase boundary regardless, and push, so stopping is always cheap.

---

## Phase status

| Phase | Name | Status |
|---|---|---|
| 0 | Verification gate | `DONE` — see [GATE-BASELINE.md](GATE-BASELINE.md) |
| 1 | Reconnect the backend | `PARTIAL` — app now launches; Rust backend reached; `handleFallback` removal outstanding |
| 2 | Purge and truth pass | `NOT STARTED` |
| 3 | PKM data core | `NOT STARTED` |
| 4 | Linking and backlinks | `NOT STARTED` |
| 5 | Graph on real data | `NOT STARTED` |
| 6 | Search | `NOT STARTED` |
| 7 | Resource viewers, for real | `NOT STARTED` |
| 8 | Calendar, hardened | `NOT STARTED` |
| 9 | Security and release | `NOT STARTED` |

---

## Phase 0 — Verification gate

**Why first:** every other phase is unverifiable until a test can fail. This is the phase that pays for all the others.

**This is a restoration, not a redesign.** Per AUDIT Finding 1, `.agents/sub_orch_e2e_testing/proposed_test_infra.md` — the suite's own design document — already specified `baseURL: 'http://localhost:5173'` and `webServer: npm run dev`. The implementation deviated silently. Phase 0 puts the suite back on its documented target.

### Work

1. Retarget Playwright at the real app. Use **`vite preview` against `dist/`** for the gate, not `npm run dev` — this makes the E2E step depend on `npm run build` succeeding, catching build-time breakage in the same command, and avoids HMR flake under parallel workers. Keep `npm run dev` for the `--ui` watch loop only.
2. Rewrite `tests/mocks/tauri-ipc-mock.ts` to use **`mockIPC` from `@tauri-apps/api/mocks`** — the officially supported Tauri 2 helper, already present in `node_modules`. Do not hand-roll a global; that mistake is what produced Finding 2.
3. **Delete `tests/mock-app/` entirely.** Do not port it. Its 996 lines are a second implementation that drifts silently. Delete `tests/mocks/tauri-driver/` (a `module.exports = {}` stub) at the same time.
4. Fix CI: remove `|| echo` so `cargo check` can fail. Add `cargo clippy` and `cargo fmt --check`.
5. Run the 115 specs against the real app. **Expect substantial breakage. That breakage is the deliverable** — each failure is a place the mock and the app disagreed. Record it in `GATE-BASELINE.md`. Do **not** fix tests into green in this phase; triage each failure into:
   - `real bug` — the app is wrong, fix in a later phase
   - `mock-only fiction` — asserts something that never existed (T1_VIEW_4's Three.js canvas, T2_VIEW_5's WebGL context loss); mark `test.fixme()` with a pointer to the phase that will make it real
   - `needs rewrite` — right intent, mock-shaped assertion
6. Add `npm run gate` = lint + typecheck + build + E2E + cargo check, mirroring CI exactly.

### Done condition

> A single named spec that **passes** after retargeting is chosen as the sentinel. Breaking the `src/` line it covers flips **that specific test** pass→fail; reverting flips it back. The sentinel's name, the covered line, and the full pre-triage failure count are recorded in `GATE-BASELINE.md`.

Checkable in one sentence: **break the app, watch a specific named test go red.**

> Deliberately *not* "the whole gate turns red" — the gate is expected to be red at baseline after retargeting, so overall redness proves nothing. Sensitivity has to be demonstrated per-test.

### Iterative development loop this unlocks

```
edit src/ → npm run gate → read failures → edit → repeat
```

with Playwright in `--ui` or `--headed --watch` mode for the inner loop and the full gate before commit. Every later phase depends on this loop existing.

---

## Phase 1 — Reconnect the backend

**Blocked by:** Phase 0 (otherwise there is no way to know if it worked).

> **Confirmed 2026-08-20: `npx tauri dev` has never been run on this machine.** Every milestone to date was developed and "verified" browser-only via `npm run dev`. This is the root cause behind Findings 1, 2 and 5 as a group — the desktop app was never the thing being built, so nothing that only manifests in the desktop app was ever seen. Phase 1 therefore starts one step earlier than originally written.

1. **Get the desktop app to launch at all.** Run `npx tauri dev`, resolve whatever surfaces, and confirm a window renders the React app. Only then does the rest of this phase have meaning. Record the outcome in GATE-BASELINE.md.
2. Confirm the runtime IPC global in that window (AUDIT Open Question 1 — already settled statically, but confirm empirically now that it is cheap to).
3. ~~**Delete `safeInvoke`'s hand-rolled shim.** Replace with `invoke()` from `@tauri-apps/api`.~~ **Done in Phase 0** — the retargeting required fixing both sides of the transport at once, so this landed early (`16911b1`).
4. **Delete `handleFallback` (`AppContext.tsx:54-342`), all 288 lines**, including both duplicate implementations and the 11-file fixture vault. The app must fail loudly without a backend rather than silently pretending to work on localStorage.

   > **`T2_CORE_2` must be rewritten in the same change.** "Missing Tauri Context Fallback" deletes `__TAURI_INTERNALS__` and asserts the app *degrades gracefully* — it is the one test that exercises `handleFallback`. Phase 1 inverts that contract: the app must now fail loudly. Rewrite the assertion to expect the loud failure. Do **not** delete the test, and do not let it silently invert into asserting the opposite of what it is named for.

   > **Load-bearing consequence — do not skip.** Playwright drives the app in Chrome, where no Tauri backend exists. Once `handleFallback` is gone, the *only* thing keeping the gate running is `tests/mocks/tauri-ipc-mock.ts` injecting the IPC layer. That mock becomes the **single IPC fake in the repository** and must faithfully implement all 10 commands. This is the correct design — one fake, living in `tests/`, driving real `src/` code — but a future session that deletes 288 lines without understanding this will silently stop the gate from running. If you are reading this in a later session: `tauri-ipc-mock.ts` is not dead code.
5. **Replace `Editor.tsx:15`'s `/vault/welcome.md` default with a real empty state.** Promoted out of the scaffolding-removal item below: this is a **live bug**, not dormant cruft. It is a localStorage fixture path hardcoded in production code, and against the real backend it produces `os error 3` on every boot (AUDIT Finding 4, "Confirmed live"). An app with no file open should render an empty state, not attempt to read a fictional file.
6. Remove the remaining shipped test scaffolding from product code: the 800ms artificial delay (`Viewer.tsx:30`), the hardcoded "50%" progress (`Viewer.tsx:85-96`), `window.__triggerWebGLContextLoss` (`CadViewer.tsx:41`).
6. Fix the state defects in AUDIT Finding 7: functional-update form for `updateSettings`, collapse `theme`/`settings.theme` and `features`/`settings.active_features` to single sources, delete dead `explorerOpen`.

### Done condition

> With the desktop app running, saving a setting writes a real file to `%APPDATA%\studyspace\settings.json`, and killing the Rust backend produces a visible error rather than a working-looking UI.

---

## Phase 2 — Purge and truth pass

1. Process AUDIT's dead file inventory. **Two rows are archive-not-delete:** move `.agents/**` outside the repo (it holds the original test-suite design doc, primary evidence for Finding 1), and mine `study_space.html`'s inline `notesDatabase` for its note taxonomy before removing it — that taxonomy is direct input to Phase 3. Everything else deletes outright. Untrack `tsconfig.tsbuildinfo` and `test-results/`; add both to `.gitignore`.
2. Remove the six unused npm dependencies and their `@types`. Keep `three` (D2, CAD is being built) and `@tauri-apps/api` (now in use after Phase 1). Remove unused `chrono` from `Cargo.toml` — or use it in Phase 8, decide there.
3. Rewrite the docs to match reality: `PROJECT.md`'s milestone table currently marks stubs as `DONE`; `TEST_INFRA.md` describes a suite that does not exist; `AGENTS.md:63` misstates the capabilities as "only `core:default`"; `README.md` claims a 3D CAD viewer and 115 passing E2E tests. Also restore the two dropped layers the original design specified and Phase 0 did not reinstate: a Vitest unit tier, and `tauri-driver` binary-mode E2E. Decide explicitly whether to build them or strike them from the spec — the current state is that they are promised and absent.
4. Delete `tests/mocks/tauri-driver/`.

### Done condition

> `git ls-files` contains no agent scratch, no prototype HTML, no build caches. Every feature claim in README.md and PROJECT.md is one a reader can verify by running the app.

---

## Phase 3 — PKM data core

The first phase that adds capability rather than removing fiction. Per D1, StudySpace owns its store.

1. Define the store: a user-chosen vault directory (**no hardcoded path**) holding Markdown files, plus a SQLite index sidecar for structure (notes, links, tags, timestamps).
2. Rust: `sqlx` or `rusqlite`; a vault-scoped path guard (see Phase 9 — but do the canonicalization *now*, when the commands are being rewritten anyway); a file watcher to keep the index fresh.
3. `read_vault_file` gains a binary path returning base64, honoring the contract PROJECT.md:80 already promised.
4. One-time importer for the existing Obsidian vault → StudySpace store.

### Done condition

> Pointing StudySpace at an empty directory, creating three notes, restarting the app, and killing the SQLite index all produce correct results — the index rebuilds from the Markdown files, which remain the durable artifact.

---

## Phase 4 — Linking and backlinks

`[[wikilink]]` parsing (own syntax, per D1), autocomplete on `[[`, a backlinks panel, unresolved-link surfacing, link-aware rename.

**Done condition:** > Renaming a note updates every inbound link, and the backlinks panel for note B lists note A the moment A links to it.

---

## Phase 5 — Graph on real data

Port `academy-graph.js` to TypeScript. Delete `academy-data.js`. Feed the renderer from the Phase 3 index. Fix the `removeEventListener` leak (AUDIT Finding 6). Feature-gate the tab like D2L is.

**Done condition:** > The graph shows the user's actual notes; creating a link between two notes makes an edge appear; mounting and unmounting the graph 20 times adds no window listeners.

---

## Phase 6 — Search

Full-text search over the SQLite index (FTS5), with tag and link filters, and a command palette.

**Done condition:** > Typing a phrase that exists in exactly one note finds that note, in under 100ms on a 1,000-note vault.

---

## Phase 7 — Resource viewers, for real

Per D2, all of these are core, and per AUDIT Finding 5, all of them are currently fiction.

- **CAD:** an actual Three.js scene with a real `<canvas>`, STL/OBJ parsing, orbit controls. This is a from-scratch build; the current component is placeholder text.
- **PDF:** real rendering on the Phase 3 binary read path.
- **Office:** fix the `/temp/` path bug (`commands.rs:197`), surface real `soffice` stderr instead of the fixed "File corrupted" string.
- **Code:** replace the regex tokenizer with the installed-and-unused `react-syntax-highlighter`, or delete that dependency and keep the regex deliberately.

**Done condition:** > Opening a real `.stl` file spins a real mesh; opening a real `.pdf` renders its real first page; a `.docx` that fails to convert shows the actual LibreOffice error.

---

## Phase 8 — Calendar, hardened

Use `chrono` (declared and unused since M4). Handle `TZID`, `VALUE=DATE`, and UTC normalization. Stop collapsing `DTSTART` and `DUE` into one field (`commands.rs:155`). Expand `RRULE`. Surface dropped-`UID` events. Move the feed URL to the OS credential store. Replace `reqwest::blocking` with async to remove the `panic = "abort"` process-kill risk.

**Done condition:** > A feed containing a weekly recurring assignment in a non-UTC timezone shows the correct number of occurrences at the correct local times, and an unreachable feed shows an error instead of aborting the process.

---

## Phase 9 — Security and release

Everything in AUDIT Finding 4: canonicalize and prefix-check every path; reject absolute-path override; extension allowlist on `open_in_default_app`; resolve `soffice` by absolute path; restrict `http:allow-fetch` to `https://*`; set a real CSP; remove the three registered-but-unused Tauri plugins.

**Done condition:** > A test suite of traversal payloads — `../../../etc/hosts`, `C:\Windows\System32\...`, UNC paths — is rejected by every file command, and each payload has a test that fails if the guard is removed.

---

## Sequencing rationale

Phases 0–2 remove fiction and build the instrument. Phases 3–6 build the PKM tool proper. Phases 7–8 finish what was claimed done. Phase 9 hardens before any public exposure (D4: personal now, so this can wait — but it must precede any release).

**Phase 0 is small enough to complete in one session and is the recommended next action.**
