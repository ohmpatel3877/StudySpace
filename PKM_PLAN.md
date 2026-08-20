# StudySpace → PKM & Pedagogical Engine — Phased Plan

**Created:** 2026-08-20 · **Revised:** 2026-08-20 (v2, after the Agent Handoff Specification) · **Basis:** [AUDIT.md](AUDIT.md), [GATE-BASELINE.md](GATE-BASELINE.md)

**Status file — update `Phase status` as work lands.**

---

## What StudySpace is becoming

Not a note-taking app. **An adaptive tutoring engine with a filesystem substrate.**

The user works through subjects with an in-app agent that assesses their baseline, plans a session against their available time, teaches adaptively, tracks topic drift, and logs telemetry it can use next time. Markdown and JSON on disk are the memory. The existing viewers, graph, and calendar become supporting surfaces around that core.

### Store topography

```
~/pkm/
├── main-skill.md                    # Root ontology, lazy-loading rules, base capabilities
└── subjects/
    └── {subject_id}/
        └── {subcategory_id}/
            ├── agent.md             # Top-down compressed sub-agent, generated at runtime
            ├── telemetry.json       # Session metrics, drift logs, latency stats
            └── sessions/
                └── {timestamp}.md   # Turn-by-turn context history
```

### Stub protocol

Every unwired module or placeholder an agent generates uses exactly this syntax, so it is machine-discoverable:

```html
<!-- STUB: [Module_ID] | Schema: [Expected_Type] | Status: UNWIRED -->
```

---

## Decisions of record

Answered directly. Not up for re-litigation without new information.

| # | Decision | Answer | Consequence |
|---|---|---|---|
| D1 | Store location | **`~/pkm/` replaces the Obsidian vault entirely.** | The hardcoded `~/OneDrive/Obsidian/Obsidian-Education` root is removed, not honored. StudySpace points only at `~/pkm/`. Existing `Sem 1` content is left in place as unrelated, not migrated. |
| D2 | Four legacy surfaces | **Still core — but after the engine.** | Notes, graph, D2L, and the PDF/CAD/office viewers all survive. They are sequenced *behind* the pedagogical engine. Don't spend early phases making the CAD viewer real. `three` stays in `package.json`. |
| D3 | Knowledge graph | **REVERSED — keep engine *and* data, wire it to drift.** | See "Reversal" below. `academy-graph.js` is ported to TS and driven by real subject topology; `pulseConnection()` becomes the drift-event visualization. `academy-data.js` is **not** deleted; it is the prototype's shape. |
| D4 | Audience | **Public someday, personal now.** | Build for one user. Deletions proceed without ceremony. Docs must be accurate (done — see `8cae4e3`) but need no contributor polish. |
| D5 | Agent layer | **App-native, inside StudySpace.** | The app itself runs assessments, compiles `agent.md`, prompts for reflection, and detects drift. Requires an LLM provider, secure key storage, a conversation UI, and a session orchestrator — **none of which exist today.** This is the single largest item in the plan. |
| D6 | Data model | **Files canonical; SQLite as a derived index only.** | Markdown + `telemetry.json` are the source of truth and stay agent-writable by hand. SQLite is a rebuildable cache for search and graph queries. Deleting it must be harmless. |
| D7 | Scheduling | **Mermaid Gantt rendered in the editor.** | The markdown preview gains a Mermaid renderer as an explicit deliverable, not a nice-to-have. |
| D8 | Stub system | **First-class and early.** | The `<!-- STUB: ... -->` protocol plus `scan_and_wire_stubs` is load-bearing for the agent workflow, not a utility. It gets its own phase, ahead of the agent runtime that depends on it. |

### Reversal: D3

An earlier revision of this plan called `academy-data.js` demo-ware and recommended deleting it. **That was wrong**, and the error is worth recording so it isn't repeated.

The judgment was made against the test "does this display the user's notes?" Under this specification the graph was never meant to display notes. `academy-data.js` contains `eng-tutor`, `chemistry-mcp`, `fea-mcp`, `nuclear-mcp`, `orchestrator-mcp`, `materials-mcp`, plus `CROSS_POLLINATION_EDGES` and `OBSERVATIONS` — that is a **subject/subcategory topology with cross-links and drift observations**, i.e. a sketch of the architecture above. And `academy-graph.js` already exposes `pulseConnection()`, which is the spec's "connect semantic drift events to node activation states" in different words.

Those files are a prototype of the target, written before the target was specified. Keep both.

### Honest scope note on D5

