import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { CartPanel } from './CartPanel';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';
import { AddCustomerModal } from '../customers/AddCustomerModal';
import {
  Search,
  Barcode,
  ShoppingBag,
  Sparkles,
  AlertTriangle,
  UserPlus,
  Package,
  Printer,
  Eye,
  Plus,
  Tag,
  X,
} from 'lucide-react';

export const RegisterTerminal: React.FC = () => {
  const {
    products,
    addToCart,
    currentStore,
    cart,
    activeReceiptOrder,
    setActiveReceiptOrder,
    isAddCustomerModalOpen,
    setIsAddCustomerModalOpen,
    formatMoney,
    currency,
    categories: dynamicCategories,
    addCategory,
    createTestReceiptOrder,
  } = usePOS();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [isPreviewReceiptOpen, setIsPreviewReceiptOpen] = useState(false);

  // Quick Add Category Modal state
  const [isAddCatOpen, setIsAddCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const categories = ['all', ...dynamicCategories];

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  const cartTotalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleOpenReceiptPreview = () => {
    if (activeReceiptOrder) {
      setIsPreviewReceiptOpen(true);
    } else {
      const previewOrder = createTestReceiptOrder();
      setActiveReceiptOrder(previewOrder);
      setIsPreviewReceiptOpen(true);
    }
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory(newCatName.trim());
    setSelectedCategory(newCatName.trim());
    setNewCatName('');
    setIsAddCatOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Product Catalog & Fast Checkout Register (7-8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          
          {/* Search, Barcode Scan & 80mm Receipt Preview Bar */}
          <div className="flex flex-wrap items-center gap-2.5 bg-white p-3 rounded-2xl border border-neutral-200 shadow-2xs">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search catalog by title, SKU or barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            <button
              onClick={() => setIsAddCustomerModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-semibold transition-colors shrink-0 shadow-2xs cursor-pointer"
              title="Add New Customer Profile"
            >
              <UserPlus className="w-3.5 h-3.5 text-neutral-600" />
              <span>+ Customer</span>
            </button>

            <button
              type="button"
              onClick={handleOpenReceiptPreview}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-neutral-100 text-neutral-900 border border-neutral-300 rounded-xl text-xs font-bold transition-colors shrink-0 shadow-2xs cursor-pointer"
              title="Preview 80mm Thermal Receipt with QR Code"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-600" />
              <span>80mm Receipt &amp; QR</span>
            </button>

            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition-colors shrink-0 shadow-xs cursor-pointer active:scale-95"
              title="Open Barcode Scanner (Camera & Laser Simulator)"
            >
              <Barcode className="w-4 h-4" />
              <span>Scan Barcode</span>
            </button>
          </div>

          {/* Category Tabs with "+ Add Category" button */}
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

            <button
              type="button"
              onClick={() => setIsAddCatOpen(true)}
              className="px-2.5 py-1.5 font-bold rounded-xl whitespace-nowrap transition-colors shrink-0 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-dashed border-neutral-300 flex items-center gap-1 cursor-pointer"
              title="Add New Category"
            >
              <Plus className="w-3 h-3 text-neutral-600" />
              <span>Add Category</span>
            </button>
          </div>

          {/* Product Cards Grid with Real Product Images, Sale Price, and Special Price */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredProducts.map((prod) => {
              const stockInCurrentStore = prod.stockByStore[currentStore.id] ?? 0;
              const isLowStock = stockInCurrentStore <= prod.lowStockThreshold && stockInCurrentStore > 0;
              const isOutOfStock = stockInCurrentStore === 0;
              const hasSpecial = prod.specialPrice !== undefined;
              const isSpecialActive = Boolean(prod.isSpecialActive && hasSpecial);

              return (
                <div
                  key={prod.id}
                  className={`flex flex-col text-left bg-white border rounded-2xl overflow-hidden p-3 transition-all text-xs group relative ${
                    isOutOfStock
                      ? 'opacity-65 border-neutral-200 bg-neutral-50/80'
                      : 'hover:border-neutral-400 hover:shadow-xs border-neutral-200'
                  }`}
                >
                  {/* Product Image Box */}
                  <div className="aspect-4/3 w-full bg-neutral-100 rounded-xl overflow-hidden relative mb-2 flex items-center justify-center border border-neutral-100">
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=600&h=450&q=80';
                      }}
                    />

                    {/* Special Price Promo Ribbon */}
                    {hasSpecial && (
                      <div className="absolute top-1.5 left-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-amber-500 text-white shadow-2xs flex items-center gap-0.5">
                          <Tag className="w-2.5 h-2.5" />
                          <span>Special Offer</span>
                        </span>
                      </div>
                    )}

                    {/* Stock Alert Status Badge */}
                    <div className="absolute bottom-1.5 right-1.5">
                      {isOutOfStock ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-600 text-white shadow-2xs">
                          Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500 text-white flex items-center gap-1 shadow-2xs">
                          <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                          <span>Low: {stockInCurrentStore}</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-white/90 backdrop-blur-xs text-neutral-800 shadow-2xs border border-neutral-200">
                          {stockInCurrentStore} in store
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metadata & Pricing Options (Sale Price vs Special Price) */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider mb-0.5">
                        {prod.category}
                      </p>
                      <h4 className="font-bold text-neutral-900 line-clamp-2 leading-tight">
                        {prod.name}
                      </h4>
                    </div>

                    {/* Pricing Breakdown */}
                    <div className="mt-2.5 pt-2 border-t border-neutral-100 space-y-1.5">
                      <div className="flex items-baseline justify-between">
                        <div>
                          {hasSpecial ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-bold font-mono text-amber-900 tabular-nums">
                                  {formatMoney(prod.specialPrice!)}
                                </span>
                                <span className="text-[10.5px] font-mono text-neutral-400 line-through">
                                  {formatMoney(prod.price)}
                                </span>
                              </div>
                              <span className="text-[9.5px] font-bold text-amber-700 block">
                                Save {formatMoney(prod.price - prod.specialPrice!)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm font-bold font-mono text-neutral-950 tabular-nums">
                              {formatMoney(prod.price)}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-neutral-400">{prod.sku}</span>
                      </div>

                      {/* Fast Add Action Buttons (Sale Price vs Special Price) */}
                      {!isOutOfStock ? (
                        <div className="pt-1 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => addToCart(prod, 1, false)}
                            className="flex-1 py-1 px-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-[11px] font-bold transition-all shadow-xs active:scale-95 cursor-pointer text-center"
                            title="Add item at standard Sale Price"
                          >
                            + Add ({formatMoney(prod.price)})
                          </button>
                          {hasSpecial && (
                            <button
                              type="button"
                              onClick={() => addToCart(prod, 1, true)}
                              className="py-1 px-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold transition-all shadow-xs active:scale-95 cursor-pointer text-center"
                              title="Add item at Special Price offer"
                            >
                              ★ Special
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-1 text-[11px] font-bold text-rose-600 bg-rose-50 rounded-lg">
                          Sold Out
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-10 text-center text-neutral-500 space-y-1">
              <Package className="w-10 h-10 text-neutral-300 mx-auto stroke-1" />
              <p className="text-sm font-bold text-neutral-800">No items match your query</p>
              <p className="text-xs text-neutral-400">
                Try searching with another keyword or add a new category.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Desktop Cart Panel (4-5 cols) */}
        <div className="hidden lg:block lg:col-span-5 xl:col-span-4 sticky top-20">
          <CartPanel
            onOpenPayment={() => setIsPaymentOpen(true)}
            onPreviewReceipt={handleOpenReceiptPreview}
          />
        </div>
      </div>

      {/* Quick Add Category Modal */}
      {isAddCatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200 bg-neutral-50">
              <h3 className="text-sm font-bold text-neutral-900">Add New Category</h3>
              <button
                type="button"
                onClick={() => setIsAddCatOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Produce, Electronics, Spices"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCatOpen(false)}
                  className="px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-900 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 shadow-xs cursor-pointer"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Floating Cart Summary Button */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-30">
        <button
          onClick={() => setShowMobileCart(true)}
          className="w-full bg-neutral-900 text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between font-bold text-sm cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            <span>Order Cart ({cartTotalItems} items)</span>
          </div>
          <span className="font-mono">
            {formatMoney(cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0))}
          </span>
        </button>
      </div>

      {/* Mobile Cart Drawer Modal */}
      {showMobileCart && (
        <div className="lg:hidden fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom">
            <div className="flex justify-between items-center px-5 py-3.5 border-b border-neutral-200">
              <h3 className="font-bold text-sm text-neutral-900">Current Order Cart</h3>
              <button
                onClick={() => setShowMobileCart(false)}
                className="text-neutral-500 hover:text-neutral-900 text-xs font-bold px-2 py-1 cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <CartPanel
                onOpenPayment={() => {
                  setShowMobileCart(false);
                  setIsPaymentOpen(true);
                }}
                onPreviewReceipt={() => {
                  setShowMobileCart(false);
                  handleOpenReceiptPreview();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />

      {/* Payment Processing Modal */}
      <PaymentModal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} />

      {/* 80mm Thermal Receipt Modal with Print, Cancel and Post-Sale QR Code */}
      {(activeReceiptOrder || isPreviewReceiptOpen) && (
        <ReceiptModal
          order={activeReceiptOrder || createTestReceiptOrder()}
          onClose={() => {
            setActiveReceiptOrder(null);
            setIsPreviewReceiptOpen(false);
          }}
        />
      )}

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={isAddCustomerModalOpen}
        onClose={() => setIsAddCustomerModalOpen(false)}
      />
    </div>
  );
};
