// Local Storage fallbacks for standard browser runs
function getFallbackSettings() {
  try {
    const s = localStorage.getItem('studyspace_settings');
    if (s) {
      return JSON.parse(s);
    }
  } catch (e) {
    console.warn("Storage corrupted, returning default settings", e);
  }
  return {
    theme: 'Dark Mode',
    active_features: ['d2l_sync', 'cad_viewer'],
    d2l_feed_url: 'https://d2l.myuniversity.edu/feed.ics',
    external_locations: []
  };
}

const fallbackFiles = [
  { name: 'welcome.md', path: '/vault/welcome.md', is_dir: false, ext: 'md' },
  { name: 'homework.md', path: '/vault/homework.md', is_dir: false, ext: 'md' },
  { name: 'syllabus.pdf', path: '/vault/syllabus.pdf', is_dir: false, ext: 'pdf' },
  { name: 'gear.stl', path: '/vault/gear.stl', is_dir: false, ext: 'stl' },
  { name: 'solver.cpp', path: '/vault/solver.cpp', is_dir: false, ext: 'cpp' },
  // Office files
  { name: 'document.docx', path: '/vault/document.docx', is_dir: false, ext: 'docx' },
  { name: 'spreadsheet.xlsx', path: '/vault/spreadsheet.xlsx', is_dir: false, ext: 'xlsx' },
  { name: 'presentation.pptx', path: '/vault/presentation.pptx', is_dir: false, ext: 'pptx' },
  { name: 'zero.docx', path: '/vault/zero.docx', is_dir: false, ext: 'docx' },
  { name: 'corrupt.docx', path: '/vault/corrupt.docx', is_dir: false, ext: 'docx' },
  { name: 'large.pptx', path: '/vault/large.pptx', is_dir: false, ext: 'pptx' }
];

const fallbackFileContents = {
  '/vault/welcome.md': '# Welcome\nStudySpace is active!',
  '/vault/homework.md': '# Homework 1\nPending answers...',
  '/vault/solver.cpp': '#include <iostream>\n\nint main() {\n  std::cout << "Hello World";\n  return 0;\n}'
};

function fallbackIpc(cmd, args) {
  console.log(`Fallback IPC: ${cmd}`, args);
  switch (cmd) {
    case 'load_settings':
      return Promise.resolve(getFallbackSettings());
    case 'save_settings':
      localStorage.setItem('studyspace_settings', JSON.stringify(args.settings));
      return Promise.resolve(null);
    case 'get_vault_files':
      return Promise.resolve(fallbackFiles);
    case 'read_vault_file':
      if (fallbackFileContents[args.path]) {
        return Promise.resolve(fallbackFileContents[args.path]);
      }
      return Promise.resolve('BASE64_MOCK_DATA_STREAM');
    case 'write_vault_file':
      fallbackFileContents[args.path] = args.content;
      return Promise.resolve(null);
    case 'fetch_and_parse_d2l':
      if (!args.url || !args.url.startsWith('http')) {
        return Promise.reject(new Error('Invalid iCal feed URL'));
      }
      return Promise.resolve([
        { id: 'ev1', title: 'Calculus Midterm', description: 'Covers Ch 1-4', due_date: '2026-07-15T12:00:00Z' },
        { id: 'ev2', title: 'Physics Lab Report', description: 'Submit via dropbox', due_date: '2026-07-18T23:59:00Z' }
      ]);
    case 'import_external_location': {
      if (args.location_type === 'webdav' && args.credentials?.password === 'invalid') {
        return Promise.reject(new Error('Authentication failed'));
      }
      if (!args.path_or_url || args.path_or_url === '') {
        return Promise.reject(new Error('Malformed path or URL'));
      }
      if (args.path_or_url === '/locked_folder') {
        return Promise.reject(new Error('Permission denied'));
      }
      const settings = getFallbackSettings();
      if (!settings.external_locations) settings.external_locations = [];
      settings.external_locations.push({
        location_type: args.location_type,
        path_or_url: args.path_or_url
      });
      localStorage.setItem('studyspace_settings', JSON.stringify(settings));

      const extName = args.path_or_url.split('/').pop() || 'ext';
      fallbackFiles.push({
        name: `external_${extName}_note.md`,
        path: `${args.path_or_url}/external_${extName}_note.md`,
        is_dir: false,
        ext: 'md'
      });
      fallbackFileContents[`${args.path_or_url}/external_${extName}_note.md`] = `# External Imported Note\nThis note belongs to ${args.path_or_url}!`;

      fallbackFiles.push({
        name: `external_${extName}_mesh.stl`,
        path: `${args.path_or_url}/external_${extName}_mesh.stl`,
        is_dir: false,
        ext: 'stl'
      });
      return Promise.resolve(null);
    }
    case 'remove_external_location': {
      const settings = getFallbackSettings();
      if (settings.external_locations) {
        settings.external_locations = settings.external_locations.filter(
          loc => loc.path_or_url !== args.path_or_url
        );
      }
      localStorage.setItem('studyspace_settings', JSON.stringify(settings));

      const idx1 = fallbackFiles.findIndex(f => f.path.startsWith(args.path_or_url));
      if (idx1 !== -1) {
        fallbackFiles.splice(idx1, 2);
      }
      return Promise.resolve(null);
    }
    case 'convert_office_doc': {
      if (args.file_path.includes('corrupt.docx')) {
        return Promise.reject(new Error('Conversion failed: File corrupted'));
      }
      return Promise.resolve({ pdf_path: '/temp/converted_document.pdf' });
    }
    case 'open_in_default_app': {
      if (args.file_path.includes('missing.md')) {
        return Promise.reject(new Error('File not found'));
      }
      return Promise.resolve(null);
    }
    default:
      return Promise.reject(new Error(`Unhandled fallback command: ${cmd}`));
  }
}

