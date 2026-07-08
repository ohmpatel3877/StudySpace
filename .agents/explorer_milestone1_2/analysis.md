# StudySpace - Milestone 1 Setup Strategy & Layout Analysis

This document details the setup strategy for configuring the Tauri desktop application with a React + Vite + TypeScript + Tailwind CSS frontend for the **StudySpace** project. It addresses toolchain status, initialization commands, dependency management, Tauri scope configurations (for both v1 and v2), and the structural design of the glassmorphic dark UI shell.

---

## 1. System Environment Analysis

An initial diagnostic check of the development environment was performed:
* **Node.js**: `v25.3.0` (Active and compatible)
* **NPM**: `11.13.0` (Active and compatible)
* **Rust / Cargo**: `Not recognized in the system PATH`

### Recommendation for Rust Setup:
Before executing any Tauri initialization or build commands, the system must have Rust installed:
1. Download and run `rustup-init.exe` from [https://rustup.rs/](https://rustup.rs/).
2. Select the default installation (Option 1). This installs `rustc`, `cargo`, and the stable toolchain.
3. Ensure the **C++ Build Tools for Visual Studio** are installed (a standard requirement for Tauri development on Windows).
4. Restart the terminal / IDE to verify:
   ```powershell
   cargo --version
   rustc --version
   ```

---

## 2. Project Initialization Strategy

There are two main routes to initialize a Tauri + React + Vite + TypeScript project. The **Direct CLI Wizard** is recommended for standard structure, but the **Manual Vite + Tauri** setup provides maximum control.

### Option A: The Direct Tauri CLI Wizard (Recommended)
This is the most reliable way to ensure that Tauri-specific configurations, development server ports, and Vite integrations are pre-configured out-of-the-box.

Run the following command in the parent directory of `StudySpace` or directly inside it:
```powershell
# Run the interactive setup wizard
npm create tauri-app@latest
```
**Wizard Selections:**
1. **Project name**: `studyspace` (or `.` if running inside an empty folder)
2. **Identifier**: `com.studyspace.app`
3. **Choose your package manager**: `npm`
4. **Choose your UI template**: `React`
5. **Choose your UI framework**: `Vite` (TypeScript flavor)

### Option B: Vite First, then Tauri Integration
If we want to build the frontend skeleton first and add Tauri later:
```powershell
# 1. Initialize Vite React-TS application
npm create vite@latest . -- --template react-ts

# 2. Install Tauri CLI as a dev dependency
npm install -D @tauri-apps/cli

# 3. Initialize Tauri project configuration
npx tauri init
```
**Tauri Init Parameters:**
* **App title**: `StudySpace`
* **Bundle identifier**: `com.studyspace.app`
* **Window dev path**: `http://localhost:5173` (Vite's default dev server port)
* **Frontend dist path**: `../dist` (Vite's default build output folder relative to `src-tauri`)
* **Web dev server URL**: `http://localhost:5173`

---

## 3. Dependency Management

To support the requested features (glassmorphic UI, 3D CAD rendering, C/C++ code viewer, PDF viewer, and calendar sync), the following frontend dependencies must be installed.

### Frontend Dependencies

#### 1. UI Shell & Utilities
* **lucide-react**: Collection of modern icons for the sidebar, resource viewer tabs, and buttons.
* **clsx** & **tailwind-merge**: Utilities to dynamically combine Tailwind classes, which is crucial for managing glassmorphic conditional states.
```powershell
npm install lucide-react clsx tailwind-merge
```

#### 2. Styling (Tailwind CSS)
```powershell
# Install Tailwind CSS and its pre-processors
npm install -D tailwindcss postcss autoprefixer

# Initialize Tailwind configuration files
npx tailwindcss init -p
```

#### 3. 3D CAD Viewer (Three.js & React-Three-Fiber)
* **three**: Core WebGL library.
* **@types/three**: TypeScript type definitions.
* **@react-three/fiber**: React wrapper that makes writing Three.js components declarative.
* **@react-three/drei**: Helper components (e.g., `<OrbitControls />`, STL/OBJ loader helpers) which simplify 3D scene setup.
```powershell
# Install core 3D libraries
npm install three @react-three/fiber @react-three/drei

# Install developer type definitions
npm install -D @types/three
```

#### 4. PDF Viewer
For embedding PDFs, we can either use a standard HTML `<iframe>` (which leverages Chromium's built-in PDF viewer inside Tauri's webview) or install `react-pdf` for deep custom React-based document rendering. For the initial skeleton, the native iframe approach is recommended to keep dependencies lean.

### Summary `package.json` Structure
```json
{
  "name": "studyspace",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri"
  },
  "dependencies": {
    "@react-three/drei": "^9.0.0",
    "@react-three/fiber": "^8.0.0",
    "@tauri-apps/api": "^2.0.0",
    "clsx": "^2.1.1",
    "lucide-react": "^0.400.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tailwind-merge": "^2.3.0",
    "three": "^0.166.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@types/three": "^0.166.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.2.2",
    "vite": "^5.3.1"
  }
}
```

---

## 4. Tauri Configuration (`tauri.conf.json`)

To enable the frontend to communicate with local resources and fetch external calendar feeds, we must configure **File System (fs)** and **HTTP** permissions. 

### Security Warning & Architectural Pattern
* **Vulnerability Risk**: Directly exposing raw `fs` and `http` modules to the frontend webview allows any potential cross-site scripting (XSS) vulnerability to read/write arbitrary system files or issue malicious requests.
* **Best Practice (Recommended)**: As specified in `PROJECT.md`, the frontend should interact with the OS *exclusively* via custom Rust commands (`get_vault_files`, `read_vault_file`, `write_vault_file`, `fetch_and_parse_d2l`). Because these custom command handlers run in the Rust backend, **no raw frontend fs/http permissions are required**! The Rust backend does the standard local directory lookups and network fetching using native Rust crates (`std::fs`, `reqwest`, `ical`), and returns structured responses.
* **Alternative (Direct Frontend API Access)**: If direct frontend access is required (e.g., using `@tauri-apps/plugin-fs` or `@tauri-apps/api/fs`), scopes must be configured. Below are the configurations for both Tauri v1 and Tauri v2.

### Version A: Tauri v1.x Scope Configuration
Add the following to `src-tauri/tauri.conf.json` under `tauri > allowlist`:

```json
{
  "tauri": {
    "allowlist": {
      "all": false,
      "fs": {
        "all": false,
        "readFile": true,
        "writeFile": true,
        "readDir": true,
        "createDir": true,
        "scope": [
          "$DOCUMENT/StudySpaceVault/*",
          "$APPCONFIG/*"
        ]
      },
      "http": {
        "all": false,
        "request": true,
        "scope": [
          "https://*.brightspace.com/d2l/le/calendar/*",
          "https://*.brightspace.com/d2l/api/*"
        ]
      }
    },
    "bundle": {
      "active": true,
      "targets": "all"
    }
  }
}
```
* **$DOCUMENT/StudySpaceVault/****: Limits the file system scope strictly to a `StudySpaceVault` directory in the user's Documents folder.
* **HTTP Scope**: Restricts network requests exclusively to brightspace domain subfolders for the calendar feed.

### Version B: Tauri v2.x Scope Configuration
Tauri v2 uses a plugin-based permissions model. System configurations are split between `tauri.conf.json` and a JSON file in `src-tauri/capabilities/`.

1. **`src-tauri/tauri.conf.json`**
```json
{
  "productName": "StudySpace",
  "version": "0.1.0",
  "identifier": "com.studyspace.app",
  "bundle": {
    "active": true,
    "targets": "all"
  },
  "plugins": {
    "fs": {},
    "http": {}
  }
}
```

2. **`src-tauri/capabilities/default.json`** (Create this file to define permissions)
```json
{
  "$schema": "../schemas/capability.json",
  "identifier": "default",
  "description": "Default permissions for StudySpace frontend",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "fs:allow-read-dir",
    "fs:allow-read-file",
    "fs:allow-write-file",
    "fs:allow-create-dir",
    "http:allow-request",
    {
      "identifier": "fs:allow-vault-scope",
      "allow": [
        { "path": "$DOCUMENT/StudySpaceVault/**/*" },
        { "path": "$APPCONFIG/**/*" }
      ]
    },
    {
      "identifier": "http:allow-brightspace-scope",
      "allow": [
        { "url": "https://*.brightspace.com/d2l/le/calendar/*" }
      ]
    }
  ]
}
```

---

## 5. Styling Configuration (Tailwind + CSS Custom Properties)

To achieve the glassmorphic dark UI, we declare utility classes and customize CSS variables inside `src/styles/index.css` and `tailwind.config.js`.

### Tailwind Configuration (`tailwind.config.js`)
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
        glass: {
          bg: 'rgba(15, 23, 42, 0.45)', // dark slate base with semi-opacity
          border: 'rgba(255, 255, 255, 0.08)',
          highlight: 'rgba(99, 102, 241, 0.15)', // indigo accent tint
        }
      },
      boxShadow: {
        'glass-sm': '0 4px 16px 0 rgba(0, 0, 0, 0.15)',
        'glass-md': '0 8px 32px 0 rgba(0, 0, 0, 0.35)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}
```

