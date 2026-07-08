# StudySpace Setup Strategy & Architecture Design

This document details the setup strategy, dependency checklist, Tauri permission configurations, and layout design for Milestone 1 (App Skeleton & Tauri Core) of the StudySpace project.

---

## 1. Project Scaffolding & Setup Strategy

To initialize the project skeleton matching the directory structure in `PROJECT.md` (which utilizes a root-level frontend project and a `src-tauri` directory for the Rust backend), there are two main approaches. We recommend **Method B** for maximum control and clean integration into the existing empty workspace.

### Method A: Single Command scaffolding with `create-tauri-app`
This is the standard interactive CLI helper provided by Tauri. Because the workspace directory is not completely empty (it contains `.agents/` and `PROJECT.md`), we must instruct the CLI to force write to the current directory.
```powershell
# Run the interactive setup and force initialization in the current directory
npm create tauri-app@latest . -- --force
```
**Prompts Configuration**:
* **Project Name**: `studyspace`
* **Identifier**: `com.studyspace.app`
* **Frontend language**: `TypeScript / JavaScript`
* **Package manager**: `npm`
* **Frontend framework**: `React`
* **Frontend template**: `React + Vite (TypeScript)`

---

### Method B: Manual Hybrid Scaffolding (Recommended)
This approach guarantees that the Vite frontend template is initialized standardly, followed by the Tauri CLI.

#### Step 1: Scaffold Vite Frontend
Initialize a React-TypeScript template in the root directory.
```powershell
npm create vite@latest . -- --template react-ts
```
*Vite will ask if you want to remove existing files or merge; choose to merge / continue since `.agents` and `PROJECT.md` must not be deleted.*

#### Step 2: Install Tauri CLI & Dev Dependencies
Install the Tauri CLI locally as a development dependency.
```powershell
npm install -D @tauri-apps/cli
```

#### Step 3: Initialize Tauri Backend
Run the Tauri initialization wizard to create the `src-tauri` structure.
```powershell
npx tauri init
```
**Configuration Inputs for the Wizard**:
* **App Name**: `StudySpace`
* **Window Title**: `StudySpace`
* **Assets path (relative to src-tauri/tauri.conf.json)**: `../dist` (This is where Vite outputs build files)
* **Dev Server URL**: `http://localhost:5173` (Vite default dev port)
* **Frontend Dev Command**: `npm run dev`
* **Frontend Build Command**: `npm run build`

---

## 2. Dependency Matrix Checklist

To build out the full StudySpace system (including Markdown editing, resizable panes, Three.js 3D viewers, and syntax highlighting), install the following dependencies in the root project.

### Frontend Production Dependencies
```powershell
# Core Tauri Client APIs
npm install @tauri-apps/api

# Design and Icons
npm install lucide-react

# Resizable split panes layout
npm install react-resizable-panels

# Three.js 3D rendering stack (for CAD Viewer)
npm install three @react-three/fiber @react-three/drei

# C/C++ Syntax Highlighting (for Code Viewer)
npm install react-syntax-highlighter

# (Optional) Confetti for completion animations
npm install canvas-confetti
```

### Frontend Development Dependencies
```powershell
# Tailwind CSS stack
npm install -D tailwindcss postcss autoprefixer

# TypeScript Declarations for libraries lacking built-in types
npm install -D @types/three @types/react-syntax-highlighter @types/canvas-confetti
```

#### Step 4: Tailwind CSS Initialization
Initialize Tailwind's configuration files:
```powershell
npx tailwindcss init -p
```

---

## 3. Tauri Scope Configuration (`tauri.conf.json`)

To read/write local vault notes and fetch external D2L Brightspace iCal feeds, we must configure Tauri's security scopes. Depending on whether Tauri v1 or Tauri v2 is chosen, the configuration varies. We provide the setup for both options.

