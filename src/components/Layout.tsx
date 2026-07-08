import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import Explorer from './Explorer';
import Editor from './Editor';
import Viewer from './Viewer';
import D2LDashboard from './D2LDashboard';
import Settings from './Settings';

const Layout: React.FC = () => {
  const { currentNav, setCurrentNav, features } = useApp();
  const showD2L = features.includes('d2l_sync');

  // Custom split-pane state and handlers
  const [leftWidth, setLeftWidth] = useState(50); // percentage
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const newWidth = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      // Constraint to prevent collapsing entirely
      if (newWidth > 15 && newWidth < 85) {
        setLeftWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Sidebar navigation */}
      <div
        data-testid="sidebar"
        className="flex flex-col w-64 bg-slate-900/80 text-white border-r border-slate-700/50 backdrop-blur-md"
      >
        <div className="p-4 font-bold text-lg border-b border-slate-700/50">StudySpace</div>
        <nav className="flex-1 p-2 space-y-1">
          <button
            data-testid="tab-workspace"
            onClick={() => setCurrentNav('notes')}
            className={`w-full text-left px-4 py-2 rounded transition ${
              currentNav === 'notes' ? 'bg-slate-700 font-semibold' : 'hover:bg-slate-800'
            }`}
          >
            Workspace
          </button>
          {showD2L && (
            <button
              data-testid="tab-d2l"
              onClick={() => setCurrentNav('d2l')}
              className={`w-full text-left px-4 py-2 rounded transition ${
                currentNav === 'd2l' ? 'bg-slate-700 font-semibold' : 'hover:bg-slate-800'
              }`}
            >
              D2L Dashboard
            </button>
          )}
          <button
            data-testid="tab-settings"
            onClick={() => setCurrentNav('settings')}
            className={`w-full text-left px-4 py-2 rounded transition ${
              currentNav === 'settings' ? 'bg-slate-700 font-semibold' : 'hover:bg-slate-800'
            }`}
          >
            Settings
          </button>
        </nav>
        <div className="flex-1 border-t border-slate-800/80 overflow-hidden flex flex-col">
          <Explorer />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 h-full relative overflow-hidden bg-slate-950/20">
        {/* Workspace Split Pane (Always Mounted) */}
        <div ref={containerRef} className="flex h-full w-full overflow-hidden">
          {/* Left Pane (Editor) */}
          <div
            data-testid="editor-pane"
            style={{ width: `${leftWidth}%` }}
            className="h-full flex flex-col overflow-hidden border-r border-slate-800/80"
          >
            <Editor />
          </div>

          {/* Split Resizer Handle */}
          <div
            data-testid="split-pane-resizer"
            onMouseDown={handleMouseDown}
            className="w-1.5 bg-slate-800 hover:bg-blue-600 transition cursor-col-resize h-full select-none"
          />

          {/* Right Pane (Viewer) */}
          <div
            data-testid="viewer-pane"
            style={{ width: `${100 - leftWidth}%` }}
            className="h-full overflow-hidden"
          >
            <Viewer />
          </div>
        </div>

        {/* D2L Dashboard Overlay */}
        {currentNav === 'd2l' && (
          <div className="absolute inset-0 bg-slate-950 z-10 overflow-y-auto">
            <D2LDashboard />
          </div>
        )}

        {/* Settings Overlay */}
        {currentNav === 'settings' && (
          <div className="absolute inset-0 bg-slate-950 z-10 overflow-y-auto">
            <Settings />
          </div>
        )}
      </div>
    </div>
  );
};

export default Layout;
export { Layout };