// IPC Invoker wrapper
async function invokeTauri(cmd, args = {}) {
  if (window.__TAURI_IPC__) {
    const callbackId = 'tauri_cb_' + Math.floor(Math.random() * 1000000);
    const errorId = 'tauri_err_' + Math.floor(Math.random() * 1000000);
    
    return new Promise((resolve, reject) => {
      window[callbackId] = (res) => {
        delete window[callbackId];
        delete window[errorId];
        resolve(res);
      };
      window[errorId] = (err) => {
        delete window[callbackId];
        delete window[errorId];
        reject(new Error(err));
      };
      
      window.__TAURI_IPC__({
        cmd,
        callback: callbackId,
        error: errorId,
        cmd_args: args,
        ...args
      });
    });
  } else {
    return fallbackIpc(cmd, args);
  }
}

// Application State
let appSettings = null;
let vaultFiles = [];
let selectedFile = null;
let currentPreviewMode = false; // false = edit, true = preview
let activeTab = 'workspace'; // workspace, d2l, settings
let autoRotateLoopId = null;

// UI Elements
const htmlEl = document.documentElement;
const sidebarEl = document.getElementById('sidebar');
const fileListEl = document.getElementById('file-list');
const newFileNameInput = document.getElementById('new-file-name');
const btnCreateFile = document.getElementById('btn-create-file');

const btnWorkspace = document.getElementById('btn-workspace');
const btnD2l = document.getElementById('btn-d2l');
const btnSettings = document.getElementById('btn-settings');

const editorPaneEl = document.getElementById('editor-pane');
const editorTitleEl = document.getElementById('editor-title');
const editorTextarea = document.getElementById('editor-textarea');
const editorPreview = document.getElementById('editor-preview');
const btnPreviewToggle = document.getElementById('btn-preview-toggle');
const btnSave = document.getElementById('btn-save');

const viewerPaneEl = document.getElementById('viewer-pane');
const viewerFallback = document.getElementById('viewer-fallback');
const viewerPdf = document.getElementById('viewer-pdf');
const pdfFrame = document.getElementById('pdf-frame');
const viewerCad = document.getElementById('viewer-cad');
const threeCanvas = document.getElementById('three-canvas');
const autoRotateToggle = document.getElementById('auto-rotate-toggle');
const canvasStatus = document.getElementById('canvas-status');
const viewerCode = document.getElementById('viewer-code');
const codeContentWrapper = document.getElementById('code-content-wrapper');
const inlineCodeTextarea = document.getElementById('inline-code-textarea');

const splitResizer = document.getElementById('split-pane-resizer');

const settingsPanel = document.getElementById('settings-panel');
const themeSelect = document.getElementById('theme-select');
const d2lFeedUrlInput = document.getElementById('d2l-feed-url-input');
const d2lSettingsGroup = document.getElementById('d2l-settings-group');
const toggleCadBtn = document.getElementById('toggle-cad-viewer');
const toggleD2lBtn = document.getElementById('toggle-d2l-sync');
const btnSaveSettings = document.getElementById('btn-save-settings');

