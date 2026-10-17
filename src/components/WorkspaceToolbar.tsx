import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { NavTab } from './Header';
import {
  Store,
  Wifi,
  WifiOff,
  RefreshCw,
  Coins,
  Barcode,
  AlertTriangle,
  Printer,
  CheckCircle2,
} from 'lucide-react';

interface WorkspaceToolbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenScanner: () => void;
  onOpenSyncModal: () => void;
  onOpenNotifications: () => void;
  onPreviewReceipt?: () => void;
}

export const WorkspaceToolbar: React.FC<WorkspaceToolbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenScanner,
  onOpenSyncModal,
  onOpenNotifications,
  onPreviewReceipt,
}) => {
  const {
    stores,
    currentStore,
    setCurrentStoreId,
    isOfflineMode,
    setIsOfflineMode,
    isOnline,
    offlineQueueCount,
    syncPendingTransactions,
    currency,
    setCurrency,
    allCurrencies,
    stockAlerts,
  } = usePOS();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  const handleQuickSync = async () => {
    setIsSyncing(true);
    try {
      const res = await syncPendingTransactions();
      setSyncToast(`Synced ${res.count} transactions to cloud.`);
      setTimeout(() => setSyncToast(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const isActuallyOffline = isOfflineMode || !isOnline;

  return (
    <div className="bg-white border-b border-neutral-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left: Active Branch & Currency (Default LKR) */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-neutral-600">
              <Store className="w-3.5 h-3.5 text-neutral-500" />
              <span className="font-semibold text-neutral-700">Branch:</span>
            </div>
            <select
              value={currentStore.id}
              onChange={(e) => setCurrentStoreId(e.target.value)}
              className="bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 cursor-pointer shadow-2xs"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code}) · {s.taxRate}% Tax
                </option>
              ))}
            </select>

            <span className="text-neutral-300">|</span>

            {/* Currency Selector (LKR Default) */}
            <div className="flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-neutral-500" />
              <span className="font-semibold text-neutral-700">Currency:</span>
              <select
                value={currency.code}
                onChange={(e) => {
                  const target = allCurrencies.find((c) => c.code === e.target.value);
                  if (target) setCurrency(target);
                }}
                className="bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 cursor-pointer shadow-2xs"
              >
                {allCurrencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol.trim()})
                  </option>
                ))}
              </select>
            </div>

            {/* Barcode Quick Trigger */}
            <button
              type="button"
              onClick={onOpenScanner}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-semibold text-xs transition-colors shadow-2xs cursor-pointer active:scale-95"
              title="Open Barcode Scanner"
            >
              <Barcode className="w-3.5 h-3.5" />
              <span>Barcode</span>
            </button>

            {/* 80mm Receipt Trigger */}
            {onPreviewReceipt && (
              <button
                type="button"
                onClick={onPreviewReceipt}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg font-bold text-xs transition-colors shadow-2xs cursor-pointer"
                title="Preview 80mm Thermal Receipt Roll"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-600" />
                <span>80mm Thermal Slip</span>
              </button>
            )}
          </div>

          {/* Right: Low Stock Alert pill, Offline Simulator Toggle, Sync Queue */}
          <div className="flex items-center gap-2.5">
            {stockAlerts.length > 0 && (
              <button
                type="button"
                onClick={onOpenNotifications}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer shadow-2xs"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{stockAlerts.length} Alert{stockAlerts.length === 1 ? '' : 's'}</span>
              </button>
            )}

            <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg border border-neutral-200">
              <button
                type="button"
                onClick={() => setIsOfflineMode(false)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  !isActuallyOffline
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <Wifi className="w-3 h-3 text-emerald-600" />
                <span>Online</span>
              </button>
              <button
                type="button"
                onClick={() => setIsOfflineMode(true)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  isActuallyOffline
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <WifiOff className="w-3 h-3" />
                <span>Offline</span>
              </button>
            </div>

            {offlineQueueCount > 0 ? (
              <button
                type="button"
                onClick={handleQuickSync}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-[11px] transition-colors shadow-2xs cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : `${offlineQueueCount} Offline Orders`}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenSyncModal}
                className="hidden md:inline-flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-900 transition-colors font-medium cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cloud Ledger Parity</span>
              </button>
            )}
          </div>
        </div>

        {syncToast && (
          <div className="mt-2 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{syncToast}</span>
          </div>
        )}
      </div>

      {/* Mobile Tab Strip */}
      <div className="lg:hidden flex items-center justify-around border-t border-neutral-100 px-2 py-2 bg-neutral-50 text-xs">
        <button
          onClick={() => onSelectTab('storefront')}
          className={`px-2.5 py-1 font-semibold rounded-lg cursor-pointer ${
            activeTab === 'storefront' ? 'bg-neutral-900 text-white' : 'text-neutral-600'
          }`}
        >
          Storefront
        </button>
        <button
          onClick={() => onSelectTab('register')}
          className={`px-2.5 py-1 font-semibold rounded-lg cursor-pointer ${
            activeTab === 'register' ? 'bg-neutral-900 text-white' : 'text-neutral-600'
          }`}
        >
          Register
        </button>
        <button
          onClick={() => onSelectTab('inventory')}
          className={`px-2.5 py-1 font-semibold rounded-lg flex items-center gap-1 cursor-pointer ${
            activeTab === 'inventory' ? 'bg-neutral-900 text-white' : 'text-neutral-600'
          }`}
        >
          <span>Inventory</span>
          {stockAlerts.length > 0 && <span className="w-2 h-2 rounded-full bg-amber-500" />}
        </button>
        <button
          onClick={onPreviewReceipt}
          className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Receipt</span>
        </button>
      </div>
    </div>
  );
};
