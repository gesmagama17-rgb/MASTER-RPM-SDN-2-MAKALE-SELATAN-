import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="no-print fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-lg"
    >
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>Mode Offline Aktif — Data lokal terisolasi &amp; generator cadangan siap digunakan.</span>
    </div>
  );
};