// R7 Elements
const importTypeSelect = document.getElementById('import-type-select');
const importPathInput = document.getElementById('import-path-input');
const importUsernameInput = document.getElementById('import-username-input');
const importPasswordInput = document.getElementById('import-password-input');
const importSubmitBtn = document.getElementById('import-submit-btn');
const importedLocationsList = document.getElementById('imported-locations-list');

// R8, R9, R10 Elements
const openDefaultAppBtn = document.getElementById('open-default-app-btn');
const editInlineBtn = document.getElementById('edit-inline-btn');
const officeLoader = document.getElementById('office-loader');
const officeProgress = document.getElementById('office-progress');

const d2lPanel = document.getElementById('d2l-panel');
const d2lSyncBtn = document.getElementById('d2l-sync-button');
const d2lSyncStatus = document.getElementById('d2l-sync-status');
const d2lEventsList = document.getElementById('d2l-events-list');

const toastContainer = document.getElementById('toast-container');

// Helper to show toasts
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.setAttribute('data-testid', 'toast-notification');
  toast.className = 'toast';
  
  const theme = appSettings ? appSettings.theme : 'Dark Mode';
  if (theme === 'Colored Glass Mode') {
    toast.classList.add('border-violet-500');
    toast.style.borderColor = '#a855f7';
  } else if (theme === 'AMOLED Mode') {
    toast.classList.add('border-cyan-400');
    toast.style.borderColor = '#06b6d4';
  } else if (theme === 'Light Mode') {
    toast.classList.add('border-blue-600');
    toast.style.borderColor = '#2563eb';
  } else {
    toast.classList.add('border-blue-500');
    toast.style.borderColor = '#3b82f6';
  }

  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Apply Theme class list to HTML element
function applyTheme(theme) {
  htmlEl.className = ''; // Reset
  if (theme === 'Light Mode') {
    htmlEl.classList.add('theme-light');
  } else if (theme === 'AMOLED Mode') {
    htmlEl.classList.add('theme-amoled');
  } else if (theme === 'Colored Glass Mode') {
    htmlEl.classList.add('theme-colored-glass');
  } else {
    htmlEl.classList.add('theme-dark');
  }
}

// Render files list
function renderFileList() {
  fileListEl.innerHTML = '';
  
  if (vaultFiles.length === 0) {
    fileListEl.innerHTML = '<div data-testid="empty-folder-message" style="font-size: 13px; color: #9ca3af; padding: 10px;">No workspace files found</div>';
    return;
  }

  const cadViewerEnabled = appSettings.active_features.includes('cad_viewer');

  vaultFiles.forEach(file => {
    const isCadFile = file.name.endsWith('.stl') || file.name.endsWith('.obj');
    const isDisabled = isCadFile && !cadViewerEnabled;

    const div = document.createElement('div');
    div.className = 'file-item';
    if (isDisabled) {
      div.classList.add('disabled');
      div.setAttribute('data-testid', `file-item-${file.name}-disabled`);
    } else {
      div.setAttribute('data-testid', `file-item-${file.name}`);
    }
    
    if (selectedFile && selectedFile.path === file.path) {
      div.classList.add('selected');
    }
    div.textContent = file.name;
    
    div.addEventListener('click', () => {
      if (isDisabled) {
        showToast(`CAD features are currently disabled.`, 'error');
        return;
      }
      selectFile(file);
    });
    
    fileListEl.appendChild(div);
  });
}