Choosing an app-native agent layer over Claude Code skills roughly **doubles the project**. It adds: an LLM provider integration, a conversation/turn UI, a session orchestrator, drift detection (semantic comparison, so embeddings or model calls), and secure credential storage.

That last one is not optional and not deferrable to the end. AUDIT Finding 4 already flags that the D2L feed URL is stored as plaintext JSON with no OS keychain. **An LLM API key stored the same way is a materially worse exposure.** Credential storage is therefore pulled into Phase 6 where the key is introduced, rather than waiting for the security phase.

If the scope proves too large, the fallback is D5's other branch — skills drive the lifecycle, the app renders the state — and Phases 3, 4, 5, 9 and 10 remain valuable either way.

---

## Working method

- **Opus orchestrates; Sonnet workers at low effort do fan-out.** Use `Workflow` (its `agent()` takes `{model:'sonnet', effort:'low'}`); the plain `Agent` tool has no effort parameter.
- **Every fan-out gets an adversarial verifier.** Workers self-report success. A skeptic that neutralizes the worker's own fixture and re-runs is what catches green-but-vacuous work. This caught `T2_THEME_2` in Phase 0 and a bad file:line citation in Phase 2; no amount of self-reporting would have.
- **Prompt caching is automatic, per-conversation, 1-hour TTL.** Subagents do **not** inherit the orchestrator's warm cache — each starts cold. Fan out for parallelism, context isolation, and cheaper workers; not for cache reuse.
- **Continue across phases while context stays healthy; stop when it degrades** — not at a boundary merely because one exists. Degradation signals: re-reading files already read, re-deriving settled conclusions, contradicting earlier findings without new evidence. Commit and push at every boundary regardless, so stopping is always cheap.
- **`npm run gate` before every commit.** It is the only thing standing between this plan and the last one.

---

## Phase status

| Phase | Name | Status |
|---|---|---|
| 0 | Verification gate | `DONE` — [GATE-BASELINE.md](GATE-BASELINE.md) |
| 1 | Reconnect the backend | `PARTIAL` — fallback deleted, app fails loudly; scaffolding + state defects outstanding |
| 2 | Purge and truth pass | `PARTIAL` — docs done (`8cae4e3`); dead-file purge outstanding |
| 3 | The `~/pkm/` store | `NOT STARTED` |
| 4 | Stub system | `NOT STARTED` |
| 5 | Agent runtime | `NOT STARTED` |
| 6 | Assessment & adaptive teaching | `NOT STARTED` |
| 7 | Gantt & session scoping | `NOT STARTED` |
| 8 | Telemetry, reflection & dashboard | `NOT STARTED` |
| 9 | Graph wired to drift | `NOT STARTED` |
| 10 | Search | `NOT STARTED` |
| 11 | Resource viewers, for real | `NOT STARTED` |
| 12 | Calendar, hardened | `NOT STARTED` |
| 13 | Security & release | `NOT STARTED` |

---

## Phase 0 — Verification gate · `DONE`

Retargeted the E2E suite from a hand-written mock app onto the real React app, moved both sides of the IPC to Tauri 2, and made CI able to fail. Full record in [GATE-BASELINE.md](GATE-BASELINE.md).

**Done condition met:** breaking `src/components/Editor.tsx:96` flips `T1_NOTE_4` and `T2_NOTE_3` pass→fail while 8 other tests stay green.

Every phase below depends on this loop: `edit src/` → `npm run gate` → read failures → repeat.

---

## Phase 1 — Reconnect the backend · `PARTIAL`

**Landed:** `safeInvoke` uses Tauri 2 `invoke()`; `vite.config.ts` fixed so `npx tauri dev` launches at all (AUDIT Finding 8); the Rust backend is demonstrably reached.

**Outstanding:**

1. **Delete `handleFallback` (`AppContext.tsx:54-342`), all 288 lines** — both duplicate implementations and the 11-file fixture vault. The app must fail loudly without a backend.
   > **`T2_CORE_2` must be rewritten in the same change.** It is the only test exercising `handleFallback` and currently asserts graceful degradation. Rewrite it to assert loud failure. Do not delete it; do not let it silently invert.
   > **`tests/mocks/tauri-ipc-mock.ts` becomes the single IPC fake in the repo** and is load-bearing for the whole gate. It is not dead code.
2. **Replace `Editor.tsx:15`'s `/vault/welcome.md` default with a real empty state.** This is a live bug producing `os error 3` on every boot (AUDIT Finding 4, "Confirmed live"), not dormant scaffolding.
3. Remove remaining shipped test scaffolding: the 800ms artificial delay (`Viewer.tsx:30`), hardcoded "50%" progress (`Viewer.tsx:85-96`), `window.__triggerWebGLContextLoss` (`CadViewer.tsx:41`).
4. Fix the state defects in AUDIT Finding 7: functional-update form for `updateSettings`, collapse the duplicated `theme`/`features` state, delete dead `explorerOpen`.

