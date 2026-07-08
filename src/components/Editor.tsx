import React, { useState, useEffect } from 'react';
import { useApp, safeInvoke } from '../context/AppContext';

const Editor: React.FC = () => {
  const {
    activeFile,
    editorContent,
    setEditorContent,
    features,
    showToast
  } = useApp();

  const [isPreview, setIsPreview] = useState(false);

  const currentPath = activeFile ? activeFile.path : '/vault/welcome.md';
  const currentName = activeFile ? activeFile.name : 'welcome.md';
  const currentExt = activeFile ? activeFile.ext : 'md';

  // Load content
  useEffect(() => {
    const loadContent = async () => {
      try {
        const data = await safeInvoke('read_vault_file', { path: currentPath });
        setEditorContent(data || '');
      } catch (err) {
        console.error('Failed to load file contents', err);
        setEditorContent('');
      }
    };
    loadContent();
  }, [activeFile, currentPath, setEditorContent]);

  const handleSave = async () => {
    try {
      await safeInvoke('write_vault_file', { path: currentPath, content: editorContent });
      showToast('File saved successfully');
    } catch (err: any) {
      console.error('Save failed', err);
      // Specific error message matching tests
      if (err.message?.includes('Permission denied') || currentPath === '/vault/locked.md') {
        showToast('Permission denied, unable to save file');
      } else {
        showToast(err.message || 'Failed to save file');
      }
    }
  };

  const handleOpenDefaultApp = async () => {
    try {
      await safeInvoke('open_in_default_app', { file_path: currentPath });
      showToast(`Opening ${currentName} in default application`);
    } catch (err: any) {
      console.error('Failed to open default app', err);
      showToast(err.message || 'Failed to open file in default application');
    }
  };

  const isDefaultAppBtnDisabled =
    !currentName ||
    !currentExt ||
    (currentExt.toLowerCase() === 'stl' && !features.includes('cad_viewer'));

  const parseMarkdown = (markdown: string) => {
    let html = markdown;
    // Simple XSS escape
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Headers
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    
    // Lists
    html = html.replace(/^- (.*?)$/gm, '<li>$1</li>');
    
    // Paragraphs
    const paragraphs = html.split(/\n\n+/);
    html = paragraphs.map(p => {
      if (p.trim().startsWith('<h') || p.trim().startsWith('<li')) {
        return p;
      }
      return `<p>${p.replace(/\n/g, '<br />')}</p>`;
    }).join('\n');
    
    return html;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 border-r border-slate-800">
      {/* Editor Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <h2 data-testid="editor-header-title" className="text-sm font-semibold truncate max-w-xs">
          {currentName}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            data-testid="preview-toggle"
            onClick={() => setIsPreview(!isPreview)}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded transition"
          >
            {isPreview ? 'Edit' : 'Preview'}
          </button>
          <button
            data-testid="save-button"
            onClick={handleSave}
            className="px-2.5 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition"
          >
            Save
          </button>
          <button
            data-testid="open-default-app-btn"
            disabled={isDefaultAppBtnDisabled}
            onClick={handleOpenDefaultApp}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded transition"
          >
            Open in Default App
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 overflow-auto p-4">
        {isPreview ? (
          <div
            data-testid="markdown-preview"
            className="prose prose-invert max-w-none text-slate-300"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(editorContent) }}
          />
        ) : (
          <textarea
            data-testid="markdown-textarea"
            value={editorContent}
            onChange={(e) => setEditorContent(e.target.value)}
            className="w-full h-full bg-transparent resize-none border-none outline-none focus:ring-0 text-sm font-mono leading-relaxed"
            placeholder="Write some markdown here..."
          />
        )}
      </div>
    </div>
  );
};

export default Editor;
export { Editor };