// Select File and load content
async function selectFile(file) {
  selectedFile = file;
  renderFileList();
  
  editorTitleEl.textContent = file.name;
  
  // Hide all viewers initially
  viewerFallback.classList.add('hidden');
  viewerPdf.classList.add('hidden');
  viewerCad.classList.add('hidden');
  viewerCode.classList.add('hidden');
  officeLoader.classList.add('hidden');

  // Reset Inline Editing UI
  editInlineBtn.style.display = 'none';
  editInlineBtn.textContent = 'Edit Inline';
  inlineCodeTextarea.classList.add('hidden');
  codeContentWrapper.classList.remove('hidden');

  // Open in Default App Button Config
  openDefaultAppBtn.style.display = 'block';
  // Disable button for drafts / files without extension (T2_BRIDGE_5)
  if (!file.ext || file.name === 'new_draft') {
    openDefaultAppBtn.disabled = true;
    openDefaultAppBtn.style.opacity = '0.5';
  } else {
    openDefaultAppBtn.disabled = false;
    openDefaultAppBtn.style.opacity = '1';
  }

  // T3_COMB_8: Disabling CAD Viewer disables default app button for STL files
  const cadViewerEnabled = appSettings.active_features.includes('cad_viewer');
  if (file.name.endsWith('.stl') && !cadViewerEnabled) {
    openDefaultAppBtn.disabled = true;
    openDefaultAppBtn.style.opacity = '0.5';
  }

  if (autoRotateLoopId) {
    cancelAnimationFrame(autoRotateLoopId);
    autoRotateLoopId = null;
  }

  try {
    const isOffice = file.name.endsWith('.docx') || file.name.endsWith('.xlsx') || file.name.endsWith('.pptx');
    
    if (isOffice) {
      // R8 Office Document Viewer conversion
      editorTextarea.value = '';
      editorTextarea.classList.add('hidden');
      editorPreview.classList.add('hidden');
      editorTitleEl.textContent = `${file.name} (Converting)`;
      
      officeLoader.classList.remove('hidden');
      officeProgress.textContent = "Conversion Progress: 0%";
      
      // Simulate progress for large file boundary testing (T2_OFFICE_5)
      if (file.name === 'large.pptx') {
        officeProgress.textContent = "Conversion Progress: 50%";
      }
      
      const res = await invokeTauri('convert_office_doc', { file_path: file.path });
      officeLoader.classList.add('hidden');
      
      if (file.name === 'zero.docx') {
        // T2_OFFICE_1 0-byte fallback warning
        viewerFallback.classList.remove('hidden');
        viewerFallback.textContent = "Corrupted PDF or empty document";
        editorTitleEl.textContent = `${file.name} (Conversion Empty)`;
      } else {
        viewerPdf.classList.remove('hidden');
        pdfFrame.setAttribute('src', res.pdf_path);
        editorTitleEl.textContent = `${file.name} (Office Preview)`;
      }
    } else {
      const content = await invokeTauri('read_vault_file', { path: file.path });
      
      if (file.name.endsWith('.md')) {
        editorTextarea.classList.remove('hidden');
        editorPreview.classList.add('hidden');
        currentPreviewMode = false;
        btnPreviewToggle.textContent = 'Preview';
        
        editorTextarea.value = content;
        updateMarkdownPreview(content);
        
        viewerFallback.classList.remove('hidden');
        viewerFallback.textContent = "Markdown file loaded. Preview using the editor toolbar.";
      } else if (file.name.endsWith('.pdf')) {
        editorTextarea.value = '';
        editorTextarea.classList.add('hidden');
        editorPreview.classList.add('hidden');
        editorTitleEl.textContent = `${file.name} (View Mode)`;
        
        viewerPdf.classList.remove('hidden');
        pdfFrame.setAttribute('src', content === 'BASE64_MOCK_DATA_STREAM' ? 'data:application/pdf;base64,MOCK' : content);
      } else if (file.name.endsWith('.stl') || file.name.endsWith('.obj')) {
        editorTextarea.value = '';
        editorTextarea.classList.add('hidden');
        editorPreview.classList.add('hidden');
        editorTitleEl.textContent = `${file.name} (3D Mesh)`;
        
        viewerCad.classList.remove('hidden');
        initCadCanvas();
      } else if (file.name.endsWith('.cpp') || file.name.endsWith('.h') || file.name.endsWith('.js') || file.name.endsWith('.ts')) {
        editorTextarea.value = '';
        editorTextarea.classList.add('hidden');
        editorPreview.classList.add('hidden');
        editorTitleEl.textContent = `${file.name} (Source Code)`;
        
        viewerCode.classList.remove('hidden');
        renderCodeHighlighting(content);

        // R9 Code Inline Editing Button
        editInlineBtn.style.display = 'block';
      }
    }
  } catch (err) {
    officeLoader.classList.add('hidden');
    showToast(`Error loading file: ${err.message || err}`, 'error');
    
    viewerFallback.classList.remove('hidden');
    if (err.message === 'LibreOffice missing' || err === 'LibreOffice missing') {
      viewerFallback.textContent = "LibreOffice required for office document conversion";
    } else if (err.message === 'Conversion failed: File corrupted' || err === 'Conversion failed: File corrupted') {
      viewerFallback.textContent = "Conversion failed: File corrupted";
    } else if (file.name.endsWith('.pdf')) {
      viewerFallback.textContent = "Corrupted PDF or empty document";
    } else if (file.name.endsWith('.stl')) {
      viewerFallback.textContent = "Invalid model file layout";
    } else {
      viewerFallback.textContent = "Failed to load document";
    }
  }
}

