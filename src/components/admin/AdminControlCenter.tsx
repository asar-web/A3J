import React, { useState, useRef } from 'react';
import { usePOS } from '../../context/POSContext';
import { BuyRequest, StoreLocation, Customer, AdminStoreOptions } from '../../types/pos';
import {
  ShieldAlert,
  Settings,
  Layers,
  Edit3,
  Trash2,
  Plus,
  Check,
  X,
  Download,
  CheckCircle2,
  AlertCircle,
  Truck,
  Inbox,
  UserCheck,
  Sparkles,
  Store,
  HardDrive,
  Coins,
  KeyRound,
  FileText,
  CreditCard,
  QrCode,
  Upload,
  UserX,
  Clock,
  ShoppingBag,
  Printer,
  Zap,
  Sliders,
  Volume2,
  VolumeX,
  Smartphone,
  Monitor,
  Barcode,
  Eye,
  EyeOff,
  ShieldCheck,
  RotateCcw,
  BadgeAlert,
  Save,
  Phone,
  Image as ImageIcon,
  MapPin,
  Mail,
  Palette,
} from 'lucide-react';
import { playThermalPrinterFeedSound } from '../../utils/audio';

export const AdminControlCenter: React.FC = () => {
  const {
    currentUser,
    branding,
    updateBranding,
    adminOptions,
    updateAdminOptions,
    categories,
    addCategory,
    deleteCategory,
    customers,
    confirmCustomerRegistration,
    rejectCustomerRegistration,
    pendingRegistrationCount,
    buyRequests,
    downloadSoftwareSystemPackage,
    approveBuyRequest,
    formatMoney,
    currency,
    stores,
    changePassword,
    products,
    exportSystemBackup,
    restoreSystemBackup,
    resetToFactoryDefaults,
    soundAlertsEnabled,
    setSoundAlertsEnabled,
  } = usePOS();

  const [activeSection, setActiveSection] = useState<'pending_registrations' | 'buy_requests' | 'branding' | 'all_settings' | 'categories'>('pending_registrations');

  // Form State
  const [storeNameInput, setStoreNameInput] = useState(branding.storeName || 'Aura Retail POS');
  const [logoUrlInput, setLogoUrlInput] = useState(branding.logoUrl || '');
  const [heroTitleInput, setHeroTitleInput] = useState(branding.heroTitle || '');
  const [heroSubtitleInput, setHeroSubtitleInput] = useState(branding.heroSubtitle || '');
  const [phoneNumberInput, setPhoneNumberInput] = useState(branding.phoneNumber || '+94 11 234 5678');
  const [whatsappNumberInput, setWhatsappNumberInput] = useState(branding.whatsappNumber || '+94 77 123 4567');
  const [supportEmailInput, setSupportEmailInput] = useState(branding.supportEmail || 'support@aurapos.lk');
  const [storeAddressInput, setStoreAddressInput] = useState(branding.storeAddress || '45 Galle Road, Colombo');
  const [brandingToast, setBrandingToast] = useState<string | null>(null);

  // Category State
  const [newCategoryName, setNewCategoryName] = useState('');

  // Password State
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [passFeedback, setPassFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  // Receipt options
  const [receiptFooterInput, setReceiptFooterInput] = useState(adminOptions?.receiptFooterNote || '');
  const [receiptTaxInput, setReceiptTaxInput] = useState(adminOptions?.receiptTaxNumber || '');
  const [requestFeedback, setRequestFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  const pendingRegistrations = customers.filter(
    (c) => !c.adminConfirmed || c.registrationStatus === 'pending_confirmation'
  );
  const confirmedCustomers = customers.filter((c) => c.adminConfirmed && c.registrationStatus === 'confirmed');

  const handleConfirmCustomer = (customerId: string) => {
    const res = confirmCustomerRegistration(customerId);
    setRequestFeedback({ text: res.message, isError: !res.success });
    setTimeout(() => setRequestFeedback(null), 4000);
  };

  const handleRejectCustomer = (customerId: string) => {
    const res = rejectCustomerRegistration(customerId);
    setRequestFeedback({ text: res.message, isError: !res.success });
    setTimeout(() => setRequestFeedback(null), 4000);
  };

  const handleApproveRequest = (reqId: string) => {
    const res = approveBuyRequest(reqId);
    setRequestFeedback({ text: res.message, isError: !res.success && !res.requiresDownload });
    setTimeout(() => setRequestFeedback(null), 5000);
  };

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    updateBranding({
      storeName: storeNameInput.trim() || 'Aura Retail POS',
      logoUrl: logoUrlInput.trim(),
      heroTitle: heroTitleInput.trim(),
      heroSubtitle: heroSubtitleInput.trim(),
      phoneNumber: phoneNumberInput.trim(),
      whatsappNumber: whatsappNumberInput.trim(),
      supportEmail: supportEmailInput.trim(),
      storeAddress: storeAddressInput.trim(),
    });
    setBrandingToast('Store branding, logo, and phone contact updated.');
    setTimeout(() => setBrandingToast(null), 3500);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = changePassword(currentPassInput, newPassInput);
    setPassFeedback({ success: res.success, msg: res.message });
    if (res.success) {
      setCurrentPassInput('');
      setNewPassInput('');
    }
    setTimeout(() => setPassFeedback(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner with Admin Credentials Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Administrator Control Center</h1>
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-neutral-900 text-white flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-emerald-400" />
              <span>Headquarters Admin</span>
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Review buyer registrations, configure 80mm thermal receipts, manage product photos, and monitor system health.
          </p>
        </div>
        <button
          type="button"
          onClick={() => downloadSoftwareSystemPackage()}
          className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <HardDrive className="w-4 h-4 text-emerald-400" />
          <span>Download POS Package</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-2 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveSection('pending_registrations')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-colors whitespace-nowrap cursor-pointer ${
            activeSection === 'pending_registrations'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Buyer Registrations</span>
          {pendingRegistrationCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-white text-[10px] rounded-full font-mono font-bold">
              {pendingRegistrationCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSection('buy_requests')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-colors whitespace-nowrap cursor-pointer ${
            activeSection === 'buy_requests'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Orders &amp; Requests ({buyRequests.length})</span>
        </button>
        <button
          onClick={() => setActiveSection('branding')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-colors whitespace-nowrap cursor-pointer ${
            activeSection === 'branding'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-emerald-400" />
          <span>Branding &amp; Phone</span>
        </button>
        <button
          onClick={() => setActiveSection('all_settings')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-colors whitespace-nowrap cursor-pointer ${
            activeSection === 'all_settings'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <Sliders className="w-4 h-4 text-emerald-400" />
          <span>Receipt &amp; System Settings</span>
        </button>
      </div>

      {requestFeedback && (
        <div
          className={`p-3.5 text-xs font-semibold rounded-xl flex items-center gap-2 ${
            requestFeedback.isError
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          {requestFeedback.isError ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{requestFeedback.text}</span>
        </div>
      )}

      {/* 1. BUYER REGISTRATIONS */}
      {activeSection === 'pending_registrations' && (
        <div className="space-y-5">
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  Pending Public Registrations (Product Buyers &amp; POS Buyers)
                </h3>
                <p className="text-xs text-neutral-500">
                  Public buyers cannot log in until confirmed by Administrator. Click &quot;Confirm &amp; Activate&quot; to authorize.
                </p>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-lg text-xs font-bold font-mono">
                {pendingRegistrations.length} Pending
              </span>
            </div>

            {pendingRegistrations.length === 0 ? (
              <div className="p-8 bg-neutral-50 rounded-xl text-center text-neutral-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-neutral-800">All Buyer Registrations Confirmed</p>
                <p className="text-neutral-400 mt-0.5">No new public accounts are pending approval.</p>
              </div>
            ) : (
              <div className="border border-neutral-200 rounded-xl divide-y divide-neutral-100 overflow-hidden text-xs">
                {pendingRegistrations.map((cust) => (
                  <div key={cust.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/80 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-neutral-900 text-sm">{cust.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-neutral-100 text-neutral-800">
                          {cust.buyerType === 'pos_buyer' ? 'POS System Buyer' : 'Product Buyer'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                          Pending
                        </span>
                      </div>
                      <p className="text-neutral-600 font-mono text-[11px]">
                        Email: <strong>{cust.email}</strong> · Phone: {cust.phone}
                      </p>
                      {cust.businessName && (
                        <p className="text-neutral-700 text-[11px]">Business: {cust.businessName}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleConfirmCustomer(cust.id)}
                        className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Confirm &amp; Activate</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectCustomer(cust.id)}
                        className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors border border-rose-200 cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-neutral-900">
              Confirmed Active Buyers ({confirmedCustomers.length})
            </h3>
            <div className="border border-neutral-200 rounded-xl divide-y divide-neutral-100 overflow-hidden text-xs">
              {confirmedCustomers.map((cust) => (
                <div key={cust.id} className="p-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-neutral-900">{cust.name}</span>
                    <span className="text-neutral-500 font-mono text-[11px] ml-2">({cust.email})</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Confirmed
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. BUY REQUESTS & LICENSES */}
      {activeSection === 'buy_requests' && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                Purchase &amp; Software License Orders
              </h3>
              <p className="text-xs text-neutral-500">
                Admin accepts buy requests after verifying and downloading the system package.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Req ID</th>
                  <th className="py-2.5 px-3">Buyer / Company</th>
                  <th className="py-2.5 px-3">Summary</th>
                  <th className="py-2.5 px-3 text-right">Amount ({currency.code})</th>
                  <th className="py-2.5 px-3 text-center">Package Downloaded</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {buyRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-neutral-50">
                    <td className="py-3 px-3 font-mono font-bold text-neutral-900">{req.id}</td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-neutral-900">{req.customerName}</p>
                      <p className="text-[11px] text-neutral-500 font-mono">{req.customerEmail}</p>
                    </td>
                    <td className="py-3 px-3">
                      <p className="text-neutral-800">{req.itemsSummary}</p>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-neutral-950">
                      {req.total > 0 ? formatMoney(req.total) : 'Software Order'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {req.softwareDownloaded ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Downloaded
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => downloadSoftwareSystemPackage(req.id)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 cursor-pointer"
                        >
                          Download First
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {req.status === 'pending' ? (
                        <button
                          type="button"
                          onClick={() => handleApproveRequest(req.id)}
                          className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                        >
                          {req.softwareDownloaded ? 'Accept Order' : 'Download & Accept'}
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-700 font-bold">Approved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. BRANDING, LOGO & PHONE */}
      {activeSection === 'branding' && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-6 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                Store Logo, Media &amp; Phone Contact
              </h3>
              <p className="text-xs text-neutral-500">
                Printed on the 80mm thermal receipt and displayed across top navigation.
              </p>
            </div>
            {brandingToast && (
              <span className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg font-bold">
                {brandingToast}
              </span>
            )}
          </div>

          <form onSubmit={handleSaveBranding} className="space-y-4 max-w-2xl">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Store Name *</label>
              <input
                type="text"
                required
                value={storeNameInput}
                onChange={(e) => setStoreNameInput(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Store Logo Image URL</label>
              <div className="flex items-center gap-3">
                {logoUrlInput && (
                  <img
                    src={logoUrlInput}
                    alt="Logo"
                    className="w-12 h-12 object-contain rounded-xl border border-neutral-200"
                  />
                )}
                <input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={logoUrlInput}
                  onChange={(e) => setLogoUrlInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-neutral-300 rounded-xl font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Store Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={phoneNumberInput}
                  onChange={(e) => setPhoneNumberInput(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">WhatsApp Business Number</label>
                <input
                  type="tel"
                  value={whatsappNumberInput}
                  onChange={(e) => setWhatsappNumberInput(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Physical Store Address</label>
              <input
                type="text"
                value={storeAddressInput}
                onChange={(e) => setStoreAddressInput(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-xl"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl shadow-xs cursor-pointer"
            >
              Save Branding &amp; Contact
            </button>
          </form>
        </div>
      )}

      {/* 4. RECEIPT & SYSTEM SETTINGS */}
      {activeSection === 'all_settings' && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-6 text-xs max-w-3xl">
          <div className="border-b border-neutral-100 pb-3">
            <h3 className="text-base font-bold text-neutral-900">
              80mm Thermal Receipt &amp; System Configuration
            </h3>
            <p className="text-xs text-neutral-500">
              Fine-tune thermal slip roll parameters, paper ejection speed, and admin credentials.
            </p>
          </div>

          <div className="space-y-4">
            {/* Speed */}
            <div>
              <label className="block font-semibold text-neutral-800 mb-1">
                80mm Thermal Roll Paper Feed Speed
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['fast', 'normal', 'slow'] as const).map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => updateAdminOptions({ thermalPaperSlideSpeed: spd })}
                    className={`py-2 text-center rounded-xl font-bold uppercase transition-all cursor-pointer ${
                      (adminOptions?.thermalPaperSlideSpeed || 'normal') === spd
                        ? 'bg-neutral-900 text-white shadow-xs'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {spd}
                  </button>
                ))}
              </div>
            </div>

            {/* VAT Reg */}
            <div>
              <label className="block font-semibold text-neutral-800 mb-1">
                Store VAT / Tax Reg Number
              </label>
              <input
                type="text"
                value={receiptTaxInput}
                onChange={(e) => {
                  setReceiptTaxInput(e.target.value);
                  updateAdminOptions({ receiptTaxNumber: e.target.value });
                }}
                className="w-full px-3 py-2 border border-neutral-300 rounded-xl font-mono"
              />
            </div>

            {/* Receipt Footer */}
            <div>
              <label className="block font-semibold text-neutral-800 mb-1">
                Receipt Footer Policy Note
              </label>
              <textarea
                rows={2}
                value={receiptFooterInput}
                onChange={(e) => {
                  setReceiptFooterInput(e.target.value);
                  updateAdminOptions({ receiptFooterNote: e.target.value });
                }}
                className="w-full px-3 py-2 border border-neutral-300 rounded-xl"
              />
            </div>

            {/* Change Admin Password */}
            <div className="pt-4 border-t border-neutral-200 space-y-3">
              <h4 className="font-bold text-sm text-neutral-900">Update Administrator Password</h4>
              {passFeedback && (
                <div
                  className={`p-2.5 rounded-lg ${
                    passFeedback.success ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                  }`}
                >
                  {passFeedback.msg}
                </div>
              )}
              <form onSubmit={handlePasswordSubmit} className="space-y-2 max-w-sm">
                <input
                  type="password"
                  required
                  placeholder="Current Password"
                  value={currentPassInput}
                  onChange={(e) => setCurrentPassInput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg font-mono"
                />
                <input
                  type="password"
                  required
                  placeholder="New Password (min 6 chars)"
                  value={newPassInput}
                  onChange={(e) => setNewPassInput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 text-white font-bold rounded-lg cursor-pointer"
                >
                  Update Password
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
