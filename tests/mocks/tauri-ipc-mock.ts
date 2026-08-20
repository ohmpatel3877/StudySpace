import { test as base } from '@playwright/test';

export const test = base.extend({
  // The fixture callback's second arg is named `provide`, not Playwright's
  // conventional `use`: oxlint's react/rules-of-hooks rule treats a bare
  // `use(...)` call as the React `use` hook and errors. Playwright passes this
  // argument positionally, so the name is ours to choose.
  page: async ({ page }, provide) => {
    // Inject Tauri API mock before application boot
    await page.addInitScript(() => {
      const mockVaultFiles = [
        { name: 'welcome.md', path: '/vault/welcome.md', is_dir: false, ext: 'md' },
        { name: 'homework.md', path: '/vault/homework.md', is_dir: false, ext: 'md' },
        { name: 'syllabus.pdf', path: '/vault/syllabus.pdf', is_dir: false, ext: 'pdf' },
        { name: 'gear.stl', path: '/vault/gear.stl', is_dir: false, ext: 'stl' },
        { name: 'solver.cpp', path: '/vault/solver.cpp', is_dir: false, ext: 'cpp' },
        // R8 Office docs
        { name: 'document.docx', path: '/vault/document.docx', is_dir: false, ext: 'docx' },
        { name: 'spreadsheet.xlsx', path: '/vault/spreadsheet.xlsx', is_dir: false, ext: 'xlsx' },
        { name: 'presentation.pptx', path: '/vault/presentation.pptx', is_dir: false, ext: 'pptx' },
        { name: 'zero.docx', path: '/vault/zero.docx', is_dir: false, ext: 'docx' },
        { name: 'corrupt.docx', path: '/vault/corrupt.docx', is_dir: false, ext: 'docx' },
        { name: 'large.pptx', path: '/vault/large.pptx', is_dir: false, ext: 'pptx' }
      ];

      const defaultSettings = {
        theme: 'Dark Mode',
        active_features: ['d2l_sync', 'cad_viewer'],
        d2l_feed_url: 'https://d2l.myuniversity.edu/feed.ics',
        external_locations: [] as any[]
      };

      const mockD2lEvents = [
        { id: 'ev1', title: 'Calculus Midterm', description: 'Covers Ch 1-4', due_date: '2026-07-15T12:00:00Z' },
        { id: 'ev2', title: 'Physics Lab Report', description: 'Submit via dropbox', due_date: '2026-07-18T23:59:00Z' }
      ];

      const mockFileContent: Record<string, string> = {
        '/vault/welcome.md': '# Welcome\nStudySpace is active!',
        '/vault/homework.md': '# Homework 1\nPending answers...',
        '/vault/solver.cpp': '#include <iostream>\n\nint main() {\n  std::cout << "Hello World";\n  return 0;\n}',
        '/vault/syllabus.pdf': 'BASE64_MOCK_DATA_STREAM',
        '/vault/gear.stl': 'BASE64_MOCK_DATA_STREAM'
      };

      const defaultState = {
        files: mockVaultFiles,
        settings: { ...defaultSettings },
        events: mockD2lEvents,
        contents: { ...mockFileContent },
        lastCommand: null,
        commandsLog: [] as any[],
        libreOfficeInstalled: true
      };

      // Load from sessionStorage if available to persist changes across reload
      const savedOverride = sessionStorage.getItem('__MOCK_STATE_OVERRIDE__');
      console.log('TAURI_MOCK_INIT: savedOverride exists =', !!savedOverride);
      let state: any;
      if (savedOverride) {
        console.log('TAURI_MOCK_INIT: Loading state from sessionStorage');
        const parsed = JSON.parse(savedOverride);
        // Ensure all expected keys exist; merge with defaults for any missing
        state = {
          files: parsed.files ?? defaultState.files,
          settings: { ...defaultSettings, ...(parsed.settings || {}) },
          events: parsed.events ?? defaultState.events,
          contents: parsed.contents ?? { ...defaultState.contents },
          lastCommand: parsed.lastCommand ?? null,
          commandsLog: Array.isArray(parsed.commandsLog) ? parsed.commandsLog : [],
          libreOfficeInstalled: parsed.libreOfficeInstalled !== undefined ? parsed.libreOfficeInstalled : true
        };
        console.log('TAURI_MOCK_INIT: state.settings.theme =', state.settings.theme);
        console.log('TAURI_MOCK_INIT: state.settings.active_features =', state.settings.active_features);
        console.log('TAURI_MOCK_INIT: state.files.length =', state.files.length);
      } else {
        state = { ...defaultState, settings: { ...defaultSettings }, contents: { ...mockFileContent }, commandsLog: [] };
      }

      // Sync state back to sessionStorage on any mutation immediately
      const syncState = () => {
        const val = JSON.stringify(state);
        sessionStorage.setItem('__MOCK_STATE_OVERRIDE__', val);
      };

      function makeDeepProxy(obj: any, onChange: () => void): any {
        const handler: ProxyHandler<any> = {
          get(target, property) {
            try {
              const value = Reflect.get(target, property);
              if (value && typeof value === 'object') {
                // Use the proxy target's object, not a new wrapper each time,
                // to avoid nested-proxy proliferation. But we MUST wrap arrays
                // so that .push() etc trigger onChange.
                return new Proxy(value, handler);
              }
              return value;
            } catch {
              return Reflect.get(target, property);
            }
          },
          set(target, property, value) {
            const result = Reflect.set(target, property, value);
            onChange();
            return result;
          },
          deleteProperty(target, property) {
            const result = Reflect.deleteProperty(target, property);
            onChange();
            return result;
          }
        };
        return new Proxy(obj, handler);
      }

      // Expose to window context – the proxy wraps state so every mutation syncs
      (window as any).__MOCK_STATE__ = makeDeepProxy(state, syncState);

      /**
       * Tauri 2 IPC mock.
       *
       * This is the SINGLE IPC fake in the repository and it is load-bearing:
       * Playwright drives the real React app in Chrome, where no Tauri backend
       * exists, so `window.__TAURI_INTERNALS__.invoke` is the only thing that
       * lets src/ reach a backend at all. Do not delete it as "dead code".
       *
       * Shape matches what @tauri-apps/api@2 core.js calls:
       *   window.__TAURI_INTERNALS__.invoke(cmd, args, options) -> Promise
       * This is the same contract the official `mockIPC` helper installs; we
       * set it directly because addInitScript runs before any module loads.
       *
       * The previous version implemented the Tauri *1* callback protocol
       * (`__TAURI_IPC__` with callback/error global names). See AUDIT.md
       * Finding 2.
       */
      const invokeHandler = async (cmd: string, args: any = {}) => {
        // Tauri 2 passes args as a flat object. The legacy call sites read from
        // several shapes, so present all of them to keep the handlers unchanged.
        const message: any = { cmd, cmd_args: args, ...args };
        const cmd_args = args;

        // In Tauri 2 the invoke() promise IS the result channel: resolve by
        // returning, reject by throwing. No callback globals involved.
        const respond = (data: any) => data;
        const reject = (err: any) => {
          throw new Error(typeof err === 'string' ? err : String(err));
        };

        const activeState = (window as any).__MOCK_STATE__;
        activeState.lastCommand = cmd;
        activeState.commandsLog.push({ cmd, cmd_args, message });
        syncState();

        try {
          switch (cmd) {
            case 'get_vault_files':
              return respond(activeState.files);
            case 'read_vault_file': {
              const rPath = message.path || (cmd_args && cmd_args.path) || message.cmd_args?.path;
              if (activeState.contents[rPath] !== undefined) {
                return respond(activeState.contents[rPath]);
              }
              if (rPath === '/vault/syllabus.pdf' || rPath === '/vault/gear.stl') {
                return reject('File not found');
              }
              if (rPath.endsWith('.stl') || rPath.endsWith('.pdf') || rPath.includes('/temp/')) {
                return respond('BASE64_MOCK_DATA_STREAM');
              }
              return reject('File not found');
            }
            case 'write_vault_file': {
              const wPath = message.path || (cmd_args && cmd_args.path) || message.cmd_args?.path;
              if (wPath && (wPath.includes('locked') || wPath.includes('readonly'))) {
                return reject('Permission denied');
              }
              const wContent = message.content || (cmd_args && cmd_args.content) || message.cmd_args?.content;
              activeState.contents[wPath] = wContent;
              
              // Dynamically register file in file tree list if new
              const filename = wPath.split('/').pop() || 'file';
              const ext = filename.split('.').pop() || '';
              const exists = activeState.files.some((f: any) => f.path === wPath);
              if (!exists) {
                activeState.files.push({
                  name: filename,
                  path: wPath,
                  is_dir: false,
                  ext: ext
                });
              }
              syncState();
              return respond(null);
            }
            case 'fetch_and_parse_d2l': {
              const url = message.url || (cmd_args && cmd_args.url) || message.cmd_args?.url;
              if (!url || !url.startsWith('http')) {
                return reject('Invalid iCal feed URL');
              }
              return respond(activeState.events);
            }
            case 'load_settings': {
              const s = { ...activeState.settings };
              if (!Array.isArray(s.active_features)) {
                s.active_features = ['d2l_sync', 'cad_viewer'];
              }
              return respond(s);
            }
            case 'save_settings': {
              const settings = message.settings || (cmd_args && cmd_args.settings) || message.cmd_args?.settings;
              activeState.settings = { ...activeState.settings, ...settings };
              syncState();
              return respond(null);
            }
            case 'import_external_location': {
              const loc_type = message.location_type || (cmd_args && cmd_args.location_type) || message.cmd_args?.location_type;
              const path_or_url = message.path_or_url || (cmd_args && cmd_args.path_or_url) || message.cmd_args?.path_or_url;
              const credentials = message.credentials || (cmd_args && cmd_args.credentials) || message.cmd_args?.credentials;
              
              if (loc_type === 'webdav' && credentials?.password === 'invalid') {
                return reject('Authentication failed');
              }
              if (!path_or_url || path_or_url === '') {
                return reject('Malformed path or URL');
              }
              if (path_or_url === '/locked_folder') {
                return reject('Permission denied');
              }
              
              activeState.settings.external_locations.push({
                location_type: loc_type,
                path_or_url: path_or_url
              });
              
              const extName = path_or_url.split('/').pop() || 'ext';
              activeState.files.push({
                name: `external_${extName}_note.md`,
                path: `${path_or_url}/external_${extName}_note.md`,
                is_dir: false,
                ext: 'md'
              });
              activeState.contents[`${path_or_url}/external_${extName}_note.md`] = `# External Imported Note\nThis note belongs to ${path_or_url}!`;
              
              activeState.files.push({
                name: `external_${extName}_mesh.stl`,
                path: `${path_or_url}/external_${extName}_mesh.stl`,
                is_dir: false,
                ext: 'stl'
              });
              
              syncState();
              return respond(null);
            }
            case 'remove_external_location': {
              const path_or_url = message.path_or_url || (cmd_args && cmd_args.path_or_url) || message.cmd_args?.path_or_url;
              
              activeState.settings.external_locations = activeState.settings.external_locations.filter(
                (loc: any) => loc.path_or_url !== path_or_url
              );
              
              activeState.files = activeState.files.filter((f: any) => !f.path.startsWith(path_or_url));
              
              syncState();
              return respond(null);
            }
            case 'convert_office_doc': {
              const file_path = message.file_path || (cmd_args && cmd_args.file_path) || message.cmd_args?.file_path;
              
              if (!activeState.libreOfficeInstalled) {
                return reject('LibreOffice missing');
              }
              if (file_path.includes('corrupt.docx')) {
                return reject('Conversion failed: File corrupted');
              }
              if (file_path.includes('zero.docx')) {
                return respond({ pdf_path: '/temp/zero.pdf' });
              }
              if (file_path.includes('large.pptx')) {
                return respond({ pdf_path: '/temp/large.pdf' });
              }
              return respond({ pdf_path: '/temp/converted_document.pdf' });
            }
            case 'open_in_default_app': {
              const file_path = message.file_path || (cmd_args && cmd_args.file_path) || message.cmd_args?.file_path;
              
              if (file_path.includes('missing.md')) {
                return reject('File not found');
              }
              if (file_path.includes('no_assoc.md')) {
                return reject('No default application associated');
              }
              if (file_path.includes('denied.md')) {
                return reject('Access denied');
              }
              return respond(null);
            }
            default:
              return reject(`Unhandled command: ${cmd}`);
          }
        } catch (e: any) {
          // Preserve rejections thrown by reject() above; wrap anything else.
          throw e instanceof Error ? e : new Error(e?.message ?? String(e));
        }
      };

      // Minimal Tauri 2 internals surface. `invoke` is what @tauri-apps/api
      // core.js delegates to; the other two are present because parts of the
      // API surface reference them and their absence throws on import.
      let callbackId = 0;
      (window as any).__TAURI_INTERNALS__ = {
        invoke: invokeHandler,
        transformCallback: (cb: any, once = false) => {
          const id = ++callbackId;
          const prop = `_${id}`;
          Object.defineProperty(window, prop, {
            value: (result: any) => {
              if (once) Reflect.deleteProperty(window, prop);
              return cb?.(result);
            },
            writable: false,
            configurable: true,
          });
          return id;
        },
        convertFileSrc: (filePath: string, protocol = 'asset') =>
          `http://${protocol}.localhost/${encodeURIComponent(filePath)}`,
      };

      (window as any).__MOCK_TAURI_ACTIVE__ = true;
    });
    await provide(page);
  }
});
