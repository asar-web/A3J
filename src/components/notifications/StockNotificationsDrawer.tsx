import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { StockAlert } from '../../types/pos';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  X,
  Volume2,
  VolumeX,
  Zap,
  ArrowRight,
  Store,
  Check,
} from 'lucide-react';

interface StockNotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToInventory?: () => void;
}

export const StockNotificationsDrawer: React.FC<StockNotificationsDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateToInventory,
}) => {
  const {
    stockAlerts,
    unreadAlertCount,
    acknowledgeAlert,
    acknowledgeAllAlerts,
    dismissAlert,
    soundAlertsEnabled,
    setSoundAlertsEnabled,
    adjustStock,
    stores,
  } = usePOS();

  const [storeFilter, setStoreFilter] = useState<'all' | string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'critical' | 'warning'>('all');

  if (!isOpen) return null;

  const filteredAlerts = stockAlerts.filter((alert) => {
    const matchesStore = storeFilter === 'all' || alert.storeId === storeFilter;
    const matchesUrgency = urgencyFilter === 'all' || alert.urgency === urgencyFilter;
    return matchesStore && matchesUrgency;
  });

  const criticalCount = stockAlerts.filter((a) => a.urgency === 'critical').length;
  const warningCount = stockAlerts.filter((a) => a.urgency === 'warning').length;

  const handleQuickRestock = (alert: StockAlert, amount = 10) => {
    adjustStock(alert.productId, alert.storeId, amount, 'Stock Alert 1-Click Restock');
    acknowledgeAlert(alert.id);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-neutral-900/50 backdrop-blur-2xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-neutral-200 flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-4 sm:p-5 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Bell className="w-4 h-4" />
              </div>
              {unreadAlertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadAlertCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Real-Time Stock Alerts</h3>
              <p className="text-[11px] text-neutral-500">
                {stockAlerts.length} active inventory alerts detected
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSoundAlertsEnabled(!soundAlertsEnabled)}
              className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                soundAlertsEnabled
                  ? 'bg-neutral-100 text-neutral-900 border-neutral-300'
                  : 'bg-white text-neutral-400 border-neutral-200'
              }`}
              title={soundAlertsEnabled ? 'Alert audio sound enabled' : 'Mute alert sounds'}
            >
              {soundAlertsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-3 bg-neutral-100/70 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setUrgencyFilter('all')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                urgencyFilter === 'all' ? 'bg-neutral-900 text-white' : 'text-neutral-600'
              }`}
            >
              All ({stockAlerts.length})
            </button>
            <button
              onClick={() => setUrgencyFilter('critical')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                urgencyFilter === 'critical' ? 'bg-rose-600 text-white' : 'text-rose-700'
              }`}
            >
              Critical ({criticalCount})
            </button>
            <button
              onClick={() => setUrgencyFilter('warning')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                urgencyFilter === 'warning' ? 'bg-amber-600 text-white' : 'text-amber-800'
              }`}
            >
              Low ({warningCount})
            </button>
          </div>
          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className="px-2 py-0.5 bg-white border border-neutral-300 rounded text-[11px] font-medium"
          >
            <option value="all">All Stores</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 p-3 space-y-2.5">
          {filteredAlerts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-neutral-400">
              <CheckCircle2 className="w-10 h-10 mb-2 text-emerald-500 stroke-1" />
              <p className="text-sm font-semibold text-neutral-800">All Stock Healthy!</p>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs">
                No items are below predefined safety stock thresholds.
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const isCrit = alert.urgency === 'critical';
              return (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isCrit
                      ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                      : 'bg-amber-50/60 border-amber-200 text-amber-950'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      {isCrit ? (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold uppercase ${
                              isCrit ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                            }`}
                          >
                            {isCrit ? 'OUT OF STOCK (0 UNITS)' : 'LOW STOCK WARNING'}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-500">{alert.sku}</span>
                        </div>
                        <h4 className="font-bold text-xs text-neutral-900 mt-1 truncate">
                          {alert.productName}
                        </h4>
                        <p className="text-[11px] text-neutral-600 mt-0.5 flex items-center gap-1">
                          <Store className="w-3 h-3 text-neutral-400" />
                          <span>{alert.storeName}</span>
                          <span className="mx-1">·</span>
                          <span>
                            Current:{' '}
                            <strong className={isCrit ? 'text-rose-700' : 'text-amber-800'}>
                              {alert.currentStock} units
                            </strong>
                          </span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => dismissAlert(alert.id)}
                      className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
                      title="Dismiss alert"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-neutral-200/80 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickRestock(alert, 10)}
                      className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 active:scale-95 cursor-pointer"
                    >
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>Restock +10</span>
                    </button>
                    {!alert.acknowledged && (
                      <button
                        type="button"
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="text-[11px] text-neutral-600 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>Acknowledge</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs">
          {onNavigateToInventory && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToInventory();
              }}
              className="text-neutral-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Thresholds</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-900 text-white rounded-lg font-semibold hover:bg-neutral-800 transition-colors ml-auto shadow-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
