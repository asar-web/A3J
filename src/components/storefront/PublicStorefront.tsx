import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { Product, CodDetails, Order, BuyerType } from '../../types/pos';
import {
  ShoppingBag,
  Search,
  Truck,
  X,
  Printer,
  Store,
  Barcode,
  WifiOff,
  Layers,
  UserPlus,
  Clock,
  Phone,
  MapPin,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';
import { ReceiptModal } from '../pos/ReceiptModal';

interface PublicStorefrontProps {
  onNavigateToPOS: () => void;
  onOpenScanner?: () => void;
  onOpenAuth?: (tab: 'buyer_login' | 'buyer_register' | 'admin_login') => void;
  onNavigateToTracking?: (query?: string) => void;
}

export const PublicStorefront: React.FC<PublicStorefrontProps> = ({
  onNavigateToPOS,
  onOpenScanner,
  onOpenAuth,
  onNavigateToTracking,
}) => {
  const {
    products,
    stores,
    currentStore,
    formatMoney,
    currency,
    processPublicCODOrder,
    categories: dynamicCategories,
    branding,
    registerPublicBuyer,
    loginCustomer,
  } = usePOS();

  const [viewingMode, setViewingMode] = useState<'product_buyers' | 'pos_buyers'>('product_buyers');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [quickTrackInput, setQuickTrackInput] = useState('');

  // COD Order State
  const [codTargetProduct, setCodTargetProduct] = useState<Product | null>(null);
  const [codQty, setCodQty] = useState(1);
  const [codRecipientName, setCodRecipientName] = useState('');
  const [codRecipientPhone, setCodRecipientPhone] = useState('');
  const [codAddress, setCodAddress] = useState('');
  const [codCity, setCodCity] = useState(currentStore.city);
  const [codPostalCode, setCodPostalCode] = useState('00100');
  const [codNotes, setCodNotes] = useState('');
  const [isSubmittingCOD, setIsSubmittingCOD] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Registration State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regBuyerType, setRegBuyerType] = useState<BuyerType>('product_buyer');
  const [regBusinessName, setRegBusinessName] = useState('');
  const [regDeliveryAddress, setRegDeliveryAddress] = useState('');
  const [regFeedback, setRegFeedback] = useState<{ message: string; isError: boolean; pending?: boolean } | null>(null);

  const categories = ['all', ...dynamicCategories];

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      p.description.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(catalogSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegFeedback(null);
    if (!regName.trim() || !regEmail.trim() || !regPhone.trim()) {
      setRegFeedback({ message: 'Please provide full name, email, and mobile phone.', isError: true });
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
      setRegFeedback({ message: res.message, isError: true });
    } else {
      setRegFeedback({
        message:
          'Registration submitted! Your account is currently awaiting Administrator confirmation. Once approved, you will be able to log in to your account.',
        isError: false,
        pending: true,
      });
      setRegName('');
      setRegEmail('');
      setRegPhone('');
      setRegPassword('');
      setRegBusinessName('');
      setRegDeliveryAddress('');
    }
  };

  const handleExecutePublicCOD = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codTargetProduct || !codRecipientName.trim() || !codAddress.trim()) return;
    setIsSubmittingCOD(true);
    try {
      const codDetails: CodDetails = {
        recipientName: codRecipientName.trim(),
        recipientPhone: codRecipientPhone.trim() || '+94 77 000 0000',
        deliveryAddress: codAddress.trim(),
        city: codCity.trim() || currentStore.city,
        postalCode: codPostalCode.trim() || '00100',
        deliveryInstructions: codNotes.trim() || undefined,
        collectionStatus: 'pending_collection',
      };
      const newOrder = await processPublicCODOrder(
        [{ product: codTargetProduct, quantity: codQty, discountPercent: 0 }],
        codDetails
      );
      setConfirmedOrder(newOrder);
      setCodTargetProduct(null);
      setCodRecipientName('');
      setCodRecipientPhone('');
      setCodAddress('');
      setCodNotes('');
    } finally {
      setIsSubmittingCOD(false);
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Showcase */}
      <section className="relative bg-neutral-900 text-white border-b border-neutral-800 overflow-hidden">
        {branding.bannerImageUrl && (
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <img
              src={branding.bannerImageUrl}
              alt="Store Showcase"
              className="w-full h-full object-cover filter blur-xs"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-900/90 to-neutral-950" />
          </div>
        )}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono tracking-wider uppercase text-neutral-400">
                <span className="px-2 py-0.5 rounded bg-neutral-800/90 border border-neutral-700 text-neutral-300">
                  PUBLIC VIEWING PORTAL
                </span>
                <span>·</span>
                <span className="text-emerald-400 font-bold">Currency: {currency.code} ({currency.symbol})</span>
              </div>

              {/* Brand Wordmark & Logo */}
              <div className="flex items-center gap-4">
                {branding.logoUrl && (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1.5 shadow-lg border border-neutral-700 shrink-0 overflow-hidden flex items-center justify-center">
                    <img
                      src={branding.logoUrl}
                      alt={branding.storeName || 'Store Logo'}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div>
                  <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                    {branding.storeName || 'Aura Retail POS'}
                  </h1>
                  {branding.heroTitle && (
                    <p className="text-xs sm:text-sm font-semibold text-emerald-400 mt-1 font-mono">
                      {branding.heroTitle}
                    </p>
                  )}
                </div>
              </div>

              <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
                {branding.heroSubtitle ||
                  'Explore our catalog as a Product Buyer or examine multi-store registers and 80mm thermal receipts as a POS Buyer.'}
              </p>

              {/* Store Contact: Phone & WhatsApp */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                {branding.phoneNumber && (
                  <a
                    href={`tel:${branding.phoneNumber}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-mono font-bold transition-colors border border-neutral-700 shadow-xs"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{branding.phoneNumber}</span>
                  </a>
                )}
                {branding.whatsappNumber && (
                  <a
                    href={`https://wa.me/${branding.whatsappNumber.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-bold transition-colors border border-emerald-800/60 shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp Chat</span>
                  </a>
                )}
                {(branding.storeAddress || currentStore.address) && (
                  <div className="inline-flex items-center gap-1.5 text-neutral-400 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <span className="truncate max-w-xs">{branding.storeAddress || currentStore.address}</span>
                  </div>
                )}
              </div>

              {/* Mode Switcher Tabs */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setViewingMode('product_buyers')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    viewingMode === 'product_buyers'
                      ? 'bg-white text-neutral-900 shadow-md'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  <span>Product Buyers Viewing Interface</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingMode('pos_buyers')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    viewingMode === 'pos_buyers'
                      ? 'bg-white text-neutral-900 shadow-md'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  <Store className="w-4 h-4 text-indigo-400" />
                  <span>POS Buyers Viewing Interface</span>
                </button>
              </div>

              {/* Live Order Tracking Lookup Bar */}
              {onNavigateToTracking && (
                <div className="pt-1">
                  <div className="flex flex-wrap items-center gap-2 bg-neutral-800/90 border border-neutral-700/80 rounded-2xl p-2 max-w-lg">
                    <div className="flex items-center gap-2 flex-1 px-2 min-w-[200px]">
                      <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <input
                        type="text"
                        placeholder="Enter Tracking # (TRK-...) or Receipt # to track..."
                        value={quickTrackInput}
                        onChange={(e) => setQuickTrackInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && quickTrackInput.trim()) {
                            onNavigateToTracking(quickTrackInput.trim());
                          }
                        }}
                        className="bg-transparent text-white placeholder-neutral-400 focus:outline-none font-mono text-xs w-full"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (quickTrackInput.trim()) {
                          onNavigateToTracking(quickTrackInput.trim());
                        } else {
                          onNavigateToTracking();
                        }
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Track Parcel</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Registration Jump Card */}
            <div className="bg-neutral-800/80 p-5 rounded-2xl border border-neutral-700 space-y-3 shrink-0 max-w-xs w-full">
              <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold tracking-wider">
                BUYER ACCOUNT ENROLLMENT
              </span>
              <h4 className="font-bold text-sm text-white">Join as a Verified Buyer</h4>
              <p className="text-[11px] text-neutral-300 leading-relaxed">
                After browsing products or POS terminal tools, register your account below. New accounts are confirmed by our administrator.
              </p>
              <a
                href="#registration-section"
                className="w-full py-2 px-3 bg-neutral-100 hover:bg-white text-neutral-900 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Go to Buyer Registration</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 1. PRODUCT BUYERS VIEW */}
      {viewingMode === 'product_buyers' && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-neutral-200">
            <div>
              <span className="text-xs font-mono uppercase text-neutral-500 font-bold">
                Product Buyer Catalog · All Prices in {currency.code}
              </span>
              <h2 className="text-2xl font-bold text-neutral-900 tracking-tight mt-0.5">
                Artisanal Goods &amp; Cash On Delivery (COD)
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Browse our real-time stock across branches ({currentStore.name}). Select any item to place a Cash On Delivery order.
              </p>
            </div>
            <div className="w-full sm:w-72 relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 shadow-2xs font-semibold"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 font-semibold rounded-xl whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                {cat === 'all' ? 'All Catalog' : cat}
              </button>
            ))}
          </div>

          {/* Products Grid with Photos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const stockInSelectedBranch = product.stockByStore[currentStore.id] ?? 0;
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs hover:border-neutral-300 transition-all flex flex-col group"
                >
                  <div className="aspect-4/3 bg-neutral-100 overflow-hidden relative border-b border-neutral-100 flex items-center justify-center">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=600&h=450&q=80';
                      }}
                    />
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white/90 backdrop-blur-xs text-neutral-800 shadow-2xs border border-neutral-200">
                        {product.category}
                      </span>
                    </div>
                    <div className="absolute top-2 right-2">
                      {stockInSelectedBranch > 0 ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500 text-white shadow-2xs">
                          In Stock ({stockInSelectedBranch})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-500 text-white shadow-2xs">
                          Out of Stock
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-bold text-neutral-900 text-sm leading-snug">{product.name}</h3>
                      <p className="text-xs text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-neutral-400 font-mono uppercase font-semibold">
                          Price ({currency.code})
                        </span>
                        <p className="text-base font-mono font-extrabold text-neutral-950">
                          {formatMoney(product.price)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCodTargetProduct(product)}
                        className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                      >
                        <Truck className="w-3.5 h-3.5 text-amber-400" />
                        <span>Order COD</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 2. POS BUYERS VIEW */}
      {viewingMode === 'pos_buyers' && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in">
          <div className="pb-2 border-b border-neutral-200">
            <span className="text-xs font-mono uppercase text-indigo-700 font-bold">
              POS Buyer Architecture &amp; 80mm Thermal Printing
            </span>
            <h2 className="text-2xl font-bold text-neutral-900 tracking-tight mt-0.5">
              Retail Mobile POS System Capabilities
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Engineered with realistic 80mm thermal receipt previews, dynamic item scaling, LKR currency, and uninterrupted offline synchronization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
                <Printer className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="font-bold text-base text-neutral-900">80mm Thermal Roll Receipts</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Realistic thermal roll preview modal with tactile paper feed animation, stepper motor audio, and print/cancel actions.
              </p>
              <button
                type="button"
                onClick={onNavigateToPOS}
                className="text-xs font-bold text-neutral-900 underline hover:text-neutral-700 pt-1 cursor-pointer"
              >
                Launch Register Terminal &rarr;
              </button>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
                <Barcode className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="font-bold text-base text-neutral-900">Live Barcode Scanning</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Optical camera feed with laser reticle and hardware laser scanner support. Instant scan-to-cart in register terminal and 1-tap stock auditing.
              </p>
              <button
                type="button"
                onClick={onOpenScanner}
                className="text-xs font-bold text-neutral-900 underline hover:text-neutral-700 pt-1 cursor-pointer"
              >
                Launch Barcode Scanner &rarr;
              </button>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
                <WifiOff className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="font-bold text-base text-neutral-900">Offline Local Buffer</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Cashiers continue checking out customers during network outages. Orders buffer in local storage and reconcile automatically with cloud ledger upon reconnection.
              </p>
              <button
                type="button"
                onClick={onNavigateToPOS}
                className="text-xs font-bold text-neutral-900 underline hover:text-neutral-700 pt-1 cursor-pointer"
              >
                Test Offline POS &rarr;
              </button>
            </div>
          </div>
        </section>
      )}

      {/* REGISTRATION SECTION */}
      <section id="registration-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-md p-6 sm:p-10 space-y-6">
          <div className="max-w-2xl">
            <span className="text-xs font-mono uppercase text-emerald-800 font-bold">
              PUBLIC REGISTRATION PORTAL
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight mt-1">
              Register as Product Buyer / POS Buyer
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1.5 leading-relaxed">
              Complete registration to request access. All public registrations undergo Administrator confirmation before login access is activated.
            </p>
          </div>

          {regFeedback && (
            <div
              className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                regFeedback.isError
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-amber-50 border-amber-300 text-amber-950'
              }`}
            >
              <div className="flex items-center gap-2 font-bold mb-1">
                {regFeedback.isError ? (
                  <X className="w-4 h-4 text-rose-600" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-600" />
                )}
                <span>{regFeedback.pending ? 'Awaiting Administrator Confirmation' : 'Notification'}</span>
              </div>
              <p>{regFeedback.message}</p>
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs max-w-3xl">
            <div>
              <label className="block font-bold text-neutral-800 mb-2">Select Buyer Profile *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRegBuyerType('product_buyer')}
                  className={`p-3.5 rounded-2xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                    regBuyerType === 'product_buyer'
                      ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                      : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-800'
                  }`}
                >
                  <ShoppingBag className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
                  <div>
                    <p className="font-bold text-xs">Retail Product Buyer</p>
                    <p className={`text-[11px] mt-0.5 ${regBuyerType === 'product_buyer' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      Orders retail catalog goods and Cash on Delivery provisions.
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setRegBuyerType('pos_buyer')}
                  className={`p-3.5 rounded-2xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                    regBuyerType === 'pos_buyer'
                      ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                      : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-800'
                  }`}
                >
                  <Store className="w-5 h-5 shrink-0 mt-0.5 text-indigo-400" />
                  <div>
                    <p className="font-bold text-xs">POS System Buyer / Store Owner</p>
                    <p className={`text-[11px] mt-0.5 ${regBuyerType === 'pos_buyer' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      Requests retail POS terminal deployment and store license.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nalinda Jayawardena"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Mobile Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+94 77 123 4567"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="buyer@business.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Create Password *</label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl font-mono"
                />
              </div>
            </div>

            {regBuyerType === 'pos_buyer' && (
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Business / Retail Store Name</label>
                <input
                  type="text"
                  placeholder="Store or Company Name"
                  value={regBusinessName}
                  onChange={(e) => setRegBusinessName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl"
                />
              </div>
            )}

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Delivery / Invoicing Address</label>
              <input
                type="text"
                placeholder="Street address, city, postal code"
                value={regDeliveryAddress}
                onChange={(e) => setRegDeliveryAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-[11px] text-neutral-500">
                Protected registration: Accounts confirmed by Admin prior to login.
              </p>
              <button
                type="submit"
                className="px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
              >
                Submit Buyer Registration
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Cash On Delivery Checkout Modal */}
      {codTargetProduct && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-neutral-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm text-neutral-900">Cash On Delivery (COD) Checkout</h3>
              </div>
              <button
                onClick={() => setCodTargetProduct(null)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecutePublicCOD} className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                <div className="flex items-center gap-3">
                  <img
                    src={codTargetProduct.imageUrl}
                    alt={codTargetProduct.name}
                    className="w-12 h-12 object-cover rounded-lg border border-neutral-200"
                  />
                  <div>
                    <p className="font-bold text-neutral-900">{codTargetProduct.name}</p>
                    <p className="text-[11px] text-neutral-500 font-mono">
                      {formatMoney(codTargetProduct.price)} each
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-700">Qty:</span>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={codQty}
                    onChange={(e) => setCodQty(parseInt(e.target.value) || 1)}
                    className="w-14 px-2 py-1 font-mono font-bold text-center border border-neutral-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Recipient Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={codRecipientName}
                    onChange={(e) => setCodRecipientName(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Recipient Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+94 77 123 4567"
                    value={codRecipientPhone}
                    onChange={(e) => setCodRecipientPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Delivery Street Address *</label>
                <input
                  type="text"
                  required
                  placeholder="Street address, building, apartment number"
                  value={codAddress}
                  onChange={(e) => setCodAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl"
                />
              </div>

              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-amber-950">Cash to Collect on Delivery</p>
                  <p className="text-[11px] text-amber-800">
                    Includes automated VAT / sales tax ({currentStore.taxRate}%)
                  </p>
                </div>
                <span className="text-base font-mono font-bold text-amber-950 tabular-nums">
                  {formatMoney(
                    codTargetProduct.price * codQty +
                      (codTargetProduct.taxExempt
                        ? 0
                        : (codTargetProduct.price * codQty * currentStore.taxRate) / 100)
                  )}
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCodTargetProduct(null)}
                  className="px-4 py-2 text-neutral-600 hover:text-neutral-900 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCOD || !codRecipientName.trim() || !codAddress.trim()}
                  className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingCOD ? 'Generating Receipt...' : 'Confirm COD & Preview 80mm Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 80mm THERMAL RECEIPT MODAL UPON ORDER CONFIRMATION */}
      {confirmedOrder && (
        <>
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full px-4">
            <div className="bg-emerald-950 text-white p-4 rounded-2xl shadow-2xl border border-emerald-700 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-bold text-xs">Order Placed Successfully!</p>
                  <p className="text-[11px] text-emerald-300 font-mono">
                    Tracking: {confirmedOrder.trackingNumber || confirmedOrder.receiptNumber}
                  </p>
                </div>
              </div>
              {onNavigateToTracking && (
                <button
                  type="button"
                  onClick={() => {
                    const query = confirmedOrder.trackingNumber || confirmedOrder.receiptNumber;
                    setConfirmedOrder(null);
                    onNavigateToTracking(query);
                  }}
                  className="px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-neutral-950 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Track Parcel</span>
                </button>
              )}
            </div>
          </div>

          <ReceiptModal
            order={confirmedOrder}
            onClose={() => setConfirmedOrder(null)}
          />
        </>
      )}
    </div>
  );
};
