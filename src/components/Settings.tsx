import React, { useState, useEffect } from 'react';
import { useApp, safeInvoke } from '../context/AppContext';

const Settings: React.FC = () => {
  const {
    settings,
    updateSettings,
    refreshVaultFiles,
    showToast
  } = useApp();

  // Local settings form state
  const [localTheme, setLocalTheme] = useState(settings.theme || 'Dark Mode');
  const [localFeatures, setLocalFeatures] = useState<string[]>(settings.active_features || ['d2l_sync', 'cad_viewer']);
  const [localUrl, setLocalUrl] = useState(settings.d2l_feed_url || '');

  // Import fields state
  const [importType, setImportType] = useState('local');
  const [importPath, setImportPath] = useState('');
  const [importUsername, setImportUsername] = useState('');
  const [importPassword, setImportPassword] = useState('');

  // Keep state in sync with context settings loaded asynchronously
  useEffect(() => {
    setLocalTheme(settings.theme || 'Dark Mode');
    setLocalFeatures(settings.active_features || ['d2l_sync', 'cad_viewer']);
    setLocalUrl(settings.d2l_feed_url || '');
  }, [settings]);

  const handleToggleFeature = (feature: string) => {
    if (localFeatures.includes(feature)) {
      setLocalFeatures(localFeatures.filter((f) => f !== feature));
    } else {
      setLocalFeatures([...localFeatures, feature]);
    }
  };

  const handleSaveSettings = async () => {
    const success = await updateSettings({
      theme: localTheme,
      active_features: localFeatures,
      d2l_feed_url: localUrl
    });
    if (success) {
      showToast('Settings saved successfully');
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await safeInvoke('import_external_location', {
        location_type: importType,
        path_or_url: importPath,
        credentials: {
          username: importUsername,
          password: importPassword
        }
      });

      // Update local settings list (virtual list) without duplicates
      const currentLocations = settings.external_locations || [];
      if (!currentLocations.some((loc) => loc.path_or_url === importPath)) {
        const updatedLocations = [...currentLocations, { location_type: importType, path_or_url: importPath }];
        await updateSettings({ external_locations: updatedLocations });
      }
      
      // Refresh files in explorer
      await refreshVaultFiles();
      
      // Clear inputs
      setImportPath('');
      setImportUsername('');
      setImportPassword('');
      showToast('Successfully imported location');
    } catch (err: any) {
      console.error('Import failed', err);
      showToast(err.message || 'Failed to import location');
    }
  };

  const handleRemoveLocation = async (path: string) => {
    try {
      await safeInvoke('remove_external_location', { path_or_url: path });
      
      // Update local settings list
      const currentLocations = settings.external_locations || [];
      const updatedLocations = currentLocations.filter((loc) => loc.path_or_url !== path);
      await updateSettings({ external_locations: updatedLocations });
      
      // Refresh files
      await refreshVaultFiles();
      
      showToast('Successfully removed location');
    } catch (err: any) {
      console.error('Remove failed', err);
      showToast(err.message || 'Failed to remove location');
    }
  };

  const locations = settings.external_locations || [];
  const showD2lInput = localFeatures.includes('d2l_sync');

  return (
    <div className="w-full h-full bg-slate-950 text-slate-100 p-6 flex flex-col space-y-6 overflow-y-auto">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        <p className="text-sm text-slate-400">Configure workspace themes, features, and external locations</p>
      </div>

      {/* Theme and Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 border border-slate-800 rounded bg-slate-900/50 space-y-4">
          <h2 className="font-semibold text-base">Appearance & Features</h2>
          
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Select Theme</label>
            <select
              data-testid="theme-select"
              value={localTheme}
              onChange={(e) => setLocalTheme(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-blue-600"
            >
              <option value="Light Mode">Light Mode</option>
              <option value="AMOLED Mode">AMOLED Mode</option>
              <option value="Colored Glass Mode">Colored Glass Mode</option>
              <option value="Dark Mode">Dark Mode</option>
            </select>
          </div>

          <div className="flex flex-col space-y-3 pt-2">
            <label className="flex items-center space-x-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                data-testid="toggle-d2l-sync"
                checked={localFeatures.includes('d2l_sync')}
                onChange={() => handleToggleFeature('d2l_sync')}
                className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-0"
              />
              <span>Enable D2L Calendar Feed Sync</span>
            </label>
            
            <label className="flex items-center space-x-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                data-testid="toggle-cad-viewer"
                checked={localFeatures.includes('cad_viewer')}
                onChange={() => handleToggleFeature('cad_viewer')}
                className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-0"
              />
              <span>Enable 3D CAD Model Viewer</span>
            </label>
          </div>

          {showD2lInput && (
            <div className="space-y-1.5 pt-2">
              <label className="text-xs text-slate-400 font-medium">D2L iCal Feed URL</label>
              <input
                type="text"
                data-testid="d2l-feed-url-input"
                placeholder="https://d2l.myuniversity.edu/feed.ics"
                value={localUrl}
                onChange={(e) => setLocalUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-blue-600"
              />
            </div>
          )}

          <button
            data-testid="save-settings-btn"
            onClick={handleSaveSettings}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded py-2 transition"
          >
            Save Settings
          </button>
        </div>

        {/* Location Import Section */}
        <div className="p-4 border border-slate-800 rounded bg-slate-900/50 space-y-4">
          <h2 className="font-semibold text-base">Import External Location</h2>
          
          <form onSubmit={handleImportSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Type</label>
                <select
                  data-testid="import-type-select"
                  value={importType}
                  onChange={(e) => setImportType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-sm text-white focus:outline-none"
                >
                  <option value="local">Local Directory</option>
                  <option value="webdav">WebDAV Share</option>
                  <option value="smb">SMB / Samba Share</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Path or URL</label>
                <input
                  type="text"
                  data-testid="import-path-input"
                  placeholder="/ext/folder or url"
                  value={importPath}
                  onChange={(e) => setImportPath(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Username (Optional)</label>
                <input
                  type="text"
                  data-testid="import-username-input"
                  placeholder="username"
                  value={importUsername}
                  onChange={(e) => setImportUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-sm text-white focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Password (Optional)</label>
                <input
                  type="password"
                  data-testid="import-password-input"
                  placeholder="password"
                  value={importPassword}
                  onChange={(e) => setImportPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              data-testid="import-submit-btn"
              className="w-full bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded py-2 transition"
            >
              Import Location
            </button>
          </form>
        </div>
      </div>

      {/* Imported Locations List */}
      <div className="p-4 border border-slate-800 rounded bg-slate-900/50 space-y-4">
        <h2 className="font-semibold text-base">Imported Workspace Directories</h2>
        
        <div data-testid="imported-locations-list" className="space-y-2">
          {locations.length === 0 ? (
            <div className="text-sm text-slate-500 py-2">
              No external locations imported
            </div>
          ) : (
            locations.map((loc, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 border border-slate-800 rounded bg-slate-950 text-sm"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-mono uppercase bg-slate-900 text-slate-400 px-2 py-0.5 rounded">
                    {loc.location_type}
                  </span>
                  <span className="font-medium truncate max-w-md">{loc.path_or_url}</span>
                </div>
                <button
                  data-testid="remove-location-btn"
                  onClick={() => handleRemoveLocation(loc.path_or_url)}
                  className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition"
                >
                  Unmount / Remove
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
export { Settings };