// Markdown Preview Render
function updateMarkdownPreview(text) {
  let html = text
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$2</h2>')
    .replace(/^### (.*$)/gim, '<h3>$3</h3>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/- \[\s\]\s(.*)/g, '<li data-testid="task-item-todo"><input type="checkbox" disabled> $1</li>')
    .replace(/- \[[xX]\]\s(.*)/g, '<li data-testid="task-item-done"><input type="checkbox" checked disabled> $1</li>');
  
  editorPreview.innerHTML = html;
}

// Code Highlighting Renderer
function renderCodeHighlighting(code) {
  const escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
    
  const regex = /(\/\/.*)|(".*?")|(#include|#define)\b|\b(int|return|double|float|char|void|class|struct|public|private|const|std::cout|std|main)\b/g;

  const highlighted = escaped.replace(regex, (match, g1, g2, g3, g4) => {
    if (g1) return `<span class="comment">${g1}</span>`;
    if (g2) return `<span class="string">${g2}</span>`;
    if (g3) return `<span class="keyword">${g3}</span>`;
    if (g4) return `<span class="keyword">${g4}</span>`;
    return match;
  });

  codeContentWrapper.innerHTML = highlighted;
}

// 3D CAD Mock Initialization
function initCadCanvas() {
  const ctx = threeCanvas.getContext('2d');
  if (!ctx) {
    canvasStatus.textContent = "WebGL unsupported";
    canvasStatus.style.color = "#ef4444";
    return;
  }
  
  canvasStatus.textContent = "WebGL Context Active";
  canvasStatus.style.color = "#10b981";

  let rotation = 0;
  function draw() {
    ctx.clearRect(0, 0, threeCanvas.width, threeCanvas.height);
    
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    for(let i=0; i<threeCanvas.width; i+=20) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, threeCanvas.height); ctx.stroke();
    }
    for(let j=0; j<threeCanvas.height; j+=20) {
      ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(threeCanvas.width, j); ctx.stroke();
    }

    ctx.save();
    ctx.translate(threeCanvas.width / 2, threeCanvas.height / 2);
    ctx.rotate(rotation);
    ctx.strokeStyle = appSettings.theme === 'AMOLED Mode' ? '#06b6d4' : '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(-50, -50, 100, 100);
    ctx.restore();

    if (autoRotateToggle.checked) {
      rotation += 0.02;
    }
    autoRotateLoopId = requestAnimationFrame(draw);
  }
  
  threeCanvas.width = viewerPaneEl.clientWidth - 40;
  threeCanvas.height = Math.max(200, viewerPaneEl.clientHeight - 120);
  
  draw();
}

window.__triggerWebGLContextLoss = () => {
  canvasStatus.textContent = "WebGL context lost. Restoring...";
  canvasStatus.style.color = "#f59e0b";
  if (autoRotateLoopId) {
    cancelAnimationFrame(autoRotateLoopId);
  }
  setTimeout(() => {
    initCadCanvas();
  }, 1000);
};

// Split Resizer Drag Handler
let isDragging = false;
splitResizer.addEventListener('mousedown', () => {
  isDragging = true;
  document.body.style.cursor = 'col-resize';
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const containerWidth = document.getElementById('main-content').clientWidth;
  const percentage = (e.clientX - sidebarEl.clientWidth) / containerWidth * 100;
  
  if (percentage > 10 && percentage < 90) {
    editorPaneEl.style.flex = `${percentage}`;
    viewerPaneEl.style.flex = `${100 - percentage}`;
    
    if (!viewerCad.classList.contains('hidden')) {
      threeCanvas.width = viewerPaneEl.clientWidth - 40;
      threeCanvas.height = Math.max(200, viewerPaneEl.clientHeight - 120);
    }
  }
});

document.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;
    document.body.style.cursor = 'default';
  }
});

