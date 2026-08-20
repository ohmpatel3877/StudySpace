import React, { createContext, useContext, useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

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
  currentNav: 'notes' | 'd2l' | 'settings' | 'graph';
  setCurrentNav: (nav: 'notes' | 'd2l' | 'settings' | 'graph') => void;
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

/**
 * Detects a live Tauri 2 backend.
 *
 * Tauri 2 exposes `window.__TAURI_INTERNALS__.invoke`. The previous
 * implementation probed `window.__TAURI_IPC__` — the Tauri *1* global, which
 * does not exist in Tauri 2 (verified: the string appears nowhere in
 * @tauri-apps/api@2). That guard was therefore always falsy in the packaged
 * desktop app, so every command silently fell through to the localStorage
 * fallback and the Rust backend was never reached. See AUDIT.md Finding 2.
 */
const hasTauriBackend = (): boolean =>
  typeof window !== 'undefined' &&
  typeof (window as any).__TAURI_INTERNALS__?.invoke === 'function';

/** Thrown when a command is issued with no Tauri backend behind it. */
export class NoBackendError extends Error {
  constructor(cmd: string) {
    super(
      `StudySpace has no backend. Command "${cmd}" cannot run. ` +
        `Launch the desktop app with \`npx tauri dev\` — the browser-only dev ` +
        `server has no Rust backend to talk to.`
    );
    this.name = 'NoBackendError';
  }
}

export const safeInvoke = async (cmd: string, args: any = {}): Promise<any> => {
  if (!hasTauriBackend()) {
    // Deliberately loud. This used to fall through to ~290 lines of
    // localStorage that reimplemented all 10 commands against fixture data,
    // so the app looked fully functional in a browser and every feature
    // "worked" without the backend ever being reached. That fallback is what
    // let six milestones ship against fiction (AUDIT.md Finding 2, Finding 5).
    // Failing here is the point: absent a backend, the app must not pretend.
    throw new NoBackendError(cmd);
  }
  return invoke(cmd, args);
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<string>('Dark Mode');
  const [activeFile, setActiveFile] = useState<FileObject | null>(null);
  const [features, setFeatures] = useState<string[]>(['d2l_sync', 'cad_viewer']);
  const [currentNav, setCurrentNav] = useState<'notes' | 'd2l' | 'settings' | 'graph'>('notes');
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
