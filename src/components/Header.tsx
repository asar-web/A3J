import React from 'react';
import { usePOS, MASTER_ADMIN_EMAIL } from '../context/POSContext';
import {
  Bell,
  Wifi,
  WifiOff,
  Activity,
  ShoppingBag,
  Package,
  Layers,
  Coins,
  Shield,
  User,
  KeyRound,
  Lock,
  UserCheck,
  Phone,
  Printer,
  Truck,
} from 'lucide-react';

export type NavTab = 'storefront' | 'register' | 'inventory' | 'shipping' | 'analytics' | 'stores' | 'loyalty' | 'admin';

interface HeaderProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenScanner: () => void;
  onOpenNotifications: () => void;
  onOpenVercelModal: () => void;
  onOpenSyncModal: () => void;
  onOpenAuthModal: (tab?: 'buyer_login' | 'buyer_register' | 'admin_login') => void;
  onPreviewReceipt?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenScanner,
  onOpenNotifications,
  onOpenVercelModal,
  onOpenSyncModal,
  onOpenAuthModal,
  onPreviewReceipt,
}) => {
  const {
    branding,
    unreadAlertCount,
    stockAlerts,
    isOfflineMode,
    isOnline,
    offlineQueueCount,
    currentUser,
    logout,
    pendingRegistrationCount,
    currency,
    orders,
  } = usePOS();

  const isActuallyOffline = isOfflineMode || !isOnline;
  const isMasterAdmin =
    currentUser?.role === 'admin' &&
    currentUser?.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand Wordmark & Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectTab('storefront')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition-transform overflow-hidden border border-neutral-200/50">
              {branding.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt={branding.storeName || 'Store Logo'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{branding.storeName ? branding.storeName.charAt(0).toUpperCase() : 'A'}</span>
              )}
            </div>
            <div>
              <span className="font-bold text-sm sm:text-base text-neutral-900 leading-tight block">
                {branding.storeName || 'Aura Retail POS'}
              </span>
              <span className="text-[10px] text-neutral-400 font-mono hidden sm:block">
                80mm Thermal Receipt POS · {currency.code}
              </span>
            </div>
          </button>

          {/* Phone Badge */}
          {branding.phoneNumber && (
            <a
              href={`tel:${branding.phoneNumber}`}
              className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-2xs"
              title="Call store directly"
            >
              <Phone className="w-3 h-3 text-emerald-600" />
              <span>{branding.phoneNumber}</span>
            </a>
          )}
        </div>

        {/* Primary Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-neutral-600">
          <button
            onClick={() => onSelectTab('storefront')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'storefront'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'hover:bg-neutral-100 hover:text-neutral-900'
            }`}
          >
            Storefront
          </button>
          <button
            onClick={() => onSelectTab('register')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'register'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'hover:bg-neutral-100 hover:text-neutral-900'
            }`}
          >
            Register Terminal
          </button>
          <button
            onClick={() => onSelectTab('inventory')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'hover:bg-neutral-100 hover:text-neutral-900'
            }`}
          >
            <span>Inventory</span>
            {stockAlerts.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500 text-white font-bold">
                {stockAlerts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => onSelectTab('shipping')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'shipping'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'hover:bg-neutral-100 hover:text-neutral-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Send &amp; Tracking</span>
            {orders.filter((o) => !o.fulfillmentStatus || o.fulfillmentStatus === 'unfulfilled').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-600 text-white font-bold">
                {orders.filter((o) => !o.fulfillmentStatus || o.fulfillmentStatus === 'unfulfilled').length}
              </span>
            )}
          </button>
          <button
            onClick={() => onSelectTab('analytics')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'hover:bg-neutral-100 hover:text-neutral-900'
            }`}
          >
            Sales Reports
          </button>
          <button
            onClick={() => onSelectTab('stores')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'stores'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'hover:bg-neutral-100 hover:text-neutral-900'
            }`}
          >
            Branches
          </button>
          <button
            onClick={() => onSelectTab('loyalty')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'loyalty'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'hover:bg-neutral-100 hover:text-neutral-900'
            }`}
          >
            Loyalty CRM
          </button>

          {/* ADMIN SUITE TAB */}
          {isMasterAdmin && (
            <button
              onClick={() => onSelectTab('admin')}
              className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Admin Suite</span>
              {pendingRegistrationCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-600 text-white font-bold">
                  {pendingRegistrationCount}
                </span>
              )}
            </button>
          )}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick 80mm Receipt Preview Button in Header */}
          {onPreviewReceipt && (
            <button
              type="button"
              onClick={onPreviewReceipt}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 transition-colors shadow-2xs cursor-pointer"
              title="Preview 80mm Thermal Receipt Roll"
            >
              <Printer className="w-3.5 h-3.5 text-neutral-700" />
              <span className="hidden md:inline">80mm Receipt</span>
            </button>
          )}

          {/* Real-time Alerts Bell */}
          <button
            type="button"
            onClick={onOpenNotifications}
            className={`relative p-2 rounded-xl border transition-all cursor-pointer ${
              unreadAlertCount > 0
                ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-2xs animate-pulse'
                : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
            }`}
            title="Real-Time Stock Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-mono font-bold flex items-center justify-center">
                {unreadAlertCount}
              </span>
            )}
          </button>

          {/* Offline Sync State */}
          <button
            type="button"
            onClick={onOpenSyncModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isActuallyOffline
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
            title="Manage offline transactions and cloud sync"
          >
            {isActuallyOffline ? (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline {offlineQueueCount > 0 ? `(${offlineQueueCount})` : ''}</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Synced</span>
              </>
            )}
          </button>

          {/* User Sign In / Profile / Admin Portal Link */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-1">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-neutral-900 leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[10px] font-mono text-neutral-500 uppercase">
                  {isMasterAdmin ? 'Administrator' : currentUser.role === 'customer' ? 'Confirmed Buyer' : 'Cashier'}
                </span>
              </div>
              <button
                onClick={logout}
                className="px-2.5 py-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors cursor-pointer"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenAuthModal('buyer_login')}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => onOpenAuthModal('admin_login')}
                className="p-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 rounded-xl transition-colors cursor-pointer border border-neutral-200"
                title="Administrator Portal"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
