import React, { useState } from 'react';
import { useApp, FileObject, safeInvoke } from '../context/AppContext';

const Explorer: React.FC = () => {
  const {
    vaultFiles,
    refreshVaultFiles,
    activeFile,
    setActiveFile,
    features,
    showToast
  } = useApp();

  const [newFileName, setNewFileName] = useState('');
  const hasCadViewer = features.includes('cad_viewer');

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    const path = `/vault/${newFileName.trim()}`;
    const ext = newFileName.includes('.') ? newFileName.split('.').pop() || '' : '';
    const newFile: FileObject = {
      name: newFileName.trim(),
      path,
      is_dir: false,
      ext
    };

    try {
      await safeInvoke('write_vault_file', { path, content: '' });
      await refreshVaultFiles();
      setActiveFile(newFile);
      setNewFileName('');
    } catch (err: any) {
      console.error('Failed to create file', err);
      showToast(err.message || 'Permission denied, unable to save file');
    }
  };

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full select-none text-slate-300">
      <div className="p-3 font-semibold text-xs uppercase tracking-wider text-slate-500 border-b border-slate-800">
        Workspace Files
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {vaultFiles.length === 0 ? (
          <div
            data-testid="empty-folder-message"
            className="p-4 text-sm text-slate-500 text-center"
          >
            No workspace files found
          </div>
        ) : (
          vaultFiles.map((file) => {
            const isStl = file.ext.toLowerCase() === 'stl';
            const isDisabled = isStl && !hasCadViewer;
            const testId = isDisabled
              ? `file-item-${file.name}-disabled`
              : `file-item-${file.name}`;
            const isActive = activeFile?.path === file.path;

            return (
              <button
                key={file.path}
                data-testid={testId}
                onClick={() => {
                  if (!isDisabled) {
                    setActiveFile({ ...file });
                  }
                }}
                className={`w-full text-left px-3 py-1.5 rounded text-sm flex items-center space-x-2 transition ${
                  isDisabled
                    ? 'opacity-40 cursor-not-allowed text-slate-600'
                    : isActive
                    ? 'bg-blue-600 text-white font-medium'
                    : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <span className="truncate">{file.name}</span>
              </button>
            );
          })
        )}
      </div>

      <form onSubmit={handleCreateFile} className="p-3 border-t border-slate-800 space-y-2">
        <input
          type="text"
          data-testid="new-file-name"
          placeholder="New file name..."
          value={newFileName}
          onChange={(e) => setNewFileName(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-600 text-white"
        />
        <button
          type="submit"
          data-testid="create-file-btn"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded py-1.5 transition"
        >
          Create File
        </button>
      </form>
    </div>
  );
};

export default Explorer;
export { Explorer };
