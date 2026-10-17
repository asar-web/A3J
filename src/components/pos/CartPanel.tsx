import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  Trash2,
  Plus,
  Minus,
  UserCheck,
  UserPlus,
  Tag,
  Receipt,
  Gift,
  X,
  CreditCard,
  Eye,
  Sparkles,
} from 'lucide-react';

interface CartPanelProps {
  onOpenPayment: () => void;
  onPreviewReceipt?: () => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({ onOpenPayment, onPreviewReceipt }) => {
  const {
    cart,
    removeFromCart,
    updateCartQuantity,
    toggleCartItemSpecialPrice,
    setCartItemDiscount,
    clearCart,
    activeLoyaltyCustomer,
    setActiveLoyaltyCustomer,
    customers,
    redeemedPoints,
    setRedeemedPoints,
    loyaltyConfig,
    subtotal,
    discountTotal,
    taxRate,
    taxAmount,
    loyaltyDiscountAmount,
    cartSpecialSavingsTotal,
    grandTotal,
    pointsToEarn,
    currentStore,
    formatMoney,
    currency,
    setIsAddCustomerModalOpen,
  } = usePOS();

  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [activeDiscountItemId, setActiveDiscountItemId] = useState<string | null>(null);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch) ||
      c.email.toLowerCase().includes(customerSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white border border-neutral-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Top Cart Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-200 bg-neutral-50/70">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-neutral-800" />
          <h2 className="text-sm font-bold text-neutral-900">Current Order Register</h2>
          <span className="text-xs text-neutral-500 font-mono">
            ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)
          </span>
        </div>
        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-rose-600 hover:text-rose-800 font-semibold transition-colors cursor-pointer"
          >
            Clear Cart
          </button>
        )}
      </div>

      {/* Customer & Loyalty Profile Header */}
      <div className="px-4 py-2.5 border-b border-neutral-100 bg-neutral-50/40">
        {activeLoyaltyCustomer ? (
          <div className="flex items-center justify-between bg-neutral-100/90 px-3 py-2 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <div>
                <p className="font-bold text-neutral-900">{activeLoyaltyCustomer.name}</p>
                <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-mono">
                  <span>Balance: {activeLoyaltyCustomer.loyaltyPoints} pts</span>
                  <span className="text-emerald-700 font-bold">+{pointsToEarn} pts</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveLoyaltyCustomer(null);
                setRedeemedPoints(0);
              }}
              className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
              title="Detach customer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Attach customer / phone..."
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setShowCustomerDropdown(true);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                className="w-full text-xs px-3 py-1.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
              />
              <button
                type="button"
                onClick={() => setIsAddCustomerModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors shadow-2xs cursor-pointer"
                title="Add New Customer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add</span>
              </button>
            </div>
            {/* Customer Dropdown */}
            {showCustomerDropdown && customerSearch.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg z-30 max-h-48 overflow-y-auto">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((cust) => (
                    <button
                      key={cust.id}
                      type="button"
                      onClick={() => {
                        setActiveLoyaltyCustomer(cust);
                        setShowCustomerDropdown(false);
                        setCustomerSearch('');
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-50 border-b border-neutral-100 last:border-0 flex justify-between items-center cursor-pointer"
                    >
                      <div>
                        <p className="font-semibold text-neutral-900">{cust.name}</p>
                        <p className="text-[11px] text-neutral-500">{cust.phone}</p>
                      </div>
                      <span className="text-[11px] font-mono text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                        {cust.loyaltyPoints} pts
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-xs text-neutral-500 text-center">
                    <p>No customer found.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomerDropdown(false);
                        setIsAddCustomerModalOpen(true);
                      }}
                      className="text-xs text-neutral-900 font-bold underline mt-1 block w-full cursor-pointer"
                    >
                      + Add &quot;{customerSearch}&quot; as New Customer
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Loyalty Points Redemption */}
        {activeLoyaltyCustomer && activeLoyaltyCustomer.loyaltyPoints >= 100 && (
          <div className="mt-2 p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1 font-bold text-amber-950">
                <Gift className="w-3.5 h-3.5 text-amber-700" />
                Redeem Rewards Voucher
              </span>
              <span className="font-mono font-bold text-amber-900">
                {redeemedPoints} pts = -{formatMoney(redeemedPoints * loyaltyConfig.redemptionRate)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setRedeemedPoints(0)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors cursor-pointer ${
                  redeemedPoints === 0
                    ? 'bg-amber-900 text-white border-amber-900'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                None
              </button>
              {activeLoyaltyCustomer.loyaltyPoints >= 100 && (
                <button
                  type="button"
                  onClick={() => setRedeemedPoints(100)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors cursor-pointer ${
                    redeemedPoints === 100
                      ? 'bg-amber-900 text-white border-amber-900'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  100 pts (-{formatMoney(5)})
                </button>
              )}
              {activeLoyaltyCustomer.loyaltyPoints >= 200 && (
                <button
                  type="button"
                  onClick={() => setRedeemedPoints(200)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors cursor-pointer ${
                    redeemedPoints === 200
                      ? 'bg-amber-900 text-white border-amber-900'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  200 pts (-{formatMoney(10)})
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cart Line Items List with Product Images and Special Price Toggles */}
      <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 p-2">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-neutral-400">
            <Receipt className="w-10 h-10 mb-2 stroke-1 text-neutral-300" />
            <p className="text-sm font-semibold text-neutral-700">Order Cart Empty</p>
            <p className="text-xs text-neutral-400 mt-1 max-w-xs leading-relaxed">
              Add catalog goods or scan product barcodes to build customer order.
            </p>
          </div>
        ) : (
          cart.map((item) => {
            const hasSpecialPrice = item.product.specialPrice !== undefined;
            const isUsingSpecial = Boolean(item.useSpecialPrice && hasSpecialPrice);
            const activeUnitPrice = isUsingSpecial
              ? item.product.specialPrice!
              : item.customPrice !== undefined
              ? item.customPrice
              : item.product.price;

            const lineGross = activeUnitPrice * item.quantity;
            const lineDiscountAmount = (lineGross * (item.discountPercent || 0)) / 100;
            const lineNet = lineGross - lineDiscountAmount;

            return (
              <div key={item.product.id} className="py-2.5 px-2 hover:bg-neutral-50/80 rounded-xl group transition-colors">
                <div className="flex items-start justify-between gap-2.5">
                  {/* Product Image Thumbnail */}
                  <div className="w-11 h-11 rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=160&h=160&q=80';
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-neutral-900 truncate leading-snug">
                      {item.product.name}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 font-mono mt-0.5 flex-wrap">
                      <span className={isUsingSpecial ? 'text-amber-800 font-bold' : ''}>
                        {formatMoney(activeUnitPrice)}
                      </span>
                      {isUsingSpecial && (
                        <span className="text-[10px] text-neutral-400 line-through">
                          {formatMoney(item.product.price)}
                        </span>
                      )}
                      <span>·</span>
                      <span>{item.product.sku}</span>
                      {hasSpecialPrice && (
                        <button
                          type="button"
                          onClick={() => toggleCartItemSpecialPrice(item.product.id)}
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                            isUsingSpecial
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200'
                          }`}
                          title="Toggle Special Promo Price"
                        >
                          {isUsingSpecial ? '★ Special Price ON' : 'Use Special Price'}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono font-bold text-neutral-900 tabular-nums">
                      {formatMoney(lineNet)}
                    </p>
                    {item.discountPercent ? (
                      <p className="text-[10px] font-mono text-emerald-700">
                        -{item.discountPercent}% off
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Quantity Controls & Line Discount Button */}
                <div className="flex items-center justify-between mt-2 pt-1 pl-13">
                  <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-0.5">
                    <button
                      onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                      className="p-1 hover:bg-white rounded transition-colors text-neutral-600 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center font-mono text-xs font-bold text-neutral-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                      className="p-1 hover:bg-white rounded transition-colors text-neutral-600 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setActiveDiscountItemId(
                          activeDiscountItemId === item.product.id ? null : item.product.id
                        )
                      }
                      className="text-[11px] flex items-center gap-1 text-neutral-600 hover:text-neutral-900 p-1 font-medium cursor-pointer"
                      title="Apply item discount"
                    >
                      <Tag className="w-3 h-3 text-neutral-500" />
                      <span>{item.discountPercent ? `${item.discountPercent}%` : 'Discount'}</span>
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {activeDiscountItemId === item.product.id && (
                  <div className="mt-2 p-2 bg-neutral-100 rounded-lg flex items-center gap-1 text-xs">
                    <span className="text-[11px] text-neutral-600 mr-1 font-semibold">Discount:</span>
                    {[0, 5, 10, 15, 20].map((pct) => (
                      <button
                        key={pct}
                        onClick={() => {
                          setCartItemDiscount(item.product.id, pct);
                          setActiveDiscountItemId(null);
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                          item.discountPercent === pct
                            ? 'bg-neutral-900 text-white'
                            : 'bg-white text-neutral-700 hover:bg-neutral-200'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Financials in LKR & Action Buttons */}
      <div className="p-4 bg-neutral-50 border-t border-neutral-200 space-y-2">
        <div className="space-y-1.5 text-xs text-neutral-600 font-mono">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="tabular-nums font-semibold">{formatMoney(subtotal)}</span>
          </div>
          {discountTotal > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Item Discounts</span>
              <span className="tabular-nums font-semibold">-{formatMoney(discountTotal)}</span>
            </div>
          )}
          {cartSpecialSavingsTotal > 0 && (
            <div className="flex justify-between text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              <span className="font-sans font-bold flex items-center gap-1">
                <span>★ Special Deal Savings</span>
              </span>
              <span className="tabular-nums font-bold font-mono">-{formatMoney(cartSpecialSavingsTotal)}</span>
            </div>
          )}
          {loyaltyDiscountAmount > 0 && (
            <div className="flex justify-between text-amber-800">
              <span>Loyalty Voucher</span>
              <span className="tabular-nums font-semibold">-{formatMoney(loyaltyDiscountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>
              Tax ({taxRate}% · {currentStore.city})
            </span>
            <span className="tabular-nums font-semibold">{formatMoney(taxAmount)}</span>
          </div>
          <div className="pt-2 border-t border-neutral-200 flex justify-between items-baseline text-sm font-bold text-neutral-900">
            <span className="font-sans">Total Due ({currency.code})</span>
            <span className="text-lg font-mono tabular-nums text-neutral-950 font-extrabold">
              {formatMoney(grandTotal)}
            </span>
          </div>
        </div>

        {/* Buttons: Checkout & Preview 80mm Receipt */}
        <div className="pt-2 space-y-2">
          <button
            onClick={onOpenPayment}
            disabled={cart.length === 0}
            className="w-full py-3 px-4 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.99] cursor-pointer"
          >
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span>Charge / Collect {formatMoney(grandTotal)}</span>
          </button>

          {onPreviewReceipt && (
            <button
              type="button"
              onClick={onPreviewReceipt}
              className="w-full py-2 px-3 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              title="Preview 80mm Thermal Receipt Roll"
            >
              <Eye className="w-3.5 h-3.5 text-neutral-600" />
              <span>Preview 80mm Thermal Receipt</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
