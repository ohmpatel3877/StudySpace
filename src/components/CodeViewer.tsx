import React, { useState, useEffect } from 'react';
import { safeInvoke, useApp } from '../context/AppContext';

interface CodeViewerProps {
  path: string;
  onError: (msg: string) => void;
}

const CodeViewer: React.FC<CodeViewerProps> = ({ path, onError }) => {
  const [code, setCode] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const { showToast } = useApp();

  useEffect(() => {
    const loadCode = async () => {
      try {
        const data = await safeInvoke('read_vault_file', { path });
        setCode(data || '');
        setEditText(data || '');
      } catch (err) {
        console.error('Failed to load code file', err);
        onError('Failed to load code file');
      }
    };
    loadCode();
    setIsEditing(false);
  }, [path, onError]);

  const handleToggleEdit = async () => {
    if (isEditing) {
      // Save changes
      try {
        await safeInvoke('write_vault_file', { path, content: editText });
        setCode(editText);
        setIsEditing(false);
        showToast('Inline changes saved successfully');
      } catch (err: any) {
        console.error('Failed to save inline changes', err);
        if (err.message?.includes('Permission denied') || path.includes('locked')) {
          showToast('Permission denied');
        } else {
          showToast(err.message || 'Permission denied');
        }
      }
    } else {
      setEditText(code);
      setIsEditing(true);
    }
  };

  const highlightCode = (rawCode: string) => {
    let escaped = rawCode
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Highlight keywords #include, int, return
    // Using a regex to wrap them
    escaped = escaped.replace(/(#include|int|return\b)/g, '<span class="keyword">$1</span>');
    return escaped;
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <span className="font-semibold text-sm">C/C++ Code Viewer</span>
        <button
          data-testid="edit-inline-btn"
          onClick={handleToggleEdit}
          className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded transition"
        >
          {isEditing ? 'Save Inline' : 'Edit Inline'}
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-slate-900 border border-slate-800 rounded p-4 font-mono text-sm leading-relaxed">
        {isEditing ? (
          <textarea
            data-testid="inline-code-textarea"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full h-full bg-transparent resize-none border-none outline-none text-white focus:ring-0"
            placeholder="Write C/C++ code..."
          />
        ) : (
          <pre
            data-testid="code-viewer"
            className="whitespace-pre"
            dangerouslySetInnerHTML={{ __html: highlightCode(code) }}
          />
        )}
      </div>
    </div>
  );
};

export default CodeViewer;
export { CodeViewer };