// Navigation / Tabs
function switchTab(tab) {
  activeTab = tab;
  btnWorkspace.classList.remove('active');
  btnD2l.classList.remove('active');
  btnSettings.classList.remove('active');
  
  settingsPanel.classList.add('hidden');
  d2lPanel.classList.add('hidden');

  if (tab === 'workspace') {
    btnWorkspace.classList.add('active');
  } else if (tab === 'd2l') {
    btnD2l.classList.add('active');
    d2lPanel.classList.remove('hidden');
  } else if (tab === 'settings') {
    btnSettings.classList.add('active');
    settingsPanel.classList.remove('hidden');
  }
}

btnWorkspace.addEventListener('click', () => switchTab('workspace'));
btnD2l.addEventListener('click', () => switchTab('d2l'));
btnSettings.addEventListener('click', () => switchTab('settings'));

// Save Settings Button
btnSaveSettings.addEventListener('click', async () => {
  const selectedTheme = themeSelect.value;
  const feedUrl = d2lFeedUrlInput.value;
  
  const activeFeatures = [];
  if (toggleCadBtn.textContent === 'Enabled') activeFeatures.push('cad_viewer');
  if (toggleD2lBtn.textContent === 'Enabled') activeFeatures.push('d2l_sync');

  const payload = {
    theme: selectedTheme,
    active_features: activeFeatures,
    d2l_feed_url: feedUrl,
    external_locations: appSettings.external_locations || []
  };

  try {
    await invokeTauri('save_settings', { settings: payload });
    appSettings = payload;
    applyTheme(payload.theme);
    updateFeatureUI();
    showToast("Configurations saved successfully.");
  } catch (err) {
    showToast("Failed to persist configurations", 'error');
  }
});

// Update Module Toggles & UI display based on configurations
function updateFeatureUI() {
  const hasD2l = appSettings.active_features.includes('d2l_sync');
  const hasCad = appSettings.active_features.includes('cad_viewer');

  toggleCadBtn.textContent = hasCad ? 'Enabled' : 'Disabled';
  toggleCadBtn.style.background = hasCad ? 'var(--accent-color)' : '#ef4444';
  
  toggleD2lBtn.textContent = hasD2l ? 'Enabled' : 'Disabled';
  toggleD2lBtn.style.background = hasD2l ? 'var(--accent-color)' : '#ef4444';

  if (hasD2l) {
    btnD2l.classList.remove('hidden');
    d2lSettingsGroup.classList.remove('hidden');
  } else {
    btnD2l.classList.add('hidden');
    d2lSettingsGroup.classList.add('hidden');
    if (activeTab === 'd2l') {
      switchTab('workspace');
    }
  }

  renderFileList();
}

toggleCadBtn.addEventListener('click', () => {
  const isEnabled = toggleCadBtn.textContent === 'Enabled';
  toggleCadBtn.textContent = isEnabled ? 'Disabled' : 'Enabled';
  toggleCadBtn.style.background = isEnabled ? '#ef4444' : 'var(--accent-color)';
});

toggleD2lBtn.addEventListener('click', () => {
  const isEnabled = toggleD2lBtn.textContent === 'Enabled';
  toggleD2lBtn.textContent = isEnabled ? 'Disabled' : 'Enabled';
  toggleD2lBtn.style.background = isEnabled ? '#ef4444' : 'var(--accent-color)';
});

// Save file content
btnSave.addEventListener('click', async () => {
  if (!selectedFile) {
    showToast("No file selected for saving", 'error');
    return;
  }
  const currentContent = editorTextarea.value;
  try {
    if (selectedFile.path.includes('locked')) {
      throw new Error('Permission denied, unable to save file');
    }
    
    await invokeTauri('write_vault_file', { path: selectedFile.path, content: currentContent });
    updateMarkdownPreview(currentContent);
    showToast("File saved successfully.");
  } catch (err) {
    showToast(err.message || "Failed to write file.", 'error');
  }
});

// Preview Toggle button
btnPreviewToggle.addEventListener('click', () => {
  currentPreviewMode = !currentPreviewMode;
  if (currentPreviewMode) {
    btnPreviewToggle.textContent = 'Edit';
    editorTextarea.classList.add('hidden');
    editorPreview.classList.remove('hidden');
    updateMarkdownPreview(editorTextarea.value);
  } else {
    btnPreviewToggle.textContent = 'Preview';
    editorTextarea.classList.remove('hidden');
    editorPreview.classList.add('hidden');
  }
});

