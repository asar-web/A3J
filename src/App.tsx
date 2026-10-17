/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { POSProvider, usePOS, MASTER_ADMIN_EMAIL } from './context/POSContext';
import { Header, NavTab } from './components/Header';
import { WorkspaceToolbar } from './components/WorkspaceToolbar';
import { RegisterTerminal } from './components/pos/RegisterTerminal';
import { InventoryManager } from './components/inventory/InventoryManager';
import { SalesAnalytics } from './components/analytics/SalesAnalytics';
import { MultiStoreManager } from './components/stores/MultiStoreManager';
import { LoyaltyManager } from './components/loyalty/LoyaltyManager';
import { PublicStorefront } from './components/storefront/PublicStorefront';
import { AdminControlCenter } from './components/admin/AdminControlCenter';
import { AuthModal } from './components/auth/AuthModal';
import { BarcodeScannerModal } from './components/pos/BarcodeScannerModal';
import { StockNotificationsDrawer } from './components/notifications/StockNotificationsDrawer';
import { VercelBuildModal } from './components/diagnostics/VercelBuildModal';
import { SyncManagerModal } from './components/sync/SyncManagerModal';
import { ReceiptModal } from './components/pos/ReceiptModal';
import { ShippingTrackingManager } from './components/shipping/ShippingTrackingManager';
import {
  AlertTriangle,
  Zap,
  X,
  Lock,
  Printer,
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const {
    currentStore,
    recentStockNotification,
    clearRecentNotification,
    adjustStock,
    currentUser,
    currency,
    activeReceiptOrder,
    setActiveReceiptOrder,
    createTestReceiptOrder,
  } = usePOS();

  const [activeTab, setActiveTab] = useState<NavTab>('storefront');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerInitialMode, setScannerInitialMode] = useState<'cart' | 'audit'>('cart');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isVercelModalOpen, setIsVercelModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<'buyer_login' | 'buyer_register' | 'admin_login'>('admin_login');
  const [isStandaloneReceiptOpen, setIsStandaloneReceiptOpen] = useState(false);
  const [trackingQueryForShipping, setTrackingQueryForShipping] = useState<string>('');

  const isMasterAdmin =
    currentUser?.role === 'admin' &&
    currentUser?.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();

  const handleOpenScanner = (mode: 'cart' | 'audit' = 'cart') => {
    setScannerInitialMode(mode);
    setIsScannerOpen(true);
  };

  const handleOpenAuth = (tab: 'buyer_login' | 'buyer_register' | 'admin_login' = 'admin_login') => {
    setAuthInitialTab(tab);
    setIsAuthModalOpen(true);
  };

  const handlePreview80mmReceipt = () => {
    if (!activeReceiptOrder) {
      setActiveReceiptOrder(createTestReceiptOrder());
    }
    setIsStandaloneReceiptOpen(true);
  };

  const handleNavigateToTracking = (query?: string) => {
    if (query) setTrackingQueryForShipping(query);
    setActiveTab('shipping');
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'storefront':
        return (
          <PublicStorefront
            onNavigateToPOS={() => setActiveTab('register')}
            onOpenScanner={() => handleOpenScanner('audit')}
            onOpenAuth={handleOpenAuth}
            onNavigateToTracking={handleNavigateToTracking}
          />
        );
      case 'register':
        return <RegisterTerminal />;
      case 'inventory':
        return <InventoryManager />;
      case 'shipping':
        return (
          <ShippingTrackingManager
            initialTrackingQuery={trackingQueryForShipping}
            onOpenReceiptModal={(order) => {
              setActiveReceiptOrder(order);
              setIsStandaloneReceiptOpen(true);
            }}
          />
        );
      case 'analytics':
        return <SalesAnalytics />;
      case 'stores':
        return <MultiStoreManager />;
      case 'loyalty':
        return <LoyaltyManager />;
      case 'admin':
        if (!isMasterAdmin) {
          return (
            <div className="max-w-md mx-auto my-16 p-8 bg-white border border-neutral-200 rounded-2xl shadow-sm text-center space-y-4">
              <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-800">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-neutral-900">Administrator Access Required</h2>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Headquarters authorization is required. Sign in with authorized administrator credentials to review registrations, configure store branches, and access system controls.
              </p>
              <button
                type="button"
                onClick={() => handleOpenAuth('admin_login')}
                className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
              >
                Sign In to Admin Portal
              </button>
            </div>
          );
        }
        return <AdminControlCenter />;
      default:
        return (
          <PublicStorefront
            onNavigateToPOS={() => setActiveTab('register')}
            onOpenScanner={() => handleOpenScanner('audit')}
            onOpenAuth={handleOpenAuth}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 font-sans text-neutral-900 antialiased selection:bg-neutral-900 selection:text-white">
      {/* Real-Time Stock Notification Toast */}
      {recentStockNotification && (
        <div className="fixed top-20 right-4 z-50 max-w-sm w-full bg-white rounded-2xl shadow-2xl border-2 border-amber-500 p-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 ${
                  recentStockNotification.urgency === 'critical' ? 'bg-rose-600' : 'bg-amber-500'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <span
                  className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded ${
                    recentStockNotification.urgency === 'critical'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {recentStockNotification.urgency === 'critical'
                    ? 'Critical: Out of Stock'
                    : 'Low Stock Alert'}
                </span>
                <h4 className="font-bold text-xs text-neutral-900 mt-1">
                  {recentStockNotification.productName}
                </h4>
                <p className="text-[11px] text-neutral-600 mt-0.5">
                  {recentStockNotification.storeName} · Current:{' '}
                  <strong>{recentStockNotification.currentStock} units</strong>
                </p>
              </div>
            </div>
            <button
              onClick={clearRecentNotification}
              className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                adjustStock(
                  recentStockNotification.productId,
                  recentStockNotification.storeId,
                  10,
                  'Alert Notification Restock'
                );
                clearRecentNotification();
              }}
              className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 active:scale-95 cursor-pointer"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Restock Now (+10)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                clearRecentNotification();
                setActiveTab('inventory');
              }}
              className="text-[11px] font-bold text-neutral-700 hover:underline cursor-pointer"
            >
              Inspect in Inventory
            </button>
          </div>
        </div>
      )}

      {/* Main Top Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenScanner={() => handleOpenScanner('cart')}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenVercelModal={() => setIsVercelModalOpen(true)}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenAuthModal={handleOpenAuth}
        onPreviewReceipt={handlePreview80mmReceipt}
      />

      {/* Operational Workspace Toolbar */}
      <WorkspaceToolbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenScanner={() => handleOpenScanner('cart')}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onPreviewReceipt={handlePreview80mmReceipt}
      />

      {/* Main Active View Container */}
      <main className="flex-1">{renderActiveView()}</main>

      {/* Editorial Footer */}
      <footer className="bg-white border-t border-neutral-200 py-6 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-900">Aura Retail POS</span>
            <span>·</span>
            <span>80mm Thermal Receipt · Currency: {currency.code} ({currency.symbol})</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('storefront')}
              className="hover:text-neutral-900 transition-colors font-medium cursor-pointer"
            >
              Storefront
            </button>
            <button
              onClick={() => setActiveTab('shipping')}
              className="hover:text-neutral-900 transition-colors font-medium text-neutral-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Send &amp; Tracking</span>
            </button>
            <button
              onClick={handlePreview80mmReceipt}
              className="hover:text-neutral-900 transition-colors font-semibold text-emerald-700 flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3 h-3 text-emerald-600" />
              <span>Preview 80mm Receipt</span>
            </button>
            <button
              onClick={() => setIsVercelModalOpen(true)}
              className="hover:text-neutral-900 transition-colors cursor-pointer"
            >
              Build Status
            </button>
            <button
              onClick={() => handleOpenAuth('admin_login')}
              className="hover:text-neutral-900 transition-colors font-semibold text-neutral-700 flex items-center gap-1 cursor-pointer"
            >
              <Lock className="w-3 h-3 text-neutral-400" />
              <span>Admin Login</span>
            </button>
          </div>
          <div className="text-[11px] font-mono text-neutral-500">
            Branch: <strong>{currentStore.name}</strong> ({currentStore.code})
          </div>
        </div>
      </footer>

      {/* 80mm Thermal Receipt Modal Preview with Print and Cancel Actions */}
      {(isStandaloneReceiptOpen || activeReceiptOrder) && (
        <ReceiptModal
          order={activeReceiptOrder || createTestReceiptOrder()}
          onClose={() => {
            setIsStandaloneReceiptOpen(false);
            setActiveReceiptOrder(null);
          }}
        />
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        initialMode={scannerInitialMode}
      />

      {/* Stock Alerts Drawer */}
      <StockNotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigateToInventory={() => setActiveTab('inventory')}
      />

      {/* Diagnostics Modal */}
      <VercelBuildModal
        isOpen={isVercelModalOpen}
        onClose={() => setIsVercelModalOpen(false)}
      />

      {/* Sync Manager Modal */}
      <SyncManagerModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialTab={authInitialTab}
        onSuccessNavigate={(targetTab) => {
          if (targetTab === 'admin') {
            setActiveTab('admin');
          } else {
            setActiveTab('storefront');
          }
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <POSProvider>
      <MainAppContent />
    </POSProvider>
  );
}
