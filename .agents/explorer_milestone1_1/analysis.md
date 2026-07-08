# StudySpace App Skeleton & Tauri Core Analysis

This document outlines the detailed architectural design and setup strategy for initializing the **StudySpace** desktop application using Tauri, React, Vite, TypeScript, and Tailwind CSS. It also provides the exact configuration templates for both Tauri v1 and v2, and the structural skeleton for the glassmorphic dark UI shell layout.

---

## 1. Workspace & Toolchain Assessment

### Current State
* **Workspace Path**: `C:\Users\ohmpa\OneDrive\Obsidian\Obsidian-Education\StudySpace`
* **Contents**: Only contains the `.agents/` metadata folder and the `PROJECT.md` specification file.
* **Toolchain Check**:
  * **Node.js**: `v25.3.0` (Installed)
  * **npm**: `11.13.0` (Installed)
  * **Rust / Cargo**: `Not recognized in shell PATH`.

### Key Prerequisite Strategy
Before running the Tauri initialization command, the Rust compiler and package manager must be installed and added to the environment variables:
1. **Windows Package Manager**: Run `winget install Rustlang.Rustup` in a PowerShell terminal, or download `rustup-init.exe` directly from [rustup.rs](https://rustup.rs).
2. **Installation Options**: Choose the default installation option (typically MSVC build tools are required on Windows; if missing, Rustup will guide the user to install them via Visual Studio Build Tools).
3. **Verification**: Restart the shell and run:
   ```bash
   rustc --version
   cargo --version
   ```

---

## 2. Initialization & Setup Strategy

We recommend a manual setup process to prevent overwriting existing configuration files like `PROJECT.md`. The manual initialization steps are detailed below.

### Step 2.1: Initialize React + Vite + TypeScript Frontend
Run the following commands in the workspace root directory:
```powershell
# Create the Vite project in the current directory (merging into the root folder)
# Vite will prompt to confirm files are written to an existing folder.
npm create vite@latest . -- --template react-ts
```

### Step 2.2: Install Frontend Dependencies
```powershell
# Install React Core, Router/State helpers (if needed)
npm install

# Install Tailwind CSS and post-css utilities (Tailwind v3 installation method shown)
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install core feature dependencies
npm install three @types/three lucide-react clsx tailwind-merge

# Install optional React wrappers for Three.js (highly recommended for CadViewer.tsx)
npm install @react-three/fiber @react-three/drei
```

### Step 2.3: Install Tauri CLI & Initialize Backend
```powershell
# Install Tauri CLI developer dependency
npm install -D @tauri-apps/cli

# Run the Tauri initialization script
npx tauri init
```
During the prompt:
* **App name**: `studyspace`
* **Window title**: `StudySpace`
* **Frontend asset path**: `../dist` (relative to `src-tauri`)
* **Dev server URL**: `http://localhost:5173`
* **Before dev command**: `npm run dev`
* **Before build command**: `npm run build`

---

## 3. Tauri Configuration & Security Scopes

Tauri restricts frontend access to system resources for security. Below are the exact configuration modifications required to enable `fs` and `http` scopes. We provide configurations for both **Tauri v1** (traditional) and **Tauri v2** (modern stable).

### Option A: Tauri v1 Configuration (`src-tauri/tauri.conf.json`)
For Tauri v1, configure the `allowlist` block inside `tauri.conf.json` as follows:

```json
{
  "build": {
    "beforeBuildCommand": "npm run build",
    "beforeDevCommand": "npm run dev",
    "devPath": "http://localhost:5173",
    "distDir": "../dist"
  },
  "package": {
    "productName": "StudySpace",
    "version": "0.1.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "fs": {
        "all": false,
        "readFile": true,
        "writeFile": true,
        "readDir": true,
        "createDir": true,
        "removeFile": true,
        "scope": [
          "$DOCUMENT/**/*",
          "$DESKTOP/**/*",
          "$APPCONFIG/**/*"
        ]
      },
      "http": {
        "all": false,
        "request": true,
        "scope": [
          "https://*"
        ]
      },
      "shell": {
        "all": false,
        "open": true
      },
      "path": {
        "all": true
      }
    },
    "bundle": {
      "active": true,
      "targets": "all",
      "identifier": "com.studyspace.app",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ]
    },
    "security": {
      "csp": null
    },
    "windows": [
      {
        "fullscreen": false,
        "resizable": true,
        "title": "StudySpace",
        "width": 1280,
        "height": 720,
        "decorations": true,
        "transparent": true
      }
    ]
  }
}
```

### Option B: Tauri v2 Configuration (`src-tauri/tauri.conf.json` + Capabilities)
For Tauri v2, permissions are handled by individual plugins and a central capability profile.

1. **Add dependencies in `src-tauri/Cargo.toml`**:
   ```toml
   [dependencies]
   tauri = { version = "2.0.0", features = [] }
   tauri-plugin-fs = "2.0.0"
   tauri-plugin-http = "2.0.0"
   ```

2. **Initialize plugins in `src-tauri/src/lib.rs` (or `main.rs`)**:
   ```rust
   tauri::Builder::default()
       .plugin(tauri_plugin_fs::init())
       .plugin(tauri_plugin_http::init())
       .run(tauri::generate_context!())
       .expect("error while running tauri application");
   ```

3. **Configure Permissions in `src-tauri/capabilities/default.json`**:
   Create or modify this file to explicitly declare plugin access scopes:
   ```json
   {
     "$schema": "../gen/schemas/capability-schema.json",
     "identifier": "default",
     "description": "Default permissions for StudySpace application features",
     "windows": ["main"],
     "permissions": [
       "core:path:default",
       "core:event:default",
       "core:window:default",
       "fs:allow-read-dir",
       "fs:allow-read-file",
       "fs:allow-write-file",
       "fs:allow-create-dir",
       "fs:allow-remove-file",
       {
         "identifier": "fs:allow-read",
         "rule": {
           "scope": [
             "$DOCUMENT/**/*",
             "$DESKTOP/**/*",
             "$APPCONFIG/**/*"
           ]
         }
       },
       {
         "identifier": "fs:allow-write",
         "rule": {
           "scope": [
             "$DOCUMENT/**/*",
             "$DESKTOP/**/*",
             "$APPCONFIG/**/*"
           ]
         }
       },
       "http:default",
       {
         "identifier": "http:request",
         "rule": {
           "scope": [
             "https://**"
           ]
         }
       }
     ]
   }
   ```

---

## 4. Glassmorphic Dark UI Shell Layout

The glassmorphic design relies on custom utility styling classes, background blur filters, and vibrant underlying ambient glow elements. Here is the structure of the files required to implement the UI layout.

### File 4.1: Tailwind Stylesheet (`src/styles/index.css`)
Tailwind v3 glassmorphism custom classes configured via layers:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  .glass-panel {
    background: rgba(15, 17, 26, 0.45);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  }

  .glass-sidebar {
    background: rgba(10, 12, 18, 0.55);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-right: 1px solid rgba(255, 255, 255, 0.06);
  }

  .glass-input {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 0.375rem;
    color: #f1f5f9;
    outline: none;
    transition: all 0.2s;
  }

  .glass-input:focus {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(99, 102, 241, 0.4);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
  }
}