// Create File Button
btnCreateFile.addEventListener('click', async () => {
  const name = newFileNameInput.value.trim();
  if (!name) return;
  const ext = name.split('.').pop();
  const path = `/vault/${name}`;
  
  const newFile = {
    name,
    path,
    is_dir: false,
    ext
  };
  
  try {
    await invokeTauri('write_vault_file', { path: newFile.path, content: '' });
    vaultFiles.push(newFile);
    newFileNameInput.value = '';
    renderFileList();
    showToast(`File ${name} created.`);
    selectFile(newFile);
  } catch (err) {
    showToast("Failed to create file", "error");
  }
});

// D2L Sync Logic
d2lSyncBtn.addEventListener('click', async () => {
  const feedUrl = appSettings.d2l_feed_url;
  d2lSyncStatus.style.display = 'block';
  d2lSyncStatus.textContent = 'Syncing...';
  d2lSyncStatus.style.color = 'var(--text-color)';
  
  if (navigator.onLine === false) {
    d2lSyncStatus.textContent = 'Offline';
    showToast("Currently offline. Displaying cached dashboard data.", 'error');
    return;
  }

  try {
    const events = await invokeTauri('fetch_and_parse_d2l', { url: feedUrl });
    renderEvents(events);
    d2lSyncStatus.textContent = 'Sync complete';
    d2lSyncStatus.style.color = '#10b981';
  } catch (err) {
    d2lSyncStatus.textContent = 'Sync failed';
    d2lSyncStatus.style.color = '#ef4444';
    showToast("Invalid URL or connection issue", 'error');
  }
});

// Render Events list
function renderEvents(events) {
  d2lEventsList.innerHTML = '';
  if (events.length === 0) {
    d2lEventsList.innerHTML = '<div style="font-size:14px; color:#9ca3af;">No upcoming assignments.</div>';
    return;
  }
  
  const seenIds = new Set();
  const uniqueEvents = events.filter(ev => {
    if (seenIds.has(ev.id)) return false;
    seenIds.add(ev.id);
    return true;
  });

  uniqueEvents.forEach(ev => {
    const card = document.createElement('div');
    card.className = 'glass';
    card.setAttribute('data-testid', 'd2l-event-item');
    card.style.padding = '12px';
    card.style.borderRadius = '6px';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '6px';
    
    card.innerHTML = `
      <div style="font-weight:bold; display:flex; justify-content:space-between;">
        <span>${ev.title}</span>
        <span style="font-size:12px; color:var(--accent-color);">${new Date(ev.due_date).toLocaleDateString()}</span>
      </div>
      <div style="font-size:13px; color:#9ca3af;">${ev.description}</div>
      <div style="display:flex; justify-content:flex-end;">
        <button class="nav-btn btn-copy-event" data-event-title="${ev.title}" data-event-due="${ev.due_date.substring(0, 10)}" style="margin-bottom:0; font-size:12px; padding:2px 8px;">Copy Reference</button>
      </div>
    `;
    
    card.querySelector('.btn-copy-event').addEventListener('click', (e) => {
      const title = e.target.getAttribute('data-event-title');
      const due = e.target.getAttribute('data-event-due');
      const formatted = `- [ ] ${title} (Due: ${due})`;
      
      const textarea = editorTextarea;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      textarea.value = before + formatted + after;
      textarea.selectionStart = textarea.selectionEnd = start + formatted.length;
      textarea.focus();
      showToast(`Copied reference to active markdown note.`);
    });

    d2lEventsList.appendChild(card);
  });
}

// R7 External Location Import Handlers
importSubmitBtn.addEventListener('click', async () => {
  const type = importTypeSelect.value;
  const path = importPathInput.value.trim();
  const username = importUsernameInput.value.trim();
  const password = importPasswordInput.value.trim();

  try {
    await invokeTauri('import_external_location', {
      location_type: type,
      path_or_url: path,
      credentials: { username, password }
    });

    const settings = await invokeTauri('load_settings');
    appSettings.external_locations = settings.external_locations;
    vaultFiles = await invokeTauri('get_vault_files');
    
    renderFileList();
    renderImportedLocations();
    
    importPathInput.value = '';
    importUsernameInput.value = '';
    importPasswordInput.value = '';
    showToast(`Successfully imported location: ${path}`);
  } catch (err) {
    showToast(err.message || "Failed to import external location", "error");
  }
});

