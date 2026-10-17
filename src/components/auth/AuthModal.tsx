import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { BuyerType } from '../../types/pos';
import {
  X,
  Lock,
  Mail,
  Shield,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Clock,
  ShoppingBag,
  Store,
  KeyRound,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessNavigate?: (tab: string) => void;
  initialTab?: 'buyer_login' | 'buyer_register' | 'admin_login';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccessNavigate,
  initialTab = 'admin_login',
}) => {
  const { loginWithMasterAdmin, loginCustomer, registerPublicBuyer } = usePOS();
  const [activeTab, setActiveTab] = useState<'buyer_login' | 'buyer_register' | 'admin_login'>(initialTab);

  // Buyer Login State
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPassword, setBuyerPassword] = useState('');

  // Buyer Registration State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regBuyerType, setRegBuyerType] = useState<BuyerType>('product_buyer');
  const [regBusinessName, setRegBusinessName] = useState('');
  const [regDeliveryAddress, setRegDeliveryAddress] = useState('');

  // Admin Login State (Empty - hidden credentials)
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Feedback State
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingApprovalInfo, setPendingApprovalInfo] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleBuyerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setPendingApprovalInfo(null);
    const res = loginCustomer(buyerEmail, buyerPassword);
    if (!res.success) {
      if (res.pendingApproval) {
        setPendingApprovalInfo(res.message);
      } else {
        setErrorMessage(res.message);
      }
      return;
    }
    setSuccessMessage(res.message);
    setTimeout(() => {
      onClose();
      if (onSuccessNavigate) onSuccessNavigate('storefront');
    }, 1000);
  };

  const handleBuyerRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setPendingApprovalInfo(null);
    if (!regName.trim() || !regEmail.trim() || !regPhone.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }
    const res = registerPublicBuyer({
      name: regName,
      email: regEmail,
      phone: regPhone,
      password: regPassword || 'password123',
      buyerType: regBuyerType,
      businessName: regBusinessName,
      deliveryAddress: regDeliveryAddress,
    });
    if (!res.success) {
      setErrorMessage(res.message);
      return;
    }
    setPendingApprovalInfo(
      'Registration submitted! Your account is currently awaiting confirmation from the Administrator. You will be able to log in once approved.'
    );
    setRegName('');
    setRegEmail('');
    setRegPhone('');
    setRegPassword('');
    setRegBusinessName('');
    setRegDeliveryAddress('');
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setPendingApprovalInfo(null);
    const res = loginWithMasterAdmin(adminEmail, adminPassword);
    if (!res.success) {
      setErrorMessage(res.message);
      return;
    }
    setSuccessMessage('Administrator authenticated successfully!');
    setTimeout(() => {
      onClose();
      if (onSuccessNavigate) onSuccessNavigate('admin');
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
          <div>
            <h3 className="text-base font-bold text-neutral-900">
              {activeTab === 'admin_login'
                ? 'Administrator Authentication Portal'
                : activeTab === 'buyer_register'
                ? 'Buyer Registration'
                : 'Buyer Account Login'}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              {activeTab === 'admin_login'
                ? 'Enter credentials for headquarters access & review'
                : 'Customer and commercial buyer access'}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-5 pt-2.5 bg-neutral-100/70 border-b border-neutral-200 flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('admin_login');
              setErrorMessage(null);
              setSuccessMessage(null);
              setPendingApprovalInfo(null);
            }}
            className={`px-3 py-2 font-bold rounded-t-lg transition-colors border-b-2 flex items-center gap-1 cursor-pointer ${
              activeTab === 'admin_login'
                ? 'bg-white border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Admin Portal</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('buyer_login');
              setErrorMessage(null);
              setSuccessMessage(null);
              setPendingApprovalInfo(null);
            }}
            className={`px-3 py-2 font-bold rounded-t-lg transition-colors border-b-2 cursor-pointer ${
              activeTab === 'buyer_login'
                ? 'bg-white border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Buyer Login
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('buyer_register');
              setErrorMessage(null);
              setSuccessMessage(null);
              setPendingApprovalInfo(null);
            }}
            className={`px-3 py-2 font-bold rounded-t-lg transition-colors border-b-2 cursor-pointer ${
              activeTab === 'buyer_register'
                ? 'bg-white border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Register as Buyer
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto text-xs flex-1">
          {/* Notifications */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
          {pendingApprovalInfo && (
            <div className="p-4 bg-amber-50 border border-amber-300 text-amber-950 rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Account Awaiting Administrator Confirmation</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                {pendingApprovalInfo}
              </p>
            </div>
          )}

          {/* ADMIN LOGIN FORM */}
          {activeTab === 'admin_login' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              {/* Secure Admin Portal Notice */}
              <div className="p-3.5 bg-neutral-900 text-white rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-emerald-400 shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-xs text-white">Administrator Portal</p>
                  <p className="text-[11px] text-neutral-400">
                    Restricted management access for authorized store personnel only.
                  </p>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Administrator Email *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="admin@domain.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Administrator Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verify Admin Credentials &amp; Enter</span>
              </button>
            </form>
          )}

          {/* BUYER LOGIN */}
          {activeTab === 'buyer_login' && (
            <form onSubmit={handleBuyerLogin} className="space-y-3.5">
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-600">
                <p className="font-bold text-neutral-900">Public Customer Sign In</p>
                <p className="text-[11px] text-neutral-500">
                  Accounts must be confirmed by the Administrator before logging in.
                </p>
              </div>
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="your.email@example.com"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Enter password"
                  value={buyerPassword}
                  onChange={(e) => setBuyerPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl font-mono"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
              >
                Log In to Buyer Portal
              </button>
            </form>
          )}

          {/* BUYER REGISTRATION */}
          {activeTab === 'buyer_register' && (
            <form onSubmit={handleBuyerRegister} className="space-y-3.5">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1.5">Select Buyer Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegBuyerType('product_buyer')}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer ${
                      regBuyerType === 'product_buyer'
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-xs">Product Buyer</p>
                      <p className="text-[10px] text-neutral-400">Retail goods &amp; COD</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegBuyerType('pos_buyer')}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer ${
                      regBuyerType === 'pos_buyer'
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <Store className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-xs">POS Buyer</p>
                      <p className="text-[10px] text-neutral-400">POS terminals &amp; licenses</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Your Full Name"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+94 77 000 0000"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="your.email@business.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
              >
                Submit Registration for Confirmation
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
