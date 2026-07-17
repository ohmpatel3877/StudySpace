import React, { createContext, useContext, useState, useEffect } from 'react';

export interface FileObject {
  name: string;
  path: string;
  is_dir: boolean;
  ext: string;
}

export interface AppSettings {
  theme: string;
  active_features: string[];
  d2l_feed_url: string;
  external_locations: any[];
}

export interface D2LEvent {
  id: string;
  title: string;
  description: string;
  due_date: string;
}

interface AppContextType {
  theme: string;
  setTheme: (theme: string) => void;
  activeFile: FileObject | null;
  setActiveFile: (file: FileObject | null) => void;
  features: string[];
  setFeatures: (features: string[]) => void;
  currentNav: 'notes' | 'd2l' | 'settings';
  setCurrentNav: (nav: 'notes' | 'd2l' | 'settings') => void;
  explorerOpen: boolean;
  setExplorerOpen: (open: boolean) => void;
  vaultFiles: FileObject[];
  refreshVaultFiles: () => Promise<void>;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<boolean>;
  toast: { message: string; visible: boolean };
  showToast: (message: string) => void;
  hideToast: () => void;
  d2lEvents: D2LEvent[];
  setD2lEvents: React.Dispatch<React.SetStateAction<D2LEvent[]>>;
  syncD2LEvents: () => Promise<void>;
  syncStatus: string;
  setSyncStatus: (status: string) => void;
  editorContent: string;
  setEditorContent: React.Dispatch<React.SetStateAction<string>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Fallback logic for web environment or when Tauri is missing
const handleFallback = async (cmd: string, args?: any): Promise<any> => {
  console.log(`[Tauri Fallback] cmd: ${cmd}`, args);

  // If mock state is available (Playwright tests), use it directly
  // before falling back to localStorage
  const mockState = typeof window !== 'undefined' ? (window as any).__MOCK_STATE__ : null;
  if (mockState) {
    console.log('[Tauri Fallback] Using mock state for cmd:', cmd);
    switch (cmd) {
      case 'load_settings': {
        const s = { ...mockState.settings };
        if (!Array.isArray(s.active_features)) {
          s.active_features = ['d2l_sync', 'cad_viewer'];
        }
        return s;
      }
      case 'save_settings': {
        const settings = args?.settings || args;
        Object.assign(mockState.settings, settings);
        return null;
      }
      case 'get_vault_files':
        return [...mockState.files];
      case 'read_vault_file': {
        const path = args?.path;
        if (path && mockState.contents[path] !== undefined) {
          return mockState.contents[path];
        }
        if (path?.endsWith('.stl') || path?.endsWith('.pdf') || path?.includes('/temp/')) {
          return 'BASE64_MOCK_DATA_STREAM';
        }
        if (path === '/vault/welcome.md') return '# Welcome\nStudySpace is active!';
        if (path === '/vault/homework.md') return '# Homework 1\nPending answers...';
        if (path === '/vault/solver.cpp') return '#include <iostream>\n\nint main() {\n  std::cout << "Hello World";\n  return 0;\n}';
        throw new Error('File not found');
      }
      case 'write_vault_file': {
        const path = args?.path;
        const content = args?.content;
        if (path?.includes('locked') || path?.includes('readonly')) {
          throw new Error('Permission denied');
        }
        mockState.contents[path] = content;
        const filename = path.split('/').pop() || 'file';
        const ext = filename.split('.').pop() || '';
        if (!mockState.files.some((f: any) => f.path === path)) {
          mockState.files.push({ name: filename, path, is_dir: false, ext });
        }
        return null;
      }
      case 'fetch_and_parse_d2l': {
        const url = args?.url || args;
        if (!url || !url.startsWith('http')) {
          throw new Error('Invalid iCal feed URL');
        }
        return [...mockState.events];
      }
      case 'import_external_location': {
        const { location_type, path_or_url, credentials } = args;
        if (location_type === 'webdav' && credentials?.password === 'invalid') {
          throw new Error('Authentication failed');
        }
        if (!path_or_url || path_or_url === '') {
          throw new Error('Malformed path or URL');
        }
        if (path_or_url === '/locked_folder') {
          throw new Error('Permission denied');
        }
        mockState.settings.external_locations.push({ location_type, path_or_url });
        const extName = path_or_url.split('/').pop() || 'ext';
        mockState.files.push({ name: `external_${extName}_note.md`, path: `${path_or_url}/external_${extName}_note.md`, is_dir: false, ext: 'md' });
        mockState.files.push({ name: `external_${extName}_mesh.stl`, path: `${path_or_url}/external_${extName}_mesh.stl`, is_dir: false, ext: 'stl' });
        mockState.contents[`${path_or_url}/external_${extName}_note.md`] = `# External Imported Note\nThis note belongs to ${path_or_url}!`;
        return null;
      }
      case 'remove_external_location': {
        const { path_or_url } = args;
        mockState.settings.external_locations = mockState.settings.external_locations.filter(
          (loc: any) => loc.path_or_url !== path_or_url
        );
        mockState.files = mockState.files.filter((f: any) => !f.path.startsWith(path_or_url));
        return null;
      }
      case 'convert_office_doc': {
        const { file_path } = args;
        if (!mockState.libreOfficeInstalled) {
          throw new Error('LibreOffice missing');
        }
        if (file_path.includes('corrupt.docx')) throw new Error('Conversion failed: File corrupted');
        if (file_path.includes('zero.docx')) return { pdf_path: '/temp/zero.pdf' };
        if (file_path.includes('large.pptx')) return { pdf_path: '/temp/large.pdf' };
        return { pdf_path: '/temp/converted_document.pdf' };
      }
      case 'open_in_default_app': {
        const { file_path } = args;
        if (file_path.includes('missing.md')) throw new Error('File not found');
        if (file_path.includes('no_assoc.md')) throw new Error('No default application associated');
        if (file_path.includes('denied.md')) throw new Error('Access denied');
        return null;
      }
      default:
        throw new Error(`Unhandled fallback command: ${cmd}`);
    }
  }

  switch (cmd) {
    case 'load_settings': {
      try {
        const stored = localStorage.getItem('studyspace_settings');
        if (stored) {
          return JSON.parse(stored);
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
    case 'save_settings': {
      const settings = args?.settings || args;
      localStorage.setItem('studyspace_settings', JSON.stringify(settings));
      return null;
    }
    case 'get_vault_files': {
      const storedFiles = localStorage.getItem('studyspace_vault_files');
      if (storedFiles) {
        return JSON.parse(storedFiles);
      }
      const defaultFiles = [
        { name: 'welcome.md', path: '/vault/welcome.md', is_dir: false, ext: 'md' },
        { name: 'homework.md', path: '/vault/homework.md', is_dir: false, ext: 'md' },
        { name: 'syllabus.pdf', path: '/vault/syllabus.pdf', is_dir: false, ext: 'pdf' },
        { name: 'gear.stl', path: '/vault/gear.stl', is_dir: false, ext: 'stl' },
        { name: 'solver.cpp', path: '/vault/solver.cpp', is_dir: false, ext: 'cpp' },
        { name: 'document.docx', path: '/vault/document.docx', is_dir: false, ext: 'docx' },
        { name: 'spreadsheet.xlsx', path: '/vault/spreadsheet.xlsx', is_dir: false, ext: 'xlsx' },
        { name: 'presentation.pptx', path: '/vault/presentation.pptx', is_dir: false, ext: 'pptx' },
        { name: 'zero.docx', path: '/vault/zero.docx', is_dir: false, ext: 'docx' },
        { name: 'corrupt.docx', path: '/vault/corrupt.docx', is_dir: false, ext: 'docx' },
        { name: 'large.pptx', path: '/vault/large.pptx', is_dir: false, ext: 'pptx' }
      ];
      localStorage.setItem('studyspace_vault_files', JSON.stringify(defaultFiles));
      return defaultFiles;
    }
    case 'read_vault_file': {
      const path = args?.path;
      if (path.endsWith('.stl') || path.endsWith('.pdf') || path.includes('/temp/')) {
        return 'BASE64_MOCK_DATA_STREAM';
      }
      const storedContents = localStorage.getItem('studyspace_file_contents');
      const contents = storedContents ? JSON.parse(storedContents) : {};
      if (contents[path] !== undefined) {
        return contents[path];
      }
      // Defaults
      if (path === '/vault/welcome.md') return '# Welcome\nStudySpace is active!';
      if (path === '/vault/homework.md') return '# Homework 1\nPending answers...';
      if (path === '/vault/solver.cpp') {
        return '#include <iostream>\n\nint main() {\n  std::cout << "Hello World";\n  return 0;\n}';
      }
      throw new Error('File not found');
    }
    case 'write_vault_file': {
      const path = args?.path;
      const content = args?.content;
      if (path === '/vault/locked.md' || path === '/vault/locked.cpp') {
        throw new Error('Permission denied, unable to save file');
      }
      const storedContents = localStorage.getItem('studyspace_file_contents');
      const contents = storedContents ? JSON.parse(storedContents) : {};
      contents[path] = content;
      localStorage.setItem('studyspace_file_contents', JSON.stringify(contents));

      // Also register file in files list
      const storedFiles = localStorage.getItem('studyspace_vault_files');
      const files: FileObject[] = storedFiles ? JSON.parse(storedFiles) : [];
      if (!files.some(f => f.path === path)) {
        const filename = path.split('/').pop() || 'file';
        const ext = filename.split('.').pop() || '';
        files.push({ name: filename, path, is_dir: false, ext });
        localStorage.setItem('studyspace_vault_files', JSON.stringify(files));
      }
      return null;
    }
    case 'import_external_location': {
      const { location_type, path_or_url, credentials } = args;
      if (location_type === 'webdav' && credentials?.password === 'invalid') {
        throw new Error('Authentication failed');
      }
      if (!path_or_url || path_or_url === '') {
        throw new Error('Malformed path or URL');
      }
      if (path_or_url === '/locked_folder') {
        throw new Error('Permission denied');
      }
      // Add to external locations list in settings
      const settingsStr = localStorage.getItem('studyspace_settings');
      const currentSettings = settingsStr ? JSON.parse(settingsStr) : {};
      if (!currentSettings.external_locations) currentSettings.external_locations = [];
      currentSettings.external_locations.push({ location_type, path_or_url });
      localStorage.setItem('studyspace_settings', JSON.stringify(currentSettings));

      // Add virtual files
      const storedFiles = localStorage.getItem('studyspace_vault_files');
      const files: FileObject[] = storedFiles ? JSON.parse(storedFiles) : [];
      const extName = path_or_url.split('/').pop() || 'ext';
      
      const file1 = {
        name: `external_${extName}_note.md`,
        path: `${path_or_url}/external_${extName}_note.md`,
        is_dir: false,
        ext: 'md'
      };
      const file2 = {
        name: `external_${extName}_mesh.stl`,
        path: `${path_or_url}/external_${extName}_mesh.stl`,
        is_dir: false,
        ext: 'stl'
      };
      
      if (!files.some(f => f.path === file1.path)) files.push(file1);
      if (!files.some(f => f.path === file2.path)) files.push(file2);
      localStorage.setItem('studyspace_vault_files', JSON.stringify(files));

      const storedContents = localStorage.getItem('studyspace_file_contents');
      const contents = storedContents ? JSON.parse(storedContents) : {};
      contents[file1.path] = `# External Imported Note\nThis note belongs to ${path_or_url}!`;
      localStorage.setItem('studyspace_file_contents', JSON.stringify(contents));

      return null;
    }
    case 'remove_external_location': {
      const { path_or_url } = args;
      const settingsStr = localStorage.getItem('studyspace_settings');
      const currentSettings = settingsStr ? JSON.parse(settingsStr) : {};
      if (currentSettings.external_locations) {
        currentSettings.external_locations = currentSettings.external_locations.filter(
          (loc: any) => loc.path_or_url !== path_or_url
        );
      }
      localStorage.setItem('studyspace_settings', JSON.stringify(currentSettings));

      // Remove virtual files
      const storedFiles = localStorage.getItem('studyspace_vault_files');
      let files: FileObject[] = storedFiles ? JSON.parse(storedFiles) : [];
      files = files.filter(f => !f.path.startsWith(path_or_url));
      localStorage.setItem('studyspace_vault_files', JSON.stringify(files));

      return null;
    }
    case 'convert_office_doc': {
      const { file_path } = args;
      // Mock LibreOffice check from localStorage (or defaults to installed)
      const isLibreOfficeInstalled = localStorage.getItem('studyspace_libreoffice_installed') !== 'false';
      if (!isLibreOfficeInstalled) {
        throw new Error('LibreOffice missing');
      }
      if (file_path.includes('corrupt.docx')) {
        throw new Error('Conversion failed: File corrupted');
      }
      if (file_path.includes('zero.docx')) {
        return { pdf_path: '/temp/zero.pdf' };
      }
      if (file_path.includes('large.pptx')) {
        return { pdf_path: '/temp/large.pdf' };
      }
      return { pdf_path: '/temp/converted_document.pdf' };
    }
    case 'open_in_default_app': {
      const { file_path } = args;
      if (file_path.includes('missing.md')) {
        throw new Error('File not found');
      }
      if (file_path.includes('no_assoc.md')) {
        throw new Error('No default application associated');
      }
      if (file_path.includes('denied.md')) {
        throw new Error('Access denied');
      }
      return null;
    }
    default:
      throw new Error(`Unhandled fallback command: ${cmd}`);
  }
};

export const safeInvoke = (cmd: string, args: any = {}): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && (window as any).__TAURI_IPC__) {
      const callbackName = 'tauri_cb_' + Math.random().toString(36).substring(2, 15);
      const errorName = 'tauri_err_' + Math.random().toString(36).substring(2, 15);

      (window as any)[callbackName] = (res: any) => {
        delete (window as any)[callbackName];
        delete (window as any)[errorName];
        resolve(res);
      };

      (window as any)[errorName] = (err: any) => {
        delete (window as any)[callbackName];
        delete (window as any)[errorName];
        reject(new Error(err));
      };

      try {
        (window as any).__TAURI_IPC__({
          cmd,
          callback: callbackName,
          error: errorName,
          cmd_args: args,
          ...args
        });
      } catch (e) {
        delete (window as any)[callbackName];
        delete (window as any)[errorName];
        reject(e);
      }
    } else {
      handleFallback(cmd, args).then(resolve).catch(reject);
    }
  });
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<string>('Dark Mode');
  const [activeFile, setActiveFile] = useState<FileObject | null>(null);
  const [features, setFeatures] = useState<string[]>(['d2l_sync', 'cad_viewer']);
  const [currentNav, setCurrentNav] = useState<'notes' | 'd2l' | 'settings'>('notes');
  const [explorerOpen, setExplorerOpen] = useState<boolean>(true);
  const [vaultFiles, setVaultFiles] = useState<FileObject[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'Dark Mode',
    active_features: ['d2l_sync', 'cad_viewer'],
    d2l_feed_url: 'https://d2l.myuniversity.edu/feed.ics',
    external_locations: []
  });
  const [d2lEvents, setD2lEvents] = useState<D2LEvent[]>([]);
  const [syncStatus, setSyncStatus] = useState<string>('Idle');
  const [editorContent, setEditorContent] = useState<string>('');

  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: '',
    visible: false
  });

  const showToast = (message: string) => {
    setToast({ message, visible: true });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  // Toast auto-hide
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        hideToast();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible, toast.message]);

  const mapThemeToClass = (t: string) => {
    switch (t) {
      case 'Light Mode': return 'theme-light';
      case 'AMOLED Mode': return 'theme-amoled';
      case 'Colored Glass Mode': return 'theme-colored-glass';
      default: return 'theme-dark';
    }
  };

  const setTheme = (t: string) => {
    setThemeState(t);
    document.documentElement.className = mapThemeToClass(t);
  };

  const refreshVaultFiles = async () => {
    try {
      const files = await safeInvoke('get_vault_files');
      setVaultFiles(files || []);
    } catch (e) {
      console.error('Failed to get vault files', e);
    }
  };

  // Initial load
  useEffect(() => {
    const init = async () => {
      let loadedSettings: AppSettings;
      try {
        loadedSettings = await safeInvoke('load_settings');
        if (!loadedSettings || typeof loadedSettings !== 'object' || !loadedSettings.theme) {
          throw new Error('Invalid settings loaded');
        }
      } catch (e) {
        console.warn('Failed to load settings, using defaults', e);
        loadedSettings = {
          theme: 'Dark Mode',
          active_features: ['d2l_sync', 'cad_viewer'],
          d2l_feed_url: 'https://d2l.myuniversity.edu/feed.ics',
          external_locations: []
        };
      }

      // Handle corrupted settings active_features check
      let activeFeatures = loadedSettings.active_features;
      if (!Array.isArray(activeFeatures)) {
        activeFeatures = ['d2l_sync', 'cad_viewer'];
      }
      
      const themeVal = loadedSettings.theme || 'Dark Mode';
      setTheme(themeVal);
      setFeatures(activeFeatures);
      setSettings({
        theme: themeVal,
        active_features: activeFeatures,
        d2l_feed_url: loadedSettings.d2l_feed_url || 'https://d2l.myuniversity.edu/feed.ics',
        external_locations: loadedSettings.external_locations || []
      });

      await refreshVaultFiles();
    };

    init();
  }, []);

  const updateSettings = async (newSettings: Partial<AppSettings>): Promise<boolean> => {
    const updated = {
      ...settings,
      ...newSettings
    };
    
    // Validate / prevent issues if corrupt
    if (!Array.isArray(updated.active_features)) {
      updated.active_features = ['d2l_sync', 'cad_viewer'];
    }

    try {
      await safeInvoke('save_settings', { settings: updated });
      setSettings(updated);
      if (newSettings.theme) {
        setTheme(newSettings.theme);
      }
      if (newSettings.active_features) {
        setFeatures(newSettings.active_features);
      }
      return true;
    } catch (e: any) {
      console.error('Failed to save settings', e);
      showToast('Failed to persist configurations');
      return false;
    }
  };

  const syncD2LEvents = async () => {
    if (!navigator.onLine) {
      setSyncStatus('Offline');
      showToast('Currently offline. Displaying cached dashboard data.');
      return;
    }
    
    setSyncStatus('Syncing');
    try {
      const events = await safeInvoke('fetch_and_parse_d2l', { url: settings.d2l_feed_url });
      setD2lEvents(events || []);
      setSyncStatus('Success');
    } catch (e: any) {
      console.error('Failed to sync D2L events', e);
      setSyncStatus('Sync failed');
      showToast('Invalid URL or connection issue');
    }
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        activeFile,
        setActiveFile,
        features,
        setFeatures,
        currentNav,
        setCurrentNav,
        explorerOpen,
        setExplorerOpen,
        vaultFiles,
        refreshVaultFiles,
        settings,
        updateSettings,
        toast,
        showToast,
        hideToast,
        d2lEvents,
        setD2lEvents,
        syncD2LEvents,
        syncStatus,
        setSyncStatus,
        editorContent,
        setEditorContent
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