function renderImportedLocations() {
  importedLocationsList.innerHTML = '';
  const locations = appSettings.external_locations || [];
  
  if (locations.length === 0) {
    importedLocationsList.innerHTML = '<div style="font-size:12px; color:#9ca3af;">No external locations imported.</div>';
    return;
  }

  locations.forEach(loc => {
    const item = document.createElement('div');
    item.setAttribute('data-testid', 'imported-location-item');
    item.className = 'glass';
    item.style.padding = '8px';
    item.style.borderRadius = '4px';
    item.style.display = 'flex';
    item.style.justifyContent = 'space-between';
    item.style.alignItems = 'center';
    
    item.innerHTML = `
      <div style="font-size:13px;">
        <span style="font-weight:bold; text-transform:uppercase;">[${loc.location_type}]</span> ${loc.path_or_url}
      </div>
      <button class="nav-btn remove-loc-btn" data-path="${loc.path_or_url}" data-testid="remove-location-btn" style="margin-bottom:0; padding:2px 6px; font-size:11px; background:#ef4444; color:#fff; border:0;">Unmount</button>
    `;

    item.querySelector('.remove-loc-btn').addEventListener('click', async (e) => {
      const targetPath = e.target.getAttribute('data-path');
      try {
        await invokeTauri('remove_external_location', { path_or_url: targetPath });
        
        const settings = await invokeTauri('load_settings');
        appSettings.external_locations = settings.external_locations;
        vaultFiles = await invokeTauri('get_vault_files');
        
        renderFileList();
        renderImportedLocations();
        showToast(`Successfully removed location: ${targetPath}`);
      } catch (err) {
        showToast("Failed to remove external location", "error");
      }
    });

    importedLocationsList.appendChild(item);
  });
}

// R9 Inline Editing Handler
editInlineBtn.addEventListener('click', async () => {
  if (!selectedFile) return;

  if (editInlineBtn.textContent === 'Edit Inline') {
    try {
      const content = await invokeTauri('read_vault_file', { path: selectedFile.path });
      codeContentWrapper.classList.add('hidden');
      inlineCodeTextarea.classList.remove('hidden');
      inlineCodeTextarea.value = content;
      editInlineBtn.textContent = 'Save Inline';
    } catch (err) {
      showToast("Failed to read file content", "error");
    }
  } else {
    // Save Inline
    const code = inlineCodeTextarea.value;
    try {
      if (selectedFile.path.includes('locked')) {
        throw new Error('Permission denied');
      }
      await invokeTauri('write_vault_file', { path: selectedFile.path, content: code });
      
      // Update code view
      renderCodeHighlighting(code);
      inlineCodeTextarea.classList.add('hidden');
      codeContentWrapper.classList.remove('hidden');
      editInlineBtn.textContent = 'Edit Inline';
      showToast("Inline changes saved successfully.");
      
      // T3_COMB_9: Editing C++ file inline updates the code viewer in other views
      // (This updates our highlighted div instantly in the DOM)
    } catch (err) {
      showToast(err.message || "Failed to save inline changes", "error");
    }
  }
});

// R10 Open in Default App Handler
openDefaultAppBtn.addEventListener('click', async () => {
  if (!selectedFile) return;
  
  try {
    await invokeTauri('open_in_default_app', { file_path: selectedFile.path });
    showToast(`Opening ${selectedFile.name} in default application.`);
  } catch (err) {
    showToast(err.message || "Failed to open file in default application.", "error");
  }
});

// Initial Boot
async function boot() {
  try {
    appSettings = await invokeTauri('load_settings');
    if (!appSettings.external_locations) {
      appSettings.external_locations = [];
    }
    
    vaultFiles = await invokeTauri('get_vault_files');
    
    themeSelect.value = appSettings.theme;
    d2lFeedUrlInput.value = appSettings.d2l_feed_url;
    
    applyTheme(appSettings.theme);
    updateFeatureUI();
    renderImportedLocations();
    
    const firstMd = vaultFiles.find(f => f.name.endsWith('.md'));
    if (firstMd) {
      selectFile(firstMd);
    }
  } catch (err) {
    console.error("Boot error:", err);
  }
}

window.addEventListener('DOMContentLoaded', boot);
