import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { StoreLocation } from '../../types/pos';
import {
  Building2,
  MapPin,
  Percent,
  Phone,
  ArrowRightLeft,
  Check,
  AlertCircle,
  X,
  Store,
} from 'lucide-react';

export const MultiStoreManager: React.FC = () => {
  const { stores, updateStore, products, transferInventory, currentStore, setCurrentStoreId } = usePOS();
  const [editingStore, setEditingStore] = useState<StoreLocation | null>(null);
  const [transferProdId, setTransferProdId] = useState(products[0]?.id || '');
  const [fromStoreId, setFromStoreId] = useState(stores[0]?.id || '');
  const [toStoreId, setToStoreId] = useState(stores[1]?.id || '');
  const [transferQty, setTransferQty] = useState(5);
  const [transferToast, setTransferToast] = useState<{ message: string; isError: boolean } | null>(null);

  const selectedProduct = products.find((p) => p.id === transferProdId);
  const availableAtSource = selectedProduct ? selectedProduct.stockByStore[fromStoreId] ?? 0 : 0;

  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStore) return;
    updateStore(editingStore);
    setEditingStore(null);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromStoreId === toStoreId) {
      setTransferToast({ message: 'Source and destination store must be different.', isError: true });
      return;
    }
    if (transferQty <= 0) {
      setTransferToast({ message: 'Transfer quantity must be greater than zero.', isError: true });
      return;
    }
    if (transferQty > availableAtSource) {
      setTransferToast({
        message: `Insufficient stock at source store (only ${availableAtSource} available).`,
        isError: true,
      });
      return;
    }
    const ok = transferInventory(transferProdId, fromStoreId, toStoreId, transferQty);
    if (ok) {
      const fromName = stores.find((s) => s.id === fromStoreId)?.name;
      const toName = stores.find((s) => s.id === toStoreId)?.name;
      setTransferToast({
        message: `Successfully transferred ${transferQty} units of ${selectedProduct?.name} from ${fromName} to ${toName}.`,
        isError: false,
      });
      setTimeout(() => setTransferToast(null), 4000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Multi-Store Branches &amp; Tax</h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Manage retail branch profiles, local automated tax rates, and inter-store stock transfers.
        </p>
      </div>

      {/* Stores List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stores.map((store) => {
          const isCurrentActive = store.id === currentStore.id;
          return (
            <div
              key={store.id}
              className={`bg-white rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                isCurrentActive ? 'border-neutral-900 shadow-md ring-1 ring-neutral-900' : 'border-neutral-200 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold">
                      {store.code}
                    </span>
                    <h3 className="text-base font-bold text-neutral-900 mt-0.5">{store.name}</h3>
                  </div>
                  {isCurrentActive && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      Active POS
                    </span>
                  )}
                </div>
                <div className="mt-4 space-y-2 text-xs text-neutral-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span>{store.address}, {store.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Percent className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span>
                      Tax Rate: <strong className="font-mono text-neutral-900">{store.taxRate}%</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span>{store.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-neutral-100 text-[11px]">
                    <span className="text-neutral-400">Manager:</span>
                    <span className="font-semibold text-neutral-800">{store.manager}</span>
                  </div>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStoreId(store.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    isCurrentActive
                      ? 'bg-neutral-100 text-neutral-400 cursor-default'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-xs'
                  }`}
                >
                  {isCurrentActive ? 'Active Terminal' : 'Switch Terminal'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingStore(store)}
                  className="px-3 py-1.5 border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-xl text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                >
                  Edit Rates
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transfer Stock */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900">Inter-Store Stock Transfer</h3>
            <p className="text-xs text-neutral-500">
              Shift physical stock between retail locations with zero POS terminal downtime.
            </p>
          </div>
        </div>

        {transferToast && (
          <div
            className={`p-3 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2 ${
              transferToast.isError
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            {transferToast.isError ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            ) : (
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            )}
            <span>{transferToast.message}</span>
          </div>
        )}

        <form onSubmit={handleExecuteTransfer} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Select SKU</label>
            <select
              value={transferProdId}
              onChange={(e) => setTransferProdId(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-xl bg-white"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              Source Location (Avail: {availableAtSource})
            </label>
            <select
              value={fromStoreId}
              onChange={(e) => setFromStoreId(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-xl bg-white"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Destination Location</label>
            <select
              value={toStoreId}
              onChange={(e) => setToStoreId(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-xl bg-white"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block font-semibold text-neutral-700 mb-1">Qty</label>
              <input
                type="number"
                min="1"
                max={availableAtSource}
                value={transferQty}
                onChange={(e) => setTransferQty(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 font-mono font-bold border border-neutral-300 rounded-xl"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs transition-colors whitespace-nowrap h-[38px] shadow-xs cursor-pointer active:scale-95"
            >
              Transfer Stock
            </button>
          </div>
        </form>
      </div>

      {/* Edit Store Modal */}
      {editingStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-neutral-200 bg-neutral-50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-neutral-900">Configure {editingStore.name}</h3>
              <button
                type="button"
                onClick={() => setEditingStore(null)}
                className="p-1 text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveStore} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Branch Name</label>
                <input
                  type="text"
                  value={editingStore.name}
                  onChange={(e) => setEditingStore({ ...editingStore, name: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editingStore.taxRate}
                  onChange={(e) => setEditingStore({ ...editingStore, taxRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 font-mono font-bold border border-neutral-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Street Address</label>
                <input
                  type="text"
                  value={editingStore.address}
                  onChange={(e) => setEditingStore({ ...editingStore, address: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl"
                />
              </div>
              <div className="pt-3 border-t border-neutral-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStore(null)}
                  className="px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-900 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 shadow-xs cursor-pointer"
                >
                  Save Store Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
