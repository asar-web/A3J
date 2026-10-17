import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  X,
  Wifi,
  WifiOff,
  RefreshCw,
  Database,
  CheckCircle2,
  HardDrive,
} from 'lucide-react';

interface SyncManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncManagerModal: React.FC<SyncManagerModalProps> = ({ isOpen, onClose }) => {
  const {
    isOfflineMode,
    setIsOfflineMode,
    isOnline,
    offlineQueueCount,
    syncLogs,
    syncPendingTransactions,
    lastSyncTime,
    orders,
    currentStore,
    exportSystemBackup,
    formatMoney,
  } = usePOS();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isActuallyOffline = isOfflineMode || !isOnline;
  const offlineOrders = orders.filter((o) => o.isOffline || !o.syncedToCloud);

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      const res = await syncPendingTransactions();
      setSyncStatusMsg(`Cloud sync complete: ${res.count} offline orders reconciled.`);
      setTimeout(() => setSyncStatusMsg(null), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">Cloud Data Synchronization</h3>
              <p className="text-xs text-neutral-500">
                Offline transactional buffer &amp; uninterrupted store operations
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto text-xs">
          <div className="flex items-center justify-between p-4 bg-neutral-50 border border-neutral-200 rounded-2xl">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isActuallyOffline ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {isActuallyOffline ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-900">
                  {isActuallyOffline ? 'Operating in Offline Buffer Mode' : 'Cloud Ledger Synchronized'}
                </p>
                <p className="text-[11px] text-neutral-500">
                  {isActuallyOffline
                    ? 'Sales are signed & cached locally in browser storage'
                    : `Last cloud sync: ${lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : 'Just now'}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOfflineMode(!isOfflineMode)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-300 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              {isOfflineMode ? 'Switch to Online' : 'Simulate Offline'}
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-neutral-900 text-white rounded-2xl shadow-xs">
            <div>
              <p className="text-xs font-semibold text-neutral-300">Pending Local Transactions</p>
              <p className="text-xl font-bold font-mono text-white mt-0.5 tabular-nums">
                {offlineQueueCount} Orders Buffered
              </p>
            </div>
            <button
              onClick={handleTriggerSync}
              disabled={isSyncing || offlineQueueCount === 0}
              className="flex items-center gap-2 px-4 py-2 bg-white text-neutral-900 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Force Sync Now'}</span>
            </button>
          </div>

          {syncStatusMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{syncStatusMsg}</span>
            </div>
          )}

          {/* Sync logs */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-neutral-900">Synchronization History</h4>
            <div className="border border-neutral-200 rounded-xl divide-y divide-neutral-100 max-h-48 overflow-y-auto text-xs">
              {syncLogs.map((log) => (
                <div key={log.id} className="p-3 flex items-start gap-3 bg-white">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-900">{log.details}</p>
                    <p className="text-[11px] font-mono text-neutral-400 mt-0.5">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => exportSystemBackup()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-lg font-semibold text-neutral-800 transition-colors cursor-pointer"
          >
            <HardDrive className="w-3.5 h-3.5 text-neutral-600" />
            <span>Download Backup (JSON)</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold text-neutral-700 hover:text-neutral-900 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