### Done condition

> With the desktop app running, saving a setting writes a real file to `%APPDATA%\studyspace\settings.json`, and starting the app with the Rust backend unavailable produces a visible error rather than a working-looking UI.

---

## Phase 2 — Purge and truth pass · `PARTIAL`

**Landed:** all four stale docs rewritten and independently fact-checked (`8cae4e3`).

**Outstanding:**

1. Process AUDIT's dead file inventory. **Two rows are archive-not-delete:** move `.agents/**` outside the repo (it holds the original test-suite design doc, primary evidence for Finding 1); mine `study_space.html`'s inline `notesDatabase` for its note taxonomy first — it is direct input to Phase 3's subject/subcategory inference.
2. Remove genuinely unused npm dependencies and their `@types`. **Keep** `three` (D2), `@tauri-apps/api` (now in use), and `react-syntax-highlighter` if Phase 11 will adopt it. Remove `chrono` from `Cargo.toml` or use it in Phase 12 — decide there.

### Done condition

> `git ls-files` contains no agent scratch, no prototype HTML, no build caches, and every dependency in `package.json` is either imported somewhere or has a comment saying which phase will import it.

---

## Phase 3 — The `~/pkm/` store

The first phase that builds toward the new product.

1. Implement the directory topography above. **Root is user-configurable, defaulting to `~/pkm/`** — no hardcoded path (D1).
2. Rust: create/read/write the tree; a **vault-scoped path guard** — canonicalize and prefix-check, reject `..` and absolute-path override. Do this *now*, while the commands are being rewritten, rather than deferring to Phase 13 (AUDIT Finding 4).
3. `read_vault_file` gains a binary path returning base64, honoring the contract `PROJECT.md` has always documented.
4. Define and version the `telemetry.json` schema and `agent.md` frontmatter.
5. SQLite as a **derived index only** (D6) — rebuildable from files, safe to delete.
6. A file watcher to keep the index fresh when an agent writes to the tree out-of-band.

### Done condition

> Pointing StudySpace at an empty directory, creating a subject and subcategory, restarting the app, and deleting the SQLite index all produce correct results — the index rebuilds from the markdown and JSON, which remain the durable artifact. A path containing `..` or an absolute override is rejected by every file command.

---

## Phase 4 — Stub system

First-class and ahead of the agent runtime that consumes it (D8).

1. Parser for `<!-- STUB: [Module_ID] | Schema: [Expected_Type] | Status: UNWIRED -->` — tolerant of whitespace, strict about field names.
2. Rust command `scan_and_wire_stubs`: discover stubs across markdown in the store, return them structured (`module_id`, `schema`, `status`, `file`, `line`), and support replacing a stub with generated content.
3. UI: surface unresolved stubs — count in the explorer, list view, jump-to-location.
4. Unresolved stubs feed the Phase 8 telemetry log.

### Done condition

> Writing a stub comment by hand into a file under the store makes it appear in the app's unresolved list within one watcher tick; wiring it through `scan_and_wire_stubs` replaces exactly that comment and leaves the rest of the file byte-identical.

---

## Phase 5 — Agent runtime

The largest phase (D5). Consider splitting it once it starts.

1. LLM provider integration with **credential storage in the OS keychain, not plaintext JSON** — see the scope note above. This also retires the plaintext D2L URL from AUDIT Finding 4.
2. Conversation/turn UI and a session orchestrator.
3. `main-skill.md` root ontology, with the lazy-loading rules it defines.
4. Top-down compilation: compress root definitions into `subjects/{id}/{sub}/agent.md` at runtime.
5. Session persistence to `sessions/{timestamp}.md`.
6. Drift detection — the semantic comparison that produces the drift events Phases 8 and 9 consume.

### Done condition

> Starting a session on a new subject generates an `agent.md` compressed from `main-skill.md`, writes a timestamped session log as the conversation proceeds, and a deliberate topic change is recorded as a drift event.

---

## Phase 6 — Assessment & adaptive teaching

1. Search existing `telemetry.json` for prior performance on the subject.
2. With no history: a **3-question diagnostic on edge and friction points. Short answer only — no multiple choice.**
3. Present a baseline score; offer gap-calibration prompts to adjust difficulty by hand.
4. Adaptive teaching loop driven by the baseline plus telemetry.