### Option A: Tauri v1.x Configuration (`src-tauri/tauri.conf.json`)
For Tauri v1, modify the `"tauri"` object.
* `fs`: Enabled for file-reading, writing, directory listing, and directory creation. Scoped to default user locations to prevent arbitrary filesystem writes outside user boundaries. Note that if a user opens a vault directory through the Tauri Dialog (`@tauri-apps/api/dialog`), that directory is automatically scoped and allowed for the session.
* `http`: Allows fetching external calendars. Setting the scope to `https://*` allows proxying D2L Brightspace URL feeds.

```json
{
  "tauri": {
    "security": {
      "csp": "default-src 'self'; img-src 'self' asset: https: data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' asset: IPC"
    },
    "allowlist": {
      "all": false,
      "dialog": {
        "all": false,
        "open": true,
        "save": true
      },
      "fs": {
        "all": false,
        "readFile": true,
        "writeFile": true,
        "readDir": true,
        "createDir": true,
        "removeFile": true,
        "scope": [
          "$DOCUMENT/*",
          "$APPDATA/*",
          "$DESKTOP/*",
          "$DOWNLOAD/*"
        ]
      },
      "http": {
        "all": false,
        "request": true,
        "scope": [
          "https://*"
        ]
      }
    },
    "bundle": {
      "active": true,
      "targets": "all",
      "identifier": "com.studyspace.app"
    }
  }
}
```

---

### Option B: Tauri v2.x Configuration
For Tauri v2, core capabilities are separated into plugins.
1. Install plugins via cargo inside `src-tauri/Cargo.toml`:
   ```toml
   [dependencies]
   tauri = { version = "2.0.0", features = [] }
   tauri-plugin-fs = "2.0.0"
   tauri-plugin-http = "2.0.0"
   ```
2. Initialize them in `src-tauri/src/main.rs`:
   ```rust
   fn main() {
       tauri::Builder::default()
           .plugin(tauri_plugin_fs::init())
           .plugin(tauri_plugin_http::init())
           .run(tauri::generate_context!())
           .expect("error while running tauri application");
   }
   ```
3. Enable permissions in the capability file (e.g. `src-tauri/capabilities/default.json`):
   ```json
   {
     "$schema": "../gen/schemas/desktop-schema.json",
     "identifier": "default",
     "description": "Default permissions for StudySpace",
     "windows": ["main"],
     "permissions": [
       "core:default",
       "fs:allow-read-dir",
       "fs:allow-read-file",
       "fs:allow-write-file",
       "fs:allow-create-dir",
       "fs:allow-remove-file",
       {
         "identifier": "fs:scope",
         "scope": {
           "allow": [
             { "path": "$DOCUMENT/**/*" },
             { "path": "$APPDATA/**/*" }
           ]
         }
       },
       "http:default",
       {
         "identifier": "http:scope",
         "scope": {
           "allow": [
             { "url": "https://*" }
           ]
         }
       }
     ]
   }
   ```

---

## 4. Glassmorphic Dark UI Shell Layout Design

A glassmorphic theme utilizes semi-transparent overlays (`bg-white/5`), a heavy background blur (`backdrop-blur-md`), thin, semi-transparent borders (`border border-white/10`), and deep radial gradients in the background to showcase the transparency.

### Step 1: Tailwind Configuration (`tailwind.config.js`)
Ensure Tailwind searches our source folder.
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        themeBg: 'var(--bg-color)',
        themeText: 'var(--text-color)',
        themeMuted: 'var(--text-muted)',
        themeAccent: 'var(--accent-color)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