/* Custom scrollbars matching dark glassmorphism */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.01);
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
```

### File 4.2: Context Provider (`src/context/AppContext.tsx`)
```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'dark' | 'light' | 'amoled' | 'colored-glass';

export interface FeatureToggles {
  d2lSync: boolean;
  cadViewer: boolean;
}

interface AppContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  features: FeatureToggles;
  toggleFeature: (feature: keyof FeatureToggles) => void;
  activeFilePath: string | null;
  setActiveFilePath: (path: string | null) => void;
  activeView: 'editor' | 'd2l' | 'cad' | 'settings';
  setActiveView: (view: 'editor' | 'd2l' | 'cad' | 'settings') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [features, setFeatures] = useState<FeatureToggles>({
    d2lSync: true,
    cadViewer: true,
  });
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'editor' | 'd2l' | 'cad' | 'settings'>('editor');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('theme-dark', 'theme-light', 'theme-amoled', 'theme-colored-glass');
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  const toggleFeature = (feature: keyof FeatureToggles) => {
    setFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature],
    }));
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        features,
        toggleFeature,
        activeFilePath,
        setActiveFilePath,
        activeView,
        setActiveView,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppContextProvider');
  return context;
};
```

### File 4.3: Entry Point (`src/App.tsx`)
```typescript
import React from 'react';
import { AppContextProvider } from './context/AppContext';
import Layout from './components/Layout';
import './styles/index.css';

