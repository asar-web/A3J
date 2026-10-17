import React, { useState, useEffect } from 'react';
import { Order, OrderItem } from '../../types/pos';
import { usePOS } from '../../context/POSContext';
import {
  Printer,
  X,
  Zap,
  Check,
  Plus,
  Trash2,
  Image as ImageIcon,
  QrCode,
  Tag,
  RotateCcw,
} from 'lucide-react';
import { generateBarcodeBars } from '../../utils/barcode';
import { playThermalPrinterFeedSound } from '../../utils/audio';
import { generateQRCodeDataURL, buildTransactionLookupPayload } from '../../utils/qrcode';

interface ReceiptModalProps {
  order: Order;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order: initialOrder, onClose }) => {
  const { currentStore, formatMoney, recordInvoiceDelivery, adminOptions, branding, products, resetLogo } = usePOS();
  const [currentOrder, setCurrentOrder] = useState<Order>(initialOrder);
  const [isFeedingPaper, setIsFeedingPaper] = useState(true);
  const [feedKey, setFeedKey] = useState(0);
  const [showItemImages, setShowItemImages] = useState<boolean>(
    adminOptions?.showProductImageOnReceipt || false
  );
  const [showQRCode, setShowQRCode] = useState<boolean>(
    adminOptions?.showQrOnReceipt !== false
  );
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [showItemEditor, setShowItemEditor] = useState(false);

  // Generate QR code encoding the transaction ID for easy post-sale lookup
  useEffect(() => {
    const payload = buildTransactionLookupPayload(
      currentOrder.receiptNumber,
      currentOrder.storeId,
      currentOrder.total,
      currentOrder.currencyCode
    );
    generateQRCodeDataURL(payload, { width: 140, margin: 1 }).then((url) => {
      if (url) {
        setQrCodeDataUrl(url);
      }
    });
  }, [currentOrder.receiptNumber, currentOrder.storeId, currentOrder.total, currentOrder.currencyCode]);

  // Trigger realistic thermal paper feed animation & stepper motor sound
  const triggerFeedAnimation = () => {
    setIsFeedingPaper(true);
    setFeedKey((prev) => prev + 1);
    if (adminOptions?.receiptFeedSound !== false) {
      playThermalPrinterFeedSound();
    }
    setTimeout(() => {
      setIsFeedingPaper(false);
    }, 1200);
  };

  useEffect(() => {
    triggerFeedAnimation();
  }, []);

  // PRINT action: triggers native browser print targeted at #printable-receipt (80mm roll)
  const handlePrint = () => {
    recordInvoiceDelivery(currentOrder.id, 'print_thermal');
    if (adminOptions?.receiptFeedSound !== false) {
      playThermalPrinterFeedSound();
    }
    setTimeout(() => {
      window.print();
    }, 120);
  };

  // CANCEL action: closes the modal
  const handleCancel = () => {
    onClose();
  };

  // Dynamic Item Management: add a new item dynamically to test receipt scaling on 80mm roll
  const handleAddDynamicItem = () => {
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    if (!randomProduct) return;
    const isSpecial = Boolean(randomProduct.isSpecialActive && randomProduct.specialPrice);
    const itemPrice = isSpecial ? randomProduct.specialPrice! : randomProduct.price;
    const newItem: OrderItem = {
      productId: randomProduct.id,
      productName: randomProduct.name,
      sku: randomProduct.sku,
      barcode: randomProduct.barcode,
      price: itemPrice,
      regularPrice: randomProduct.price,
      isSpecialPrice: isSpecial,
      quantity: 1,
      discountPercent: 0,
      subtotal: itemPrice,
      imageUrl: randomProduct.imageUrl,
    };

    setCurrentOrder((prev) => {
      const updatedItems = [...prev.items, newItem];
      const newSubtotal = Number(updatedItems.reduce((acc, it) => acc + it.subtotal, 0).toFixed(2));
      const newTax = Number(((newSubtotal * prev.taxRate) / 100).toFixed(2));
      const newTotal = Number((newSubtotal + newTax).toFixed(2));
      return {
        ...prev,
        items: updatedItems,
        subtotal: newSubtotal,
        taxAmount: newTax,
        total: newTotal,
      };
    });
  };

  const handleRemoveDynamicItem = (index: number) => {
    if (currentOrder.items.length <= 1) return;
    setCurrentOrder((prev) => {
      const updatedItems = prev.items.filter((_, idx) => idx !== index);
      const newSubtotal = Number(updatedItems.reduce((acc, it) => acc + it.subtotal, 0).toFixed(2));
      const newTax = Number(((newSubtotal * prev.taxRate) / 100).toFixed(2));
      const newTotal = Number((newSubtotal + newTax).toFixed(2));
      return {
        ...prev,
        items: updatedItems,
        subtotal: newSubtotal,
        taxAmount: newTax,
        total: newTotal,
      };
    });
  };

  const isCOD =
    currentOrder.payments.some((p) => p.method === 'cod') ||
    currentOrder.paymentStatus === 'pending_cod';
  const barcodeBars = generateBarcodeBars(currentOrder.receiptNumber);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-neutral-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-800 overflow-hidden flex flex-col max-h-[96vh] my-auto animate-in fade-in zoom-in-95">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-neutral-900/90 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-emerald-400">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  80mm Thermal Receipt Preview
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  80mm Roll
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 font-mono">
                TXN #{currentOrder.receiptNumber} · {currentOrder.currencyCode}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Cancel / Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Toolbar Controls */}
        <div className="px-5 py-2 bg-neutral-950/60 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={triggerFeedAnimation}
              className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors border border-neutral-700 cursor-pointer"
              title="Simulate paper feed ejection with audio"
            >
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>Feed Paper</span>
            </button>
            <button
              type="button"
              onClick={() => setShowQRCode(!showQRCode)}
              className={`px-2 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors border cursor-pointer ${
                showQRCode
                  ? 'bg-neutral-800 text-emerald-400 border-emerald-500/40'
                  : 'bg-neutral-850 text-neutral-400 border-neutral-700 hover:text-neutral-200'
              }`}
              title="Toggle QR Code generation on receipt"
            >
              <QrCode className="w-3 h-3" />
              <span>{showQRCode ? 'QR Code: ON' : 'QR Code: OFF'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowItemImages(!showItemImages)}
              className={`px-2 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors border cursor-pointer ${
                showItemImages
                  ? 'bg-neutral-800 text-emerald-400 border-emerald-500/40'
                  : 'bg-neutral-850 text-neutral-400 border-neutral-700 hover:text-neutral-200'
              }`}
              title="Show or hide product photos on receipt"
            >
              <ImageIcon className="w-3 h-3" />
              <span>{showItemImages ? 'Photos: ON' : 'Photos: OFF'}</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowItemEditor(!showItemEditor)}
              className="text-[11px] text-neutral-300 hover:text-white underline cursor-pointer"
            >
              {showItemEditor ? 'Hide Dynamic Items' : `Dynamic Items (${currentOrder.items.length})`}
            </button>
          </div>
        </div>

        {/* Dynamic Items Quick Tester (Expandable) */}
        {showItemEditor && (
          <div className="px-5 py-3 bg-neutral-950/90 border-b border-neutral-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-200 text-[11px]">
                Dynamic Line Items Tester (Supports any item count on 80mm roll):
              </span>
              <button
                type="button"
                onClick={handleAddDynamicItem}
                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>+ Add Item</span>
              </button>
            </div>
            <div className="max-h-28 overflow-y-auto divide-y divide-neutral-800 space-y-1">
              {currentOrder.items.map((it, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 text-[11px]">
                  <span className="text-neutral-300 truncate max-w-[200px]">
                    {it.quantity}x {it.productName}
                    {it.isSpecialPrice && (
                      <span className="ml-1 text-[10px] text-amber-400 font-bold">[Special Price]</span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-emerald-400">{formatMoney(it.subtotal)}</span>
                    {currentOrder.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDynamicItem(idx)}
                        className="text-neutral-500 hover:text-rose-400 p-0.5 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scrollable Realistic Thermal Roll Container */}
        <div
          className={`flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-950 flex flex-col items-center justify-start ${
            isFeedingPaper ? 'is-printing-feed' : ''
          }`}
        >
          {/* Simulated 80mm Thermal Printer Head Enclosure */}
          <div className="w-full max-w-[310px] flex flex-col items-center">
            {/* Metal printer slot */}
            <div className="w-full h-4 bg-neutral-800 rounded-t-xl shadow-inner flex items-center justify-center relative border-t border-x border-neutral-700">
              <div className="w-36 h-1 bg-neutral-950 rounded-full" />
              <div
                className="absolute left-3 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"
                title="80mm Thermal Feeder Active"
              />
              <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400">
                80mm THERMAL ROLL
              </span>
              <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-neutral-600" />
            </div>

            {/* THE #printable-receipt COMPONENT (EXACT 80mm WIDTH ROLL REPRESENTATION) */}
            <div
              id="printable-receipt"
              key={feedKey}
              className={`w-full bg-[#fcfcfc] text-neutral-950 p-5 pb-7 shadow-2xl border-x border-b border-neutral-300 font-mono text-[11px] leading-snug space-y-3 receipt-sawtooth-bottom speed-${
                adminOptions?.thermalPaperSlideSpeed || 'normal'
              }`}
              style={{
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.45), 0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              {/* Store Brand / Logo Header */}
              <div className="text-center space-y-1">
                {adminOptions?.showLogoOnReceipt !== false && branding.logoUrl && (
                  <div className="flex justify-center mb-1.5">
                    <img
                      src={branding.logoUrl}
                      alt={branding.storeName || 'Store Logo'}
                      className="w-12 h-12 object-contain rounded-md border border-neutral-200"
                    />
                  </div>
                )}
                <h2 className="text-base font-bold font-sans tracking-tight text-neutral-950 uppercase">
                  {branding.storeName || 'AURA RETAIL'}
                </h2>
                <p className="font-semibold text-neutral-800 text-[11px]">
                  {currentOrder.storeName || currentStore.name}
                </p>
                {adminOptions?.showStoreAddressOnReceipt !== false && (
                  <p className="text-[10px] text-neutral-600 leading-tight">
                    {branding.storeAddress || currentStore.address}, {currentStore.city}
                  </p>
                )}
                {adminOptions?.showPhoneOnReceipt !== false && (
                  <p className="text-[10px] text-neutral-700 font-mono">
                    Tel: {branding.phoneNumber || currentStore.phone}
                  </p>
                )}
                {adminOptions?.receiptTaxNumber && (
                  <p className="text-[10px] text-neutral-600 font-mono">
                    VAT Reg: {adminOptions.receiptTaxNumber}
                  </p>
                )}
              </div>

              {/* Thermal Separator Line */}
              <div className="border-t border-dashed border-neutral-400 my-2" />

              {/* Receipt Metadata */}
              <div className="text-[10.5px] space-y-0.5 text-neutral-700">
                <div className="flex justify-between">
                  <span>RECEIPT NO:</span>
                  <span className="font-bold text-neutral-950 font-mono">
                    {currentOrder.receiptNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>INVOICE NO:</span>
                  <span className="font-bold text-neutral-950 font-mono">
                    {currentOrder.invoiceNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>DATE/TIME:</span>
                  <span>
                    {new Date(currentOrder.createdAt).toLocaleDateString()} {new Date(currentOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>CASHIER:</span>
                  <span>{currentOrder.cashierName}</span>
                </div>
                {currentOrder.customerName && (
                  <div className="flex justify-between text-neutral-900 font-medium">
                    <span>CUSTOMER:</span>
                    <span className="truncate max-w-[170px] text-right">
                      {currentOrder.customerName}
                    </span>
                  </div>
                )}
                {currentOrder.trackingNumber && (
                  <div className="flex justify-between text-neutral-900 font-mono text-[10px]">
                    <span>TRACKING NO:</span>
                    <span className="font-bold">{currentOrder.trackingNumber}</span>
                  </div>
                )}
                {isCOD && (
                  <div className="text-amber-900 font-bold text-[10px] mt-1 pt-0.5 border-t border-dotted border-neutral-300">
                    * PAYMENT: CASH ON DELIVERY (COLLECT ON DELIVERY) *
                  </div>
                )}
              </div>

              {/* Line Items Header */}
              <div className="border-t border-dashed border-neutral-400 my-2" />
              <div className="flex justify-between text-[10px] font-bold text-neutral-600 uppercase border-b border-neutral-300 pb-1">
                <span>ITEM / SKU</span>
                <span>QTY x PRICE</span>
                <span className="text-right">TOTAL</span>
              </div>

              {/* Dynamic Items List */}
              <div className="space-y-2 pt-1">
                {currentOrder.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-start gap-1.5 min-w-0 flex-1">
                        {showItemImages && item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="w-7 h-7 object-cover rounded shrink-0 border border-neutral-300 mt-0.5"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-neutral-950 text-[11px] leading-tight break-words">
                            {item.productName}
                          </p>
                          <div className="flex items-center gap-1 text-[9.5px] text-neutral-500 font-mono">
                            <span>SKU: {item.sku}</span>
                            {item.isSpecialPrice && (
                              <span className="text-amber-700 font-bold">★ SPECIAL PRICE</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="tabular-nums font-bold text-neutral-950 font-mono shrink-0 pl-1">
                        {formatMoney(item.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-neutral-600 pl-0.5">
                      <span>
                        {item.quantity} @ {formatMoney(item.price)}
                        {item.isSpecialPrice && item.regularPrice && (
                          <span className="text-neutral-400 line-through ml-1">
                            {formatMoney(item.regularPrice)}
                          </span>
                        )}
                      </span>
                      {item.discountPercent > 0 && (
                        <span className="text-emerald-700 font-bold">
                          -{item.discountPercent}% OFF
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Totals Breakdown in LKR */}
              <div className="border-t border-dashed border-neutral-400 my-2 pt-1" />
              <div className="space-y-1 text-[11px] text-neutral-800">
                <div className="flex justify-between">
                  <span>SUBTOTAL</span>
                  <span className="tabular-nums font-mono font-medium">
                    {formatMoney(currentOrder.subtotal)}
                  </span>
                </div>
                {currentOrder.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-800">
                    <span>DISCOUNTS</span>
                    <span className="tabular-nums font-mono">
                      -{formatMoney(currentOrder.discountTotal)}
                    </span>
                  </div>
                )}
                {currentOrder.specialSavingsTotal && currentOrder.specialSavingsTotal > 0 ? (
                  <div className="flex justify-between text-amber-900 font-bold bg-amber-50/80 px-1 py-0.5 rounded">
                    <span>★ SPECIAL DEAL SAVINGS</span>
                    <span className="tabular-nums font-mono">
                      -{formatMoney(currentOrder.specialSavingsTotal)}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between text-neutral-600">
                  <span>VAT / SALES TAX ({currentOrder.taxRate}%)</span>
                  <span className="tabular-nums font-mono">
                    {formatMoney(currentOrder.taxAmount)}
                  </span>
                </div>
                <div className="border-t-2 border-neutral-950 pt-1.5 flex justify-between text-sm font-extrabold text-neutral-950">
                  <span className="font-sans">TOTAL ({currentOrder.currencyCode})</span>
                  <span className="tabular-nums font-mono text-base">
                    {formatMoney(currentOrder.total)}
                  </span>
                </div>
              </div>

              {/* Settlement & Payment Breakdown */}
              <div className="border-t border-dashed border-neutral-400 my-2 pt-1" />
              <div className="space-y-1 text-[10.5px] text-neutral-700">
                <div className="font-bold text-neutral-900 uppercase">PAYMENT SETTLEMENT:</div>
                {currentOrder.payments.map((p, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between uppercase">
                      <span>
                        {p.method} {p.cardBrand ? `(${p.cardBrand} *${p.lastFour})` : ''}
                      </span>
                      <span className="tabular-nums font-mono font-bold">
                        {formatMoney(p.amount)}
                      </span>
                    </div>
                    {p.tenderedCash !== undefined && (
                      <div className="flex justify-between text-[10px]">
                        <span>TENDERED CASH:</span>
                        <span className="tabular-nums font-mono">{formatMoney(p.tenderedCash)}</span>
                      </div>
                    )}
                    {p.changeDue !== undefined && (
                      <div className="flex justify-between text-[10px] font-bold text-neutral-950">
                        <span>CHANGE RETURNED:</span>
                        <span className="tabular-nums font-mono">{formatMoney(p.changeDue)}</span>
                      </div>
                    )}
                    {p.referenceId && (
                      <div className="text-[9.5px] text-neutral-500">REF: {p.referenceId}</div>
                    )}
                  </div>
                ))}
              </div>

              {/* QR CODE FOR POST-SALE TRANSACTION LOOKUP */}
              {showQRCode && qrCodeDataUrl && (
                <div className="pt-2 pb-1 text-center flex flex-col items-center border-t border-dashed border-neutral-400">
                  <div className="p-1.5 bg-white border border-neutral-300 rounded-md shadow-2xs">
                    <img
                      src={qrCodeDataUrl}
                      alt={`Transaction QR ${currentOrder.receiptNumber}`}
                      className="w-28 h-28 object-contain"
                    />
                  </div>
                  <p className="text-[9px] font-bold tracking-wider text-neutral-900 uppercase mt-1">
                    SCAN QR FOR POST-SALE LOOKUP
                  </p>
                  <p className="text-[9px] font-mono text-neutral-500">
                    TXN ID: {currentOrder.receiptNumber}
                  </p>
                </div>
              )}

              {/* Scannable 1D Barcode Pattern */}
              <div className="pt-1 text-center flex flex-col items-center">
                {adminOptions?.showBarcodeOnReceipt !== false && (
                  <>
                    <div className="h-7 w-48 flex items-stretch justify-between py-1 bg-white border border-neutral-200 px-1">
                      {barcodeBars.map((w, i) => (
                        <div key={i} className="bg-neutral-950" style={{ width: `${w * 1.5}px` }} />
                      ))}
                    </div>
                    <p className="text-[10px] tracking-widest text-neutral-600 mt-0.5 font-mono">
                      {currentOrder.receiptNumber}
                    </p>
                  </>
                )}
                <p className="text-[10px] text-neutral-600 mt-2 text-center leading-tight">
                  {adminOptions?.receiptFooterNote ||
                    'Goods once sold are returnable within 14 days with original receipt. Thank you!'}
                </p>
                <p className="text-[9px] text-neutral-400 mt-1">*** POWERED BY AURA RETAIL POS ***</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Controls: EXPLICIT 'Print' and 'Cancel' Buttons */}
        <div className="p-4 sm:p-5 bg-neutral-900 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>80mm Thermal Receipt with Post-Sale QR Lookup</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* CANCEL ACTION BUTTON */}
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-semibold border border-neutral-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {/* PRINT ACTION BUTTON */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