```

### Step 2: Custom Glassmorphic Utilities (`src/styles/index.css`)
We define global classes and theme variables for four distinct modes: **Dark (default)**, **Light**, **AMOLED (pure black, minimal glass)**, and **Colored Glass (vibrant teal/pink contrast)**.
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg-color: #020617; /* slate-950 */
  --text-color: #f8fafc; /* slate-50 */
  --text-muted: #94a3b8; /* slate-400 */
  --accent-color: #6366f1; /* indigo-500 */
  --glass-bg: rgba(15, 23, 42, 0.45);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-shadow: rgba(0, 0, 0, 0.4);
  --glass-blur: 16px;
}

[data-theme="light"] {
  --bg-color: #f1f5f9; /* slate-100 */
  --text-color: #0f172a; /* slate-900 */
  --text-muted: #475569; /* slate-600 */
  --accent-color: #4f46e5; /* indigo-600 */
  --glass-bg: rgba(255, 255, 255, 0.45);
  --glass-border: rgba(15, 23, 42, 0.08);
  --glass-shadow: rgba(0, 0, 0, 0.06);
  --glass-blur: 16px;
}

[data-theme="amoled"] {
  --bg-color: #000000;
  --text-color: #ffffff;
  --text-muted: #a1a1aa; /* zinc-400 */
  --accent-color: #2563eb; /* blue-600 */
  --glass-bg: rgba(0, 0, 0, 0.95);
  --glass-border: rgba(255, 255, 255, 0.15);
  --glass-shadow: rgba(0, 0, 0, 0);
  --glass-blur: 0px;
}

[data-theme="colored-glass"] {
  --bg-color: #0b0f19;
  --text-color: #e0f2fe; /* sky-100 */
  --text-muted: #38bdf8; /* sky-400 */
  --accent-color: #ec4899; /* pink-500 */
  --glass-bg: rgba(13, 148, 136, 0.15); /* teal-600/15 */
  --glass-border: rgba(236, 72, 153, 0.25);
  --glass-shadow: rgba(13, 148, 136, 0.15);
  --glass-blur: 24px;
}

body {
  margin: 0;
  background-color: var(--bg-color);
  color: var(--text-color);
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  overflow: hidden;
  user-select: none;
}

/* Glassmorphism custom components */
.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  box-shadow: 0 8px 32px 0 var(--glass-shadow);
}

.glass-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* Hide scrollbars but keep functionality */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

---

### Step 3: Context Setup (`src/context/AppContext.tsx`)
Create a global state manager for the themes, feature toggles, navigation tabs, and currently active files.

```tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'dark' | 'light' | 'amoled' | 'colored-glass';

export interface FileItem {
  name: string;
  path: string;
  isDir: boolean;
  ext?: string;
}

export interface FeatureToggles {
  d2lSync: boolean;
  cadViewer: boolean;
}