const App: React.FC = () => {
  return (
    <AppContextProvider>
      {/* Root frame styling and background glow bubbles */}
      <div className="relative w-screen h-screen overflow-hidden bg-[#090b10] text-slate-100 select-none">
        
        {/* Glow Spheres for Glassmorphic Backlighting */}
        <div className="absolute top-[-15%] left-[-15%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-[-15%] right-[-15%] w-[60%] h-[60%] rounded-full bg-purple-500/10 blur-[130px] pointer-events-none" />
        <div className="absolute top-[35%] right-[20%] w-[35%] h-[35%] rounded-full bg-cyan-500/5 blur-[110px] pointer-events-none" />

        {/* Layout Shell */}
        <Layout />
      </div>
    </AppContextProvider>
  );
};

export default App;
```

### File 4.4: Main Shell (`src/components/Layout.tsx`)
```typescript
import React from 'react';
import { useApp } from '../context/AppContext';
import Explorer from './Explorer';
import Editor from './Editor';
import Viewer from './Viewer';
import { 
  FileText, 
  Calendar, 
  Box, 
  Settings as SettingsIcon,
  LayoutGrid
} from 'lucide-react';

const Layout: React.FC = () => {
  const { 
    theme, 
    setTheme, 
    features, 
    activeFilePath, 
    activeView, 
    setActiveView 
  } = useApp();

  return (
    <div className="flex w-screen h-screen overflow-hidden">
      
      {/* 1. LEFT SIDEBAR: Navigation Panel & Vault Explorer */}
      <aside className="w-64 flex flex-col glass-sidebar bg-slate-950/20 z-10">
        
        {/* Header App Brand */}
        <div className="p-4 border-b border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg">
            SS
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wider bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              StudySpace
            </h1>
            <span className="text-[9px] text-indigo-400 font-semibold tracking-widest uppercase">Desktop Core</span>
          </div>
        </div>

        {/* Action Panel / Global Views Switcher */}
        <nav className="p-3 space-y-1.5 border-b border-white/5">
          <button
            onClick={() => setActiveView('editor')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'editor'
                ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
            }`}
          >
            <FileText size={16} />
            <span>Workspace Editor</span>
          </button>

          {features.d2lSync && (
            <button
              onClick={() => setActiveView('d2l')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'd2l'
                  ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
            }`}
            >
              <Calendar size={16} />
              <span>D2L Calendar Sync</span>
            </button>
          )}

          {features.cadViewer && (
            <button
              onClick={() => setActiveView('cad')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'cad'
                  ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
            }`}
            >
              <Box size={16} />
              <span>3D Model Viewer</span>
            </button>
          )}

          <button
            onClick={() => setActiveView('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'settings'
                ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
            }`}
          >
            <SettingsIcon size={16} />
            <span>Workspace Settings</span>
          </button>
        </nav>

        {/* Sidebar Title */}
        <div className="px-4 pt-4 pb-2 text-[9px] uppercase font-bold text-slate-500 tracking-wider">
          Markdown Note Vault
        </div>

        {/* File Tree Component */}
        <div className="flex-1 overflow-y-auto px-3">
          <Explorer />
        </div>
      </aside>

      {/* 2. MAIN APP CONTENT CONTAINER */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-950/30">
        
        {/* Top Control and State Bar */}
        <header className="h-12 border-b border-white/5 flex items-center justify-between px-6 bg-slate-900/10">
          <div className="text-xs font-medium text-slate-400 flex items-center gap-2">
            <LayoutGrid size={14} className="text-indigo-400" />
            {activeFilePath ? (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-slate-300 font-mono">{activeFilePath}</span>
              </span>
            ) : (
              <span>Overview</span>
            )}
          </div>

          {/* Controls: Theme Selector */}
          <div className="flex items-center gap-3">
            <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/5">
              {(['dark', 'light', 'amoled', 'colored-glass'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`px-2 py-1 text-[10px] capitalize rounded-md font-semibold transition-all ${
                    theme === t
                      ? 'bg-indigo-500/20 text-indigo-300 shadow-sm border border-indigo-500/10'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {t.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Content Region: Split Pane Layout */}
        <div className="flex-1 flex gap-4 p-4 overflow-hidden">
          
          {/* Left Split Pane: Always Note Editor */}
          <div className="flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden">
            <Editor />
          </div>

          {/* Right Split Pane: Dynamic Resource Viewer (3D Model / PDF / Code / Settings) */}
          <div className="flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden">
            <Viewer />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
```
