import React from 'react';
import { useApp, D2LEvent } from '../context/AppContext';

const D2LDashboard: React.FC = () => {
  const {
    d2lEvents,
    syncD2LEvents,
    syncStatus,
    setEditorContent,
    showToast
  } = useApp();

  const handleCopyEvent = (event: D2LEvent) => {
    setEditorContent((prev) => {
      const spacing = prev.length > 0 ? '\n\n' : '';
      return prev + `${spacing}Reference: ${event.title}\nDescription: ${event.description}\nDue: ${event.due_date}`;
    });
    showToast(`Copied reference for ${event.title}`);
  };

  // Filter out duplicate event IDs
  const uniqueEvents: D2LEvent[] = [];
  const seenIds = new Set<string>();

  for (const ev of d2lEvents) {
    if (!seenIds.has(ev.id)) {
      seenIds.add(ev.id);
      uniqueEvents.push(ev);
    }
  }

  return (
    <div className="w-full h-full bg-slate-950 text-slate-100 p-6 flex flex-col space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">D2L Brightspace Calendar Sync</h1>
          <p className="text-sm text-slate-400">Sync and reference your course milestones</p>
        </div>
        <div className="flex items-center space-x-4">
          <span
            data-testid="d2l-sync-status"
            className={`text-xs px-2.5 py-1 rounded font-semibold ${
              syncStatus === 'Success'
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : syncStatus === 'Sync failed'
                ? 'bg-rose-950 text-rose-400 border border-rose-800'
                : syncStatus === 'Syncing'
                ? 'bg-blue-950 text-blue-400 border border-blue-800 animate-pulse'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            {syncStatus}
          </span>
          <button
            data-testid="d2l-sync-button"
            onClick={syncD2LEvents}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded shadow transition"
          >
            Sync Feed
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4">
        {uniqueEvents.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded bg-slate-900/40 text-slate-500">
            No synced events. Click 'Sync Feed' to fetch your schedule.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {uniqueEvents.map((event) => (
              <div
                key={event.id}
                data-testid="d2l-event-item"
                className="p-4 border border-slate-800 rounded bg-slate-900/50 flex flex-col justify-between space-y-3"
              >
                <div>
                  <h3 className="font-semibold text-base text-slate-200">{event.title}</h3>
                  <p className="text-sm text-slate-400 mt-1">{event.description}</p>
                  <div className="text-xs text-slate-500 font-mono mt-2">
                    Due: {new Date(event.due_date).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => handleCopyEvent(event)}
                  className="btn-copy-event w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded transition border border-slate-700/50"
                >
                  Copy Reference
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default D2LDashboard;
export { D2LDashboard };