interface AppContextProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  activeFile: FileItem | null;
  setActiveFile: (file: FileItem | null) => void;
  features: FeatureToggles;
  setFeatures: React.Dispatch<React.SetStateAction<FeatureToggles>>;
  currentNav: 'notes' | 'calendar' | 'settings';
  setCurrentNav: (nav: 'notes' | 'calendar' | 'settings') => void;
  explorerOpen: boolean;
  setExplorerOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('ss-theme') as Theme) || 'dark';
  });
  const [activeFile, setActiveFile] = useState<FileItem | null>(null);
  const [features, setFeatures] = useState<FeatureToggles>(() => {
    const saved = localStorage.getItem('ss-features');
    return saved ? JSON.parse(saved) : { d2lSync: true, cadViewer: true };
  });
  const [currentNav, setCurrentNav] = useState<'notes' | 'calendar' | 'settings'>('notes');
  const [explorerOpen, setExplorerOpen] = useState<boolean>(true);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('ss-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('ss-features', JSON.stringify(features));
  }, [features]);

  return (
    <AppContext.Provider value={{
      theme,
      setTheme,
      activeFile,
      setActiveFile,
      features,
      setFeatures,
      currentNav,
      setCurrentNav,
      explorerOpen,
      setExplorerOpen
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
```

---

### Step 4: Base Shell (`src/App.tsx`)
Initializes the global provider, and adds the abstract mesh backgrounds (radial color drops) under the main app container.

```tsx
import React from 'react';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';

const App: React.FC = () => {
  return (
    <AppProvider>
      <div className="relative w-screen h-screen overflow-hidden themeBg select-none transition-colors duration-300">
        
        {/* Decorative Background Accents for Glass Blurring */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-pink-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] rounded-full bg-teal-500/5 blur-[100px] pointer-events-none" />
        
        {/* Application Layout Shell */}
        <Layout />
      </div>
    </AppProvider>
  );
};

export default App;
```

---

### Step 5: Glassmorphic Layout (`src/components/Layout.tsx`)
Constructs the UI grid with a Left sidebar, an optional File Explorer bar, and a main area divided into Split Panes (Left: Markdown Editor, Right: Dynamic Viewer) using `react-resizable-panels`.

```tsx
import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useApp } from '../context/AppContext';
import { FileText, Calendar, Settings as SettingsIcon, Menu, FolderOpen } from 'lucide-react';

// Placeholders for components implemented in subsequent milestones
const ExplorerPlaceholder = () => (
  <div className="p-4 h-full">
    <h3 className="font-semibold text-sm themeAccent mb-4 flex items-center gap-2">
      <FolderOpen size={16} /> VAULT EXPLORER
    </h3>
    <ul className="space-y-2 text-xs themeMuted">
      <li className="p-2 glass-card rounded cursor-pointer hover:text-white">quickstart.md</li>
      <li className="p-2 glass-card rounded cursor-pointer hover:text-white">math_notes.md</li>
      <li className="p-2 glass-card rounded cursor-pointer hover:text-white">cad_sketch.stl</li>
      <li className="p-2 glass-card rounded cursor-pointer hover:text-white">syllabus.pdf</li>
      <li className="p-2 glass-card rounded cursor-pointer hover:text-white">algorithm.cpp</li>
    </ul>
  </div>
);

const EditorPlaceholder = () => {
  const { activeFile } = useApp();
  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <FileText size={18} className="themeAccent" />
          {activeFile ? activeFile.name : 'Welcome.md'}
        </h2>
        <span className="text-xs px-2 py-1 glass-card rounded themeMuted">Live Preview</span>
      </div>
      <textarea 
        className="flex-1 w-full bg-transparent border-0 outline-none resize-none text-sm leading-relaxed text-slate-200"
        placeholder="# Start writing..."
        defaultValue={`# Hello StudySpace\nSelect a note from the explorer, or write notes here.`}
      />
    </div>
  );
};

const ViewerPlaceholder = () => {
  const { activeFile, features } = useApp();
  return (
    <div className="p-6 h-full flex flex-col justify-center items-center text-center">
      {!activeFile ? (
        <div className="max-w-md">
          <h2 className="text-xl font-bold mb-2">No Resource Selected</h2>
          <p className="text-sm themeMuted">
            Select a file with `.stl`, `.obj`, `.pdf`, or `.cpp` extensions to open it dynamically in the visual workspace panel.
          </p>
        </div>
      ) : activeFile.ext === 'stl' || activeFile.ext === 'obj' ? (
        features.cadViewer ? (
          <div className="w-full h-full flex items-center justify-center border border-dashed border-white/10 rounded-lg">
            <p className="text-sm themeAccent font-mono">3D CAD Canvas [Three.js Mode: Active]</p>
          </div>
        ) : (
          <p className="text-sm text-red-400">CAD Viewer component disabled by feature toggles.</p>
        )
      ) : activeFile.ext === 'pdf' ? (
        <div className="w-full h-full border border-white/10 rounded-lg overflow-hidden bg-slate-900/20">
          <p className="text-sm themeMuted mt-10">PDF Viewer Panel</p>
        </div>
      ) : (
        <div className="p-4 border border-white/5 rounded-lg w-full max-h-full overflow-auto">
          <pre className="text-xs text-left font-mono text-emerald-400">
            {`// Syntax Highlighted C/C++ Code\n#include <iostream>\n\nint main() {\n    std::cout << "Hello StudySpace" << std::endl;\n    return 0;\n}`}
          </pre>
        </div>
      )}
    </div>
  );
};

const SettingsPlaceholder = () => {
  const { theme, setTheme, features, setFeatures } = useApp();
  return (
    <div className="p-8 max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold mb-2">Application Theme</h3>
          <div className="grid grid-cols-4 gap-3">
            {(['dark', 'light', 'amoled', 'colored-glass'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`py-2 px-4 rounded text-xs font-semibold border transition-all ${
                  theme === t 
                    ? 'border-indigo-500 bg-indigo-500/20 text-white' 
                    : 'border-white/10 hover:bg-white/5 text-slate-400'
                }`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="border-t border-white/5 pt-6">
          <h3 className="text-sm font-semibold mb-2">Feature Toggles</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox"
                checked={features.d2lSync}
                onChange={(e) => setFeatures(f => ({ ...f, d2lSync: e.target.checked }))}
                className="accent-indigo-500"
              />
              <span className="text-sm">Enable D2L Brightspace iCal Calendar Sync</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox"
                checked={features.cadViewer}
                onChange={(e) => setFeatures(f => ({ ...f, cadViewer: e.target.checked }))}
                className="accent-indigo-500"
              />
              <span className="text-sm">Enable 3D CAD STL/OBJ Viewer</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

const Layout: React.FC = () => {
  const { currentNav, setCurrentNav, explorerOpen, setExplorerOpen, features } = useApp();

  return (
    <div className="flex w-full h-full relative z-10">
      
      {/* 1. Icon Navigation Bar (Leftmost) */}
      <div className="w-[64px] h-full flex flex-col items-center justify-between py-4 border-r border-white/5 glass-panel select-none">
        <div className="flex flex-col items-center gap-6">
          <button 
            onClick={() => setExplorerOpen(!explorerOpen)} 
            className="p-2 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <Menu size={20} />
          </button>
          
          <button 
            onClick={() => setCurrentNav('notes')} 
            className={`p-3 rounded-xl transition-all ${
              currentNav === 'notes' ? 'bg-indigo-500/20 text-white shadow-lg shadow-indigo-500/10' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText size={20} />
          </button>

          {features.d2lSync && (
            <button 
              onClick={() => setCurrentNav('calendar')} 
              className={`p-3 rounded-xl transition-all ${
                currentNav === 'calendar' ? 'bg-indigo-500/20 text-white shadow-lg shadow-indigo-500/10' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar size={20} />
            </button>
          )}
        </div>

        <button 
          onClick={() => setCurrentNav('settings')} 
          className={`p-3 rounded-xl transition-all ${
            currentNav === 'settings' ? 'bg-indigo-500/20 text-white shadow-lg shadow-indigo-500/10' : 'text-slate-400 hover:text-white'
          }`}
        >
          <SettingsIcon size={20} />
        </button>
      </div>

      {/* 2. Collapsible File Explorer Drawer */}
      {explorerOpen && currentNav === 'notes' && (
        <div className="w-[240px] h-full border-r border-white/5 glass-panel select-none">
          <ExplorerPlaceholder />
        </div>
      )}

      {/* 3. Main Workspace Area */}
      <div className="flex-1 h-full overflow-hidden">
        {currentNav === 'notes' ? (
          <PanelGroup direction="horizontal">
            {/* Left Pane - Markdown Editor */}
            <Panel defaultSize={50} minSize={20} className="h-full">
              <div className="h-full glass-panel border-0">
                <EditorPlaceholder />
              </div>
            </Panel>

            {/* Split Resize Handle */}
            <PanelResizeHandle className="w-[4px] hover:w-[6px] bg-white/5 hover:bg-indigo-500/50 cursor-col-resize transition-all duration-150" />

            {/* Right Pane - Visual Resource Viewer */}
            <Panel defaultSize={50} minSize={20} className="h-full">
              <div className="h-full glass-panel border-y-0 border-r-0 border-l border-white/5">
                <ViewerPlaceholder />
              </div>
            </Panel>
          </PanelGroup>
        ) : currentNav === 'calendar' ? (
          <div className="w-full h-full glass-panel border-0 p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Calendar size={24} className="themeAccent" /> D2L Sync Dashboard
            </h2>
            <p className="themeMuted text-sm">Brightspace feed parsing scheduled for Milestone 4.</p>
          </div>
        ) : (
          <div className="w-full h-full glass-panel border-0">
            <SettingsPlaceholder />
          </div>
        )}
      </div>
    </div>
  );
};

export default Layout;
```