### Done condition

> A first session on an unseen subject issues exactly three short-answer questions and produces a baseline score; a second session on the same subject reads the prior score instead of re-testing.

---

## Phase 7 — Gantt & session scoping

1. Ask for time constraints — Small / Medium / Large.
2. Break the plan into tasks scoped to that budget.
3. **Render Mermaid Gantt in the markdown preview** (D7) — `Editor.tsx` gains a Mermaid renderer.

### Done condition

> Choosing a session size produces a task breakdown whose rendered Gantt chart reflects that budget, and the same markdown renders identically when the file is reopened.

---

## Phase 8 — Telemetry, reflection & dashboard

1. Log drift instances, unresolved stubs, and call latencies to `telemetry.json`.
2. `/end-session`: two micro-reflection questions on pace and explanation style.
3. **Telemetry dashboard** — a panel rendering local `telemetry.json` metrics and active Gantt schedules (spec task 2).

### Done condition

> Completing a session appends drift, stub and latency entries to the subject's `telemetry.json`, and the dashboard renders them without re-reading the session log.

---

## Phase 9 — Graph wired to drift

1. Port `academy-graph.js` (1,226 LOC) to TypeScript. Fix the `removeEventListener` leak — the listener was registered as an anonymous arrow, so removal silently no-ops and one leaks per mount (AUDIT Finding 6).
2. Drive nodes/edges from real subject topology in the store, keeping `academy-data.js`'s shape as the schema (D3).
3. **Connect drift events to node activation** via the existing `pulseConnection()` (spec task 3).
4. Feature-gate the tab like D2L is.

### Done condition

> The graph shows the user's actual subjects; a drift event during a live session visibly pulses the corresponding connection; mounting and unmounting the graph 20 times adds no window listeners.

---

## Phase 10 — Search

SQLite FTS5 over the derived index, with subject/subcategory and tag filters, plus a command palette.

**Done condition:** > A phrase present in exactly one session log finds that log in under 100ms across a 1,000-file store.

---

## Phase 11 — Resource viewers, for real

Per D2 these are core but sequenced here. All three are currently fiction (AUDIT Finding 5).

- **CAD:** a real `<canvas>` and Three.js scene, STL/OBJ parsing, orbit controls. From scratch.
- **PDF:** real rendering over the Phase 3 binary read path.
- **Office:** fix the `/temp/` path bug (`commands.rs:197`); surface real `soffice` stderr instead of the fixed "File corrupted" string.
- **Code:** adopt `react-syntax-highlighter` or delete it and keep the regex tokenizer deliberately.

**Done condition:** > A real `.stl` spins a real mesh, a real `.pdf` renders its first page, and a `.docx` that fails conversion shows the actual LibreOffice error. The tests named in GATE-BASELINE's "certified fiction" list are rewritten alongside the implementations.

---

## Phase 12 — Calendar, hardened

Use `chrono` (declared and unused since M4). Handle `TZID`, `VALUE=DATE`, UTC normalization. Stop collapsing `DTSTART` and `DUE` (`commands.rs:155`). Expand `RRULE`. Move the feed URL to the keychain built in Phase 5. Replace `reqwest::blocking` with async to remove the `panic = "abort"` process-kill risk.

**Integration worth building:** D2L due dates are natural inputs to the Phase 7 Gantt scheduler — real assignment deadlines become the session schedule rather than invented dates.

**Done condition:** > A feed with a weekly recurring assignment in a non-UTC timezone shows the correct occurrences at correct local times; an unreachable feed shows an error instead of aborting the process.

---

## Phase 13 — Security & release

Remaining items from AUDIT Finding 4 not already handled in Phases 3 and 5: extension allowlist on `open_in_default_app`; resolve `soffice` by absolute path; restrict `http:allow-fetch` to `https://*`; set a real CSP; remove the three registered-but-unused Tauri plugins.

**Done condition:** > A suite of traversal payloads — `../../../etc/hosts`, `C:\Windows\System32\...`, UNC paths — is rejected by every file command, and each payload has a test that fails if its guard is removed.

---

## Sequencing rationale

0–2 remove fiction and build the instrument. **3–4 build the substrate.** **5–8 build the engine** — the actual product. 9–10 make the store navigable. 11–12 finish what was claimed done a year ago. 13 hardens before any public exposure.

Security is deliberately *not* concentrated in Phase 13: the path guard lands in Phase 3 where the commands are rewritten, and credential storage in Phase 5 where the API key is introduced. Deferring either would mean knowingly shipping the vulnerability through the phases that most exercise it.
