import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { PaymentMethod, PaymentDetail, CodDetails } from '../../types/pos';
import {
  X,
  CreditCard,
  Banknote,
  QrCode,
  Divide,
  CheckCircle2,
  Smartphone,
  ShieldCheck,
  Loader2,
  Truck,
  AlertTriangle,
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose }) => {
  const {
    grandTotal,
    processCheckout,
    currentStore,
    isOfflineMode,
    isOnline,
    activeLoyaltyCustomer,
    formatMoney,
    currency,
  } = usePOS();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [tenderedCash, setTenderedCash] = useState<number>(grandTotal);
  const [cardBrand, setCardBrand] = useState<'Visa' | 'Mastercard' | 'Amex'>('Visa');
  const [isProcessing, setIsProcessing] = useState(false);
  const [splitCashAmount, setSplitCashAmount] = useState<number>(Math.floor(grandTotal / 2));

  // COD Details
  const [recipientName, setRecipientName] = useState(activeLoyaltyCustomer?.name || '');
  const [recipientPhone, setRecipientPhone] = useState(activeLoyaltyCustomer?.phone || '');
  const [deliveryAddress, setDeliveryAddress] = useState(activeLoyaltyCustomer?.deliveryAddress || '');
  const [deliveryCity, setDeliveryCity] = useState(activeLoyaltyCustomer?.city || currentStore.city);
  const [deliveryPostalCode, setDeliveryPostalCode] = useState(activeLoyaltyCustomer?.postalCode || '00100');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  if (!isOpen) return null;

  const isActuallyOffline = isOfflineMode || !isOnline;
  const changeDue = Math.max(0, Number((tenderedCash - grandTotal).toFixed(2)));
  const splitRemainingCard = Math.max(0, Number((grandTotal - splitCashAmount).toFixed(2)));

  const handleCompletePayment = async () => {
    setIsProcessing(true);
    try {
      let paymentDetails: PaymentDetail[] = [];
      let codInfo: CodDetails | undefined = undefined;

      if (selectedMethod === 'cash') {
        paymentDetails = [
          {
            method: 'cash',
            amount: grandTotal,
            tenderedCash,
            changeDue,
          },
        ];
      } else if (selectedMethod === 'card') {
        paymentDetails = [
          {
            method: 'card',
            amount: grandTotal,
            cardBrand,
            lastFour: String(Math.floor(1000 + Math.random() * 9000)),
            referenceId: `AUTH-${Math.floor(100000 + Math.random() * 900000)}`,
          },
        ];
      } else if (selectedMethod === 'qr_wallet') {
        paymentDetails = [
          {
            method: 'qr_wallet',
            amount: grandTotal,
            referenceId: `LANKA-QR-${Math.floor(100000 + Math.random() * 900000)}`,
          },
        ];
      } else if (selectedMethod === 'split') {
        paymentDetails = [
          {
            method: 'cash',
            amount: splitCashAmount,
            tenderedCash: splitCashAmount,
            changeDue: 0,
          },
          {
            method: 'card',
            amount: splitRemainingCard,
            cardBrand: 'Visa',
            lastFour: '7721',
            referenceId: `AUTH-SPLIT-${Math.floor(10000 + Math.random() * 90000)}`,
          },
        ];
      } else if (selectedMethod === 'cod') {
        codInfo = {
          recipientName: recipientName.trim() || 'Retail Customer',
          recipientPhone: recipientPhone.trim() || '+94 77 000 0000',
          deliveryAddress: deliveryAddress.trim() || currentStore.address,
          city: deliveryCity.trim() || currentStore.city,
          postalCode: deliveryPostalCode.trim() || '00100',
          deliveryInstructions: deliveryInstructions.trim() || undefined,
          collectionStatus: 'pending_collection',
        };
        paymentDetails = [
          {
            method: 'cod',
            amount: grandTotal,
            codDetails: codInfo,
          },
        ];
      }

      await new Promise((resolve) => setTimeout(resolve, 350));
      await processCheckout(paymentDetails, codInfo);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
          <div>
            <h3 className="text-base font-bold text-neutral-900">Payment &amp; Dispatch Terminal</h3>
            <p className="text-xs text-neutral-500">
              {currentStore.name} · {currency.code} ({currency.name})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Offline Warning Banner */}
        {isActuallyOffline && (
          <div className="px-6 py-2.5 bg-amber-500 text-white flex items-center gap-2 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Uninterrupted Offline Mode: Buffered to local storage; auto-syncs on reconnect.</span>
          </div>
        )}

        {/* Total Banner in LKR */}
        <div className="px-6 py-4 bg-neutral-900 text-white flex justify-between items-baseline">
          <span className="text-sm font-medium text-neutral-300">Total Charge Due</span>
          <span className="text-2xl font-mono font-bold tracking-tight text-white tabular-nums">
            {formatMoney(grandTotal)}
          </span>
        </div>

        {/* Payment Method Selector Tabs */}
        <div className="p-6 space-y-5 overflow-y-auto">
          <div className="grid grid-cols-5 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setSelectedMethod('cash');
                setTenderedCash(grandTotal);
              }}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                selectedMethod === 'cash'
                  ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                  : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <Banknote className="w-4 h-4 mb-1" />
              <span>Cash</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedMethod('card')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                selectedMethod === 'card'
                  ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                  : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <CreditCard className="w-4 h-4 mb-1" />
              <span>Card</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedMethod('cod')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                selectedMethod === 'cod'
                  ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                  : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <Truck className="w-4 h-4 mb-1" />
              <span>COD</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedMethod('qr_wallet')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                selectedMethod === 'qr_wallet'
                  ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                  : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <QrCode className="w-4 h-4 mb-1" />
              <span>QR Pay</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedMethod('split')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                selectedMethod === 'split'
                  ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                  : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <Divide className="w-4 h-4 mb-1" />
              <span>Split</span>
            </button>
          </div>

          {/* Cash Payment Drawer & Change Calculator */}
          {selectedMethod === 'cash' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Tendered Amount ({currency.symbol})
                </label>
                <input
                  type="number"
                  step="1"
                  min={grandTotal}
                  value={tenderedCash}
                  onChange={(e) => setTenderedCash(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 text-base font-mono font-bold text-neutral-900 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              {/* Quick bill presets */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setTenderedCash(grandTotal)}
                  className="px-3 py-1 text-xs font-bold bg-neutral-100 hover:bg-neutral-200 rounded-lg border border-neutral-200 text-neutral-900 cursor-pointer"
                >
                  Exact ({formatMoney(grandTotal)})
                </button>
                <button
                  type="button"
                  onClick={() => setTenderedCash(Math.ceil(grandTotal / 5) * 5)}
                  className="px-3 py-1 text-xs font-bold bg-neutral-100 hover:bg-neutral-200 rounded-lg border border-neutral-200 text-neutral-900 cursor-pointer"
                >
                  Round Up ({formatMoney(Math.ceil(grandTotal / 5) * 5)})
                </button>
                <button
                  type="button"
                  onClick={() => setTenderedCash(grandTotal + 10)}
                  className="px-3 py-1 text-xs font-bold bg-neutral-100 hover:bg-neutral-200 rounded-lg border border-neutral-200 text-neutral-900 cursor-pointer"
                >
                  +10 Cash
                </button>
              </div>

              {/* Live Change Due */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-950">Change to Return</p>
                  <p className="text-[11px] text-emerald-800">Printed on 80mm thermal receipt</p>
                </div>
                <span className="text-2xl font-mono font-bold text-emerald-950 tabular-nums">
                  {formatMoney(changeDue)}
                </span>
              </div>
            </div>
          )}

          {/* Card Terminal Simulator */}
          {selectedMethod === 'card' && (
            <div className="space-y-4">
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-700">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-900">
                      EMV Terminal Reader Active
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      Contactless NFC Tap / Chip Insert / Magstripe
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                  Ready
                </span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Select Card Network
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Visa', 'Mastercard', 'Amex'] as const).map((brand) => (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => setCardBrand(brand)}
                      className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-colors cursor-pointer ${
                        cardBrand === brand
                          ? 'bg-neutral-900 border-neutral-900 text-white shadow-xs'
                          : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* COD Options */}
          {selectedMethod === 'cod' && (
            <div className="space-y-3.5 bg-amber-50/60 p-4 border border-amber-200 rounded-xl text-xs">
              <div className="flex items-start gap-2">
                <Truck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-950">Cash On Delivery (COD)</h4>
                  <p className="text-[11px] text-amber-800">
                    Payment of {formatMoney(grandTotal)} will be collected by courier upon delivery.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Recipient Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+94 77 000 0000"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Delivery Street Address *</label>
                <input
                  type="text"
                  required
                  placeholder="Street address, building, suite..."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* QR Wallet */}
          {selectedMethod === 'qr_wallet' && (
            <div className="flex flex-col items-center justify-center p-5 bg-neutral-50 border border-neutral-200 rounded-xl text-center">
              <div className="w-36 h-36 bg-white border border-neutral-300 p-2 rounded-xl flex items-center justify-center mb-3 shadow-2xs">
                <svg className="w-full h-full text-neutral-900" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 0h4v4h-4v-4zm-4-2h2v2h-2v-2zm0 4h2v4h-2v-4zm4-4h2v2h-2v-2zm0 6h4v2h-4v-2zm-6-2h2v2h-2v-2z" />
                </svg>
              </div>
              <p className="text-xs font-bold text-neutral-900">Scan LankaQR / Mobile Wallet</p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Dynamic session token linked to Total: {formatMoney(grandTotal)}
              </p>
            </div>
          )}

          {/* Split Payment */}
          {selectedMethod === 'split' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Cash Portion ({currency.symbol})
                </label>
                <input
                  type="number"
                  step="1"
                  max={grandTotal}
                  min={0}
                  value={splitCashAmount}
                  onChange={(e) => setSplitCashAmount(Math.min(grandTotal, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 text-sm font-mono font-bold border border-neutral-300 rounded-xl"
                />
              </div>
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Portion 1 (Cash):</span>
                  <span className="font-mono font-bold">{formatMoney(splitCashAmount)}</span>
                </div>
                <div className="flex justify-between text-neutral-900">
                  <span className="text-neutral-600">Portion 2 (Card):</span>
                  <span className="font-mono font-bold">{formatMoney(splitRemainingCard)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Security & Action Footer */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>PCI Compliant &amp; 80mm Thermal Receipt Ready</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCompletePayment}
              disabled={
                isProcessing ||
                (selectedMethod === 'cash' && tenderedCash < grandTotal) ||
                (selectedMethod === 'cod' && (!recipientName.trim() || !deliveryAddress.trim()))
              }
              className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Finalizing...</span>
                </>
              ) : selectedMethod === 'cod' ? (
                <>
                  <Truck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Confirm COD Order</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Pay &amp; Generate 80mm Receipt</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