### CSS Variable Layering (`src/styles/index.css`)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --bg-app: #030712;
    --text-primary: #f3f4f6;
    --text-secondary: #9ca3af;
    --border-glass: rgba(255, 255, 255, 0.08);
    --bg-glass-card: rgba(17, 24, 39, 0.5);
    --accent-indigo: #6366f1;
  }
  
  body {
    background-color: var(--bg-app);
    color: var(--text-primary);
    overflow: hidden;
  }
}

@layer utilities {
  .glass-panel {
    background: var(--bg-glass-card);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--border-glass);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  }
  
  .glass-sidebar {
    background: rgba(3, 7, 18, 0.6);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-right: 1px solid var(--border-glass);
  }

  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 9999px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}
```

---

## 6. Shell Layout Design

The layout must split the interface into three key zones:
1. **Sidebar Navigation** (Vault explorer toggles, D2L Calendar Sync, Settings).
2. **Left Panel** (File system navigator + Markdown Note Editor).
3. **Right Panel** (Dynamic file visualizer for C/C++ code, PDFs, 3D CAD models, or the Calendar dashboard).

### App.tsx (Global state provider & shell wrapper)
```tsx
import React, { useState } from 'react';
import Layout from './components/Layout';
import { AppProvider } from './context/AppContext';

