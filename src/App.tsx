import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';

const ToastNotification: React.FC = () => {
  const { toast, theme } = useApp();

  if (!toast.visible) return null;

  // Adapt border color class based on theme string from context
  let borderClass = 'border-blue-500';
  if (theme === 'Colored Glass Mode') {
    borderClass = 'border-violet-500';
  } else if (theme === 'AMOLED Mode') {
    borderClass = 'border-cyan-400';
  }

  return (
    <div
      data-testid="toast-notification"
      className={`fixed bottom-4 right-4 z-50 px-4 py-3 bg-slate-900 text-slate-100 rounded shadow-xl border-l-4 ${borderClass} transition-all duration-300 max-w-sm text-sm`}
    >
      {toast.message}
    </div>
  );
};

const AppContent: React.FC = () => {
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <Layout />
      <ToastNotification />
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