export default function App() {
  return (
    <AppProvider>
      <div className="relative h-screen w-screen overflow-hidden bg-zinc-950 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
        {/* Dynamic Glowing Radial Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-950/20 via-zinc-950 to-zinc-950 -z-10" />
        
        {/* Subtly floating ambient lights */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-purple-600/5 rounded-full filter blur-[120px] -z-10 animate-pulse" />
        
        <Layout />
      </div>
    </AppProvider>
  );
}
```

### Layout.tsx (Sidebar & Split Panes Structure)
```tsx
import React, { useState } from 'react';
import { 
  Folder, 
  Calendar, 
  Settings as SettingsIcon, 
  Maximize2, 
  Minimize2, 
  Eye, 
  FileText,
  Boxes3D
} from 'lucide-react';
import Explorer from './Explorer';
import Editor from './Editor';
import Viewer from './Viewer';

export default function Layout() {
  const [activeTab, setActiveTab] = useState<'vault' | 'calendar' | 'settings'>('vault');
  const [selectedFile, setSelectedFile] = useState<{ name: string; path: string; type: string } | null>(null);
  const [splitRatio, setSplitRatio] = useState<number>(50); // percentage for left pane
  const [editorMode, setEditorMode] = useState<'edit' | 'preview'>('edit');

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      
      {/* 1. Glassmorphic Sidebar */}
      <aside className="w-64 glass-sidebar flex flex-col justify-between p-4 z-10 select-none">
        <div className="flex flex-col gap-6">
          {/* Logo / Header */}
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 border border-indigo-400/20">
              <Boxes3D className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-wider bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              StudySpace
            </span>
          </div>

          {/* Navigation Toggles */}
          <nav className="flex flex-col gap-1">
            <button
              onClick={() => setActiveTab('vault')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'vault' 
                  ? 'bg-white/10 text-white shadow-glass-sm border border-white/5' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Folder className="w-4 h-4" />
              Markdown Notes
            </button>
            
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'calendar' 
                  ? 'bg-white/10 text-white shadow-glass-sm border border-white/5' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Calendar className="w-4 h-4" />
              D2L Sync
            </button>
          </nav>
        </div>

        {/* Sidebar Footer (Settings & Version) */}
        <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'settings' 
                ? 'bg-white/10 text-white' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            Settings
          </button>
          <div className="text-[10px] text-zinc-500 text-center select-none pt-1">
            StudySpace v0.1.0
          </div>
        </div>
      </aside>

      {/* 2. Main Work Workspace Container */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'vault' ? (
          <>
            {/* LEFT PANE: File Tree Explorer + Note Editor */}
            <div 
              style={{ width: `${splitRatio}%` }} 
              className="h-full flex flex-col border-r border-white/5 bg-zinc-900/10 backdrop-blur-[2px] transition-all duration-75 relative"
            >
              {/* Header Bar */}
              <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 select-none">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    {selectedFile ? selectedFile.name : 'No Note Selected'}
                  </span>
                </div>
                {/* Editor Toggle (Edit vs Preview) */}
                {selectedFile && (
                  <div className="flex items-center gap-0.5 bg-black/40 p-0.5 rounded-md border border-white/5 text-xs">
                    <button 
                      onClick={() => setEditorMode('edit')}
                      className={`px-2.5 py-1 rounded transition-all ${editorMode === 'edit' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                      Write
                    </button>
                    <button 
                      onClick={() => setEditorMode('preview')}
                      className={`px-2.5 py-1 rounded transition-all ${editorMode === 'preview' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                      Preview
                    </button>
                  </div>
                )}
              </div>

              {/* Explorer / Editor Split Content */}
              <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-4">
                {!selectedFile ? (
                  <Explorer onSelectFile={(file) => setSelectedFile(file)} />
                ) : (
                  <Editor file={selectedFile} mode={editorMode} />
                )}
              </div>
              
              {/* Draggable Divider Handle */}
              <div 
                className="absolute top-0 right-0 w-[4px] h-full cursor-col-resize hover:bg-indigo-500/40 active:bg-indigo-500 transition-colors z-20"
                onMouseDown={(e) => {
                  const startX = e.clientX;
                  const startRatio = splitRatio;
                  const onMouseMove = (moveEvent: MouseEvent) => {
                    const deltaX = moveEvent.clientX - startX;
                    const containerWidth = document.body.clientWidth - 256; // exclude sidebar
                    const newRatio = startRatio + (deltaX / containerWidth) * 100;
                    setSplitRatio(Math.min(Math.max(newRatio, 20), 80)); // constrain between 20% and 80%
                  };
                  const onMouseUp = () => {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                  };
                  document.addEventListener('mousemove', onMouseMove);
                  document.addEventListener('mouseup', onMouseUp);
                }}
              />
            </div>

            {/* RIGHT PANE: Dynamic Resource Viewer */}
            <div 
              style={{ width: `${100 - splitRatio}%` }} 
              className="h-full flex flex-col bg-zinc-950/20"
            >
              <Viewer activeFile={selectedFile} />
            </div>
          </>
        ) : activeTab === 'calendar' ? (
          /* Full Width Subview (D2L Dashboard) */
          <div className="flex-1 h-full bg-zinc-900/10 backdrop-blur-[2px] p-6 overflow-y-auto custom-scrollbar">
            <h2 className="text-xl font-bold mb-4 text-white">D2L Brightspace iCal Sync</h2>
            <div className="glass-panel p-6 rounded-xl">
              <p className="text-sm text-zinc-400">Sync configuration and task manager goes here.</p>
            </div>
          </div>
        ) : (
          /* Full Width Subview (Settings) */
          <div className="flex-1 h-full bg-zinc-900/10 backdrop-blur-[2px] p-6 overflow-y-auto custom-scrollbar">
            <h2 className="text-xl font-bold mb-4 text-white">Settings</h2>
            <div className="glass-panel p-6 rounded-xl">
              <p className="text-sm text-zinc-400">Application preference controls, themes, and feature toggles.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
```

---

## 7. Next Action Steps (For Implementer)

1. **Verify Rustup / Cargo installation** on the target machine.
2. Initialize project structure using: `npm create tauri-app@latest .`
3. Install frontend dependencies: `npm install three @react-three/fiber @react-three/drei lucide-react clsx tailwind-merge`
4. Setup Tailwind CSS configuration and CSS glassmorphic layers inside `src/styles/index.css`.
5. Implement the main layout structure in `src/App.tsx` and `src/components/Layout.tsx` utilizing Tailwind backdrop filter variables.
