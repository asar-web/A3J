import React, { useState, useEffect } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  Order,
  ShippingOption,
  FulfillmentStatus,
  ReturnItem,
  ReturnReason,
  OrderReturn,
} from '../../types/pos';
import {
  Truck,
  Package,
  RotateCcw,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Barcode,
  QrCode,
  Printer,
  ChevronRight,
  AlertTriangle,
  Send,
  Plus,
  Sliders,
  X,
  Phone,
  Calendar,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { generateQRCodeDataURL } from '../../utils/qrcode';
import { generateBarcodeBars } from '../../utils/barcode';

interface ShippingTrackingManagerProps {
  initialTrackingQuery?: string;
  onOpenReceiptModal?: (order: Order) => void;
}

export const ShippingTrackingManager: React.FC<ShippingTrackingManagerProps> = ({
  initialTrackingQuery = '',
  onOpenReceiptModal,
}) => {
  const {
    orders,
    currentStore,
    formatMoney,
    currency,
    shippingOptions,
    updateShippingOption,
    addShippingOption,
    deleteShippingOption,
    fulfillOrder,
    updateTrackingStatus,
    lookupOrderByQuery,
    returns,
    processOrderReturn,
    activeReturnRecord,
    setActiveReturnRecord,
  } = usePOS();

  // Active view tab
  const [activeTab, setActiveTab] = useState<'track' | 'dispatch' | 'returns' | 'options'>('track');

  // Track search query
  const [trackingQuery, setTrackingQuery] = useState(initialTrackingQuery || 'TRK-LK-7788991');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Fulfill / Send Product Modal State
  const [fulfillingOrder, setFulfillingOrder] = useState<Order | null>(null);
  const [selectedCarrier, setSelectedCarrier] = useState('PromptX Logistics');
  const [selectedShippingOptionId, setSelectedShippingOptionId] = useState(shippingOptions[0]?.id || '');
  const [customTrackingNumber, setCustomTrackingNumber] = useState('');
  const [dispatchNotes, setDispatchNotes] = useState('');

  // Process Return Modal State
  const [returningOrder, setReturningOrder] = useState<Order | null>(null);
  const [returnItemsState, setReturnItemsState] = useState<{ [productId: string]: { selected: boolean; qty: number; reason: ReturnReason } }>({});
  const [refundMethod, setRefundMethod] = useState<'cash' | 'original_payment' | 'store_credit' | 'exchange'>('cash');
  const [restockInventory, setRestockInventory] = useState(true);
  const [returnNotes, setReturnNotes] = useState('');

  // Add Shipping Option Modal State
  const [isAddOptionModalOpen, setIsAddOptionModalOpen] = useState(false);
  const [newOptName, setNewOptName] = useState('');
  const [newOptCarrier, setNewOptCarrier] = useState('');
  const [newOptDays, setNewOptDays] = useState('1-2 Business Days');
  const [newOptPrice, setNewOptPrice] = useState(3.5);
  const [newOptFreeThreshold, setNewOptFreeThreshold] = useState<number | undefined>(50);
  const [newOptDesc, setNewOptDesc] = useState('');

  // Printable 80mm Shipping Label state
  const [shippingLabelOrder, setShippingLabelOrder] = useState<Order | null>(null);
  const [labelQrCode, setLabelQrCode] = useState<string>('');

  // Printable 80mm Return RMA Slip state
  const [viewingReturnSlip, setViewingReturnSlip] = useState<OrderReturn | null>(null);

  // Notification Toast
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  const showToast = (message: string, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 4000);
  };

  // Perform tracking search
  const handleSearchTracking = (queryStr: string) => {
    setSearchError(null);
    const order = lookupOrderByQuery(queryStr);
    if (order) {
      setTrackedOrder(order);
    } else {
      setTrackedOrder(null);
      setSearchError(`No shipment or order found matching "${queryStr}". Check the tracking code or receipt number.`);
    }
  };

  // Auto-load initial tracking if provided or default to first shipped order
  useEffect(() => {
    if (initialTrackingQuery) {
      handleSearchTracking(initialTrackingQuery);
    } else {
      const defaultOrder =
        orders.find((o) => o.trackingNumber) ||
        orders.find((o) => o.fulfillmentStatus === 'shipped') ||
        orders[0];
      if (defaultOrder) {
        setTrackedOrder(defaultOrder);
        setTrackingQuery(defaultOrder.trackingNumber || defaultOrder.receiptNumber);
      }
    }
  }, [initialTrackingQuery, orders]);

  // Generate QR code for shipping label
  useEffect(() => {
    if (shippingLabelOrder) {
      const payload = JSON.stringify({
        trk: shippingLabelOrder.trackingNumber || shippingLabelOrder.receiptNumber,
        rec: shippingLabelOrder.customerName,
        phone: shippingLabelOrder.customerPhone,
        dest: shippingLabelOrder.customerAddress,
        type: 'AURA_RETAIL_PARCEL',
      });
      generateQRCodeDataURL(payload, { width: 130, margin: 1 }).then((url) => {
        setLabelQrCode(url);
      });
    }
  }, [shippingLabelOrder]);

  // Handle Send Product Submit
  const handleExecuteFulfill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fulfillingOrder) return;
    const res = fulfillOrder(fulfillingOrder.id, {
      carrier: selectedCarrier,
      trackingNumber: customTrackingNumber,
      shippingOptionId: selectedShippingOptionId,
      notes: dispatchNotes,
    });
    if (res.success) {
      showToast(res.message);
      setFulfillingOrder(null);
      setCustomTrackingNumber('');
      setDispatchNotes('');
      // If currently tracking this order, refresh tracked view
      const updated = lookupOrderByQuery(fulfillingOrder.id);
      if (updated) setTrackedOrder(updated);
    } else {
      showToast(res.message, true);
    }
  };

  // Initialize return items when opening return modal
  const openReturnModal = (ord: Order) => {
    setReturningOrder(ord);
    const initialItemsState: { [productId: string]: { selected: boolean; qty: number; reason: ReturnReason } } = {};
    ord.items.forEach((it) => {
      initialItemsState[it.productId] = {
        selected: true,
        qty: it.quantity,
        reason: 'customer_change_mind',
      };
    });
    setReturnItemsState(initialItemsState);
    setRefundMethod(ord.payments.some((p) => p.method === 'cash') ? 'cash' : 'original_payment');
    setRestockInventory(true);
    setReturnNotes('');
  };

  // Handle Return Processing
  const handleExecuteReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returningOrder) return;

    const itemsToReturn: ReturnItem[] = [];
    let calculatedRefund = 0;

    returningOrder.items.forEach((item) => {
      const state = returnItemsState[item.productId];
      if (state && state.selected && state.qty > 0) {
        itemsToReturn.push({
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          quantity: state.qty,
          unitPrice: item.price,
          reason: state.reason,
        });
        calculatedRefund += item.price * state.qty;
      }
    });

    if (itemsToReturn.length === 0) {
      showToast('Select at least one item to return.', true);
      return;
    }

    try {
      const result = processOrderReturn(returningOrder.id, {
        items: itemsToReturn,
        refundMethod,
        refundAmount: Number(calculatedRefund.toFixed(2)),
        restockInventory,
        notes: returnNotes,
      });

      showToast(result.message);
      setViewingReturnSlip(result.returnRecord);
      setReturningOrder(null);

      // Refresh tracked order if viewing same
      const refreshed = lookupOrderByQuery(returningOrder.id);
      if (refreshed) setTrackedOrder(refreshed);
    } catch (err: any) {
      showToast(err?.message || 'Failed to process return', true);
    }
  };

  // Handle Add Shipping Option
  const handleCreateShippingOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOptName.trim() || !newOptCarrier.trim()) return;
    addShippingOption({
      name: newOptName.trim(),
      carrier: newOptCarrier.trim(),
      estimatedDays: newOptDays.trim() || '1-3 Business Days',
      price: Math.max(0, newOptPrice),
      freeAboveThreshold: newOptFreeThreshold,
      isActive: true,
      description: newOptDesc.trim() || 'Standard express delivery service.',
    });
    setNewOptName('');
    setNewOptCarrier('');
    setNewOptDesc('');
    setIsAddOptionModalOpen(false);
    showToast(`Shipping option "${newOptName.trim()}" added.`);
  };

  // Timeline Step Status Helper
  const getTimelineSteps = (ord: Order) => {
    const status = ord.fulfillmentStatus || (ord.paymentStatus === 'paid' ? 'packed' : 'unfulfilled');
    const isReturned = status === 'returned';

    const steps = [
      {
        key: 'order_placed',
        label: 'Order Placed',
        description: 'Payment authorized & verified',
        isDone: true,
        date: ord.createdAt,
      },
      {
        key: 'packed',
        label: 'Packaged & Checked',
        description: 'Quality inspected at store',
        isDone: ['packed', 'shipped', 'out_for_delivery', 'delivered', 'returned'].includes(status),
        date: ord.trackingEvents?.find((e) => e.status === 'packed')?.timestamp,
      },
      {
        key: 'shipped',
        label: 'Product Sent / In Transit',
        description: ord.carrier ? `Dispatched via ${ord.carrier}` : 'Carrier assigned',
        isDone: ['shipped', 'out_for_delivery', 'delivered', 'returned'].includes(status),
        date: ord.dispatchedAt,
      },
      {
        key: 'out_for_delivery',
        label: 'Out for Delivery',
        description: 'Courier rider on the way',
        isDone: ['out_for_delivery', 'delivered', 'returned'].includes(status),
        date: ord.trackingEvents?.find((e) => e.status === 'out_for_delivery')?.timestamp,
      },
      {
        key: 'delivered',
        label: isReturned ? 'Returned / Refunded' : 'Delivered & Completed',
        description: isReturned ? 'Returned under RMA' : 'Handed over to customer',
        isDone: ['delivered', 'returned'].includes(status),
        date: ord.deliveredAt,
      },
    ];

    return steps;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-lg border text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-5 ${
            toast.isError
              ? 'bg-rose-50 text-rose-900 border-rose-200'
              : 'bg-emerald-50 text-emerald-900 border-emerald-200'
          }`}
        >
          {toast.isError ? (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
              <Truck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                <span>Shipping, Dispatch &amp; Tracking Center</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-neutral-100 text-neutral-800 border border-neutral-300">
                  {currency.code}
                </span>
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                Send products with carriers, track parcel delivery stages, process customer returns (RMA), and manage shipping rates.
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-2xl text-xs font-semibold self-start sm:self-auto border border-neutral-200">
          <button
            type="button"
            onClick={() => setActiveTab('track')}
            className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'track'
                ? 'bg-white text-neutral-900 shadow-xs font-bold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-neutral-500" />
            <span>Track Order</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dispatch')}
            className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'dispatch'
                ? 'bg-white text-neutral-900 shadow-xs font-bold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-neutral-500" />
            <span>Product Send Queue</span>
            {orders.filter((o) => !o.fulfillmentStatus || o.fulfillmentStatus === 'unfulfilled').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500 text-white font-bold">
                {orders.filter((o) => !o.fulfillmentStatus || o.fulfillmentStatus === 'unfulfilled').length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('returns')}
            className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'returns'
                ? 'bg-white text-neutral-900 shadow-xs font-bold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
            <span>Returns &amp; RMA</span>
            {returns.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-neutral-200 text-neutral-800 font-bold">
                {returns.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('options')}
            className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'options'
                ? 'bg-white text-neutral-900 shadow-xs font-bold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-neutral-500" />
            <span>Shipping Options</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TRACK ORDER & LIVE TIMELINE */}
      {/* ========================================================================= */}
      {activeTab === 'track' && (
        <div className="space-y-6">
          {/* Tracking Search Input Card */}
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-600" />
              <span>Real-Time Shipment &amp; Parcel Tracking</span>
            </h3>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Enter Tracking # (e.g. TRK-LK-7788991), Receipt # (REC-...), or Phone..."
                  value={trackingQuery}
                  onChange={(e) => setTrackingQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchTracking(trackingQuery)}
                  className="w-full px-4 py-2.5 font-mono text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-neutral-50"
                />
              </div>
              <button
                type="button"
                onClick={() => handleSearchTracking(trackingQuery)}
                className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Track Package</span>
              </button>
            </div>

            {/* Quick Demo Pickers */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
              <span className="text-[11px] text-neutral-400 font-semibold">Quick Samples:</span>
              {orders.slice(0, 3).map((ord) => (
                <button
                  key={ord.id}
                  type="button"
                  onClick={() => {
                    setTrackingQuery(ord.trackingNumber || ord.receiptNumber);
                    handleSearchTracking(ord.trackingNumber || ord.receiptNumber);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono border cursor-pointer ${
                    trackedOrder?.id === ord.id
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {ord.trackingNumber || ord.receiptNumber} ({ord.customerName})
                </button>
              ))}
            </div>

            {searchError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}
          </div>

          {/* Tracked Order Details & Timeline */}
          {trackedOrder && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Visual Step Tracker & Event Log (7-8 cols) */}
              <div className="lg:col-span-7 xl:col-span-8 bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-neutral-500 uppercase">
                        Consignment Tracking:
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-extrabold bg-emerald-50 text-emerald-900 border border-emerald-200">
                        {trackedOrder.trackingNumber || `TRK-PENDING-${trackedOrder.receiptNumber}`}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      Carrier: <strong className="text-neutral-900">{trackedOrder.carrier || 'Standard Courier Service'}</strong> · Method: {trackedOrder.shippingOptionName || 'Doorstep Dispatch'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShippingLabelOrder(trackedOrder)}
                      className="px-3 py-1.5 text-xs font-bold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Print 80mm Courier Shipping Label"
                    >
                      <Barcode className="w-3.5 h-3.5" />
                      <span>80mm Shipping Label</span>
                    </button>
                    {onOpenReceiptModal && (
                      <button
                        type="button"
                        onClick={() => onOpenReceiptModal(trackedOrder)}
                        className="px-3 py-1.5 text-xs font-bold text-neutral-900 bg-white hover:bg-neutral-50 border border-neutral-300 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="View 80mm Thermal Receipt"
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-600" />
                        <span>80mm Slip</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Visual Step-by-Step Timeline Bar */}
                <div className="py-2">
                  <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-4">
                    Shipment Journey Progress
                  </h4>
                  <div className="relative">
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                      {getTimelineSteps(trackedOrder).map((step, idx) => (
                        <div
                          key={step.key}
                          className={`p-3 rounded-xl border text-xs flex flex-col justify-between transition-all ${
                            step.isDone
                              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                              : 'bg-neutral-50 border-neutral-200 text-neutral-400'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-mono text-[10px] font-bold">0{idx + 1}</span>
                              {step.isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Clock className="w-4 h-4 text-neutral-300" />
                              )}
                            </div>
                            <p className="font-bold text-neutral-900 text-xs leading-snug">{step.label}</p>
                            <p className="text-[10px] text-neutral-500 mt-0.5 leading-snug">{step.description}</p>
                          </div>
                          {step.date && (
                            <span className="text-[9.5px] font-mono text-neutral-400 mt-2 block border-t border-neutral-200/60 pt-1">
                              {new Date(step.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                              {new Date(step.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Staff Dispatch / Status Update Simulator Controls */}
                <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>Staff Shipment Action Controls (Update Live Status):</span>
                    </span>
                    <span className="text-[10.5px] font-mono font-bold text-neutral-600 uppercase">
                      Current: {trackedOrder.fulfillmentStatus || 'Unfulfilled'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setFulfillingOrder(trackedOrder)}
                      className="px-2.5 py-1 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg cursor-pointer"
                    >
                      <Send className="w-3 h-3 inline mr-1" />
                      <span>Product Send / Dispatch</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateTrackingStatus(
                          trackedOrder.id,
                          'out_for_delivery',
                          'Out for Delivery',
                          `Carrier courier rider dispatched for doorstep delivery at ${trackedOrder.customerAddress || 'destination address'}.`
                        )
                      }
                      className="px-2.5 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer"
                    >
                      <Truck className="w-3 h-3 inline mr-1" />
                      <span>Mark Out for Delivery</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateTrackingStatus(
                          trackedOrder.id,
                          'delivered',
                          'Delivered & Received',
                          'Parcel safely delivered to recipient. Consignment complete.'
                        )
                      }
                      className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                    >
                      <CheckCircle2 className="w-3 h-3 inline mr-1" />
                      <span>Mark Delivered</span>
                    </button>

                    {trackedOrder.fulfillmentStatus === 'delivered' && (
                      <button
                        type="button"
                        onClick={() => openReturnModal(trackedOrder)}
                        className="px-2.5 py-1 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3 inline mr-1" />
                        <span>Process Return / Refund</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Chronological Event History */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                    Detailed Event Logs ({trackedOrder.trackingEvents?.length || 0} Events)
                  </h4>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {trackedOrder.trackingEvents && trackedOrder.trackingEvents.length > 0 ? (
                      trackedOrder.trackingEvents.map((evt) => (
                        <div
                          key={evt.id}
                          className="p-3 rounded-xl border border-neutral-200 bg-neutral-50/50 flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="space-y-0.5">
                            <p className="font-bold text-neutral-900">{evt.title}</p>
                            <p className="text-neutral-600 text-[11px] leading-relaxed">{evt.description}</p>
                            {evt.location && (
                              <span className="text-[10px] text-neutral-400 font-medium flex items-center gap-1 pt-0.5">
                                <MapPin className="w-2.5 h-2.5" />
                                <span>{evt.location}</span>
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[10.5px] text-neutral-400 shrink-0">
                            {new Date(evt.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                            {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-neutral-400 italic">No historical tracking checkpoints recorded yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Parcel Metadata & Items Preview (4-5 cols) */}
              <div className="lg:col-span-5 xl:col-span-4 space-y-4">
                {/* Recipient Card */}
                <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-3 text-xs">
                  <h4 className="font-bold text-neutral-900 text-xs uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-neutral-100">
                    <MapPin className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Recipient &amp; Delivery Destination</span>
                  </h4>
                  <div className="space-y-1.5">
                    <p className="font-bold text-sm text-neutral-950">{trackedOrder.customerName || 'Customer'}</p>
                    {trackedOrder.customerPhone && (
                      <p className="text-neutral-600 flex items-center gap-1 font-mono text-[11px]">
                        <Phone className="w-3 h-3 text-neutral-400" />
                        <span>{trackedOrder.customerPhone}</span>
                      </p>
                    )}
                    {trackedOrder.customerAddress && (
                      <p className="text-neutral-600 text-[11px] leading-relaxed">
                        {trackedOrder.customerAddress}
                      </p>
                    )}
                  </div>
                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between font-mono text-[11px]">
                    <span className="text-neutral-500">Payment Mode:</span>
                    <span className="font-bold text-neutral-900 uppercase">
                      {trackedOrder.paymentStatus === 'pending_cod'
                        ? 'Cash on Delivery (COD)'
                        : trackedOrder.payments[0]?.method || 'Prepaid'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-neutral-500">Order Total:</span>
                    <span className="font-extrabold text-neutral-950">{formatMoney(trackedOrder.total)}</span>
                  </div>
                </div>

                {/* Items in Parcel */}
                <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-3 text-xs">
                  <h4 className="font-bold text-neutral-900 text-xs uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-neutral-100">
                    <Package className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Package Contents ({trackedOrder.items.length} items)</span>
                  </h4>
                  <div className="space-y-2.5 max-h-60 overflow-y-auto divide-y divide-neutral-100">
                    {trackedOrder.items.map((it, idx) => (
                      <div key={idx} className="pt-2 first:pt-0 flex items-start gap-2.5">
                        {it.imageUrl && (
                          <img
                            src={it.imageUrl}
                            alt={it.productName}
                            className="w-10 h-10 object-cover rounded-lg border border-neutral-200 shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-neutral-900 truncate leading-snug">{it.productName}</p>
                          <div className="flex items-center gap-2 font-mono text-[10.5px] text-neutral-500 mt-0.5">
                            <span>{it.quantity}x @ {formatMoney(it.price)}</span>
                            {it.isSpecialPrice && (
                              <span className="text-amber-800 font-bold">★ Special</span>
                            )}
                          </div>
                        </div>
                        <span className="font-mono font-bold text-neutral-900 tabular-nums">
                          {formatMoney(it.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PRODUCT SEND / DISPATCH QUEUE */}
      {/* ========================================================================= */}
      {activeTab === 'dispatch' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                <span>Product Send &amp; Courier Fulfillment Queue</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Assign parcel carriers, generate waybill tracking numbers, print 80mm shipping slips, and dispatch goods.
              </p>
            </div>
            <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-neutral-100 text-neutral-800 border border-neutral-200">
              {orders.length} total orders registered
            </span>
          </div>

          {/* Orders Table */}
          <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Receipt / Order</th>
                    <th className="py-3 px-4">Customer &amp; Address</th>
                    <th className="py-3 px-4 text-center">Fulfillment Status</th>
                    <th className="py-3 px-4">Carrier &amp; Waybill</th>
                    <th className="py-3 px-4 text-right">Items &amp; Total</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {orders.map((ord) => {
                    const status = ord.fulfillmentStatus || 'unfulfilled';
                    const isDispatched = ['shipped', 'out_for_delivery', 'delivered'].includes(status);

                    return (
                      <tr key={ord.id} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-mono font-bold text-neutral-950">{ord.receiptNumber}</p>
                          <p className="text-[10.5px] font-mono text-neutral-400">
                            {new Date(ord.createdAt).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-neutral-900">{ord.customerName || 'Walk-in'}</p>
                          <p className="text-[11px] text-neutral-500 truncate max-w-xs">{ord.customerAddress || 'Local pickup'}</p>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                              status === 'delivered'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : status === 'shipped' || status === 'out_for_delivery'
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : status === 'returned'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            <span>{status.toUpperCase().replace(/_/g, ' ')}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs">
                          {ord.carrier ? (
                            <div>
                              <p className="font-sans font-bold text-neutral-800">{ord.carrier}</p>
                              <p className="text-[10.5px] text-neutral-500">{ord.trackingNumber || 'No Waybill'}</p>
                            </div>
                          ) : (
                            <span className="text-neutral-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <p className="font-bold font-mono text-neutral-900">{formatMoney(ord.total)}</p>
                          <p className="text-[10.5px] text-neutral-500">
                            {ord.items.reduce((s, i) => s + i.quantity, 0)} units
                          </p>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isDispatched ? (
                              <button
                                type="button"
                                onClick={() => setFulfillingOrder(ord)}
                                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
                              >
                                <Send className="w-3 h-3 text-emerald-400" />
                                <span>Send Product</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setTrackedOrder(ord);
                                  setTrackingQuery(ord.trackingNumber || ord.receiptNumber);
                                  setActiveTab('track');
                                }}
                                className="px-2.5 py-1 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-lg cursor-pointer flex items-center gap-1"
                              >
                                <Truck className="w-3 h-3 text-neutral-500" />
                                <span>Track</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setShippingLabelOrder(ord)}
                              className="px-2.5 py-1 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-lg cursor-pointer"
                              title="Print 80mm Courier Shipping Label"
                            >
                              Label
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PRODUCT RETURNS & REFUNDS (RMA) */}
      {/* ========================================================================= */}
      {activeTab === 'returns' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                <span>Product Returns, RMA &amp; Refund Management</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Process customer returns within 14 days, issue cash/card/credit refunds, and automatically restock returned goods into inventory.
              </p>
            </div>
            <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200">
              {returns.length} Return Authorizations (RMA)
            </span>
          </div>

          {/* Returns Table */}
          <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-5 py-3 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-900">Completed &amp; Authorized RMA Returns</span>
            </div>
            {returns.length === 0 ? (
              <div className="p-10 text-center text-neutral-400 space-y-1">
                <RotateCcw className="w-8 h-8 mx-auto text-neutral-300 stroke-1" />
                <p className="text-sm font-semibold text-neutral-700">No Product Returns Logged</p>
                <p className="text-xs text-neutral-400">
                  Select any completed order in the Shipment or Ledger tab and click &quot;Process Return&quot; to authorize an RMA.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-600 font-semibold">
                    <tr>
                      <th className="py-3 px-4">RMA Code / Date</th>
                      <th className="py-3 px-4">Original Receipt</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Returned Items</th>
                      <th className="py-3 px-4 text-right">Refund Amount</th>
                      <th className="py-3 px-4 text-center">Inventory Restocked</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {returns.map((ret) => (
                      <tr key={ret.id} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-mono font-bold text-neutral-900">{ret.rmaCode}</p>
                          <p className="text-[10.5px] font-mono text-neutral-400">
                            {new Date(ret.createdAt).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-neutral-700">
                          {ret.receiptNumber}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-neutral-900">{ret.customerName}</p>
                          <p className="text-[10.5px] text-neutral-400">{ret.customerPhone || 'N/A'}</p>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            {ret.items.map((it, i) => (
                              <p key={i} className="text-neutral-700 text-[11px]">
                                {it.quantity}x {it.productName}{' '}
                                <span className="text-neutral-400 font-mono">({it.reason})</span>
                              </p>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-neutral-950">
                          <span>{formatMoney(ret.refundAmount)}</span>
                          <span className="block text-[10px] text-emerald-700 font-sans uppercase">
                            via {ret.refundMethod.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {ret.restocked ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Restocked +
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-600">
                              Disposed
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setViewingReturnSlip(ret)}
                            className="px-2.5 py-1 text-xs font-semibold text-neutral-800 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-lg cursor-pointer flex items-center gap-1 ml-auto"
                          >
                            <Printer className="w-3 h-3 text-neutral-600" />
                            <span>RMA Slip</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SHIPPING OPTIONS & RATES */}
      {/* ========================================================================= */}
      {activeTab === 'options' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-neutral-700" />
                <span>Shipping Methods &amp; Courier Rate Matrix</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Configure delivery services, transit SLAs, courier rates in {currency.code}, and free delivery thresholds.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddOptionModalOpen(true)}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Add Shipping Option</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shippingOptions.map((opt) => (
              <div
                key={opt.id}
                className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center font-bold text-xs">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-neutral-950 text-sm">{opt.name}</h4>
                        <p className="text-[11px] text-neutral-500 font-medium">Carrier: {opt.carrier}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateShippingOption({
                          ...opt,
                          isActive: !opt.isActive,
                        })
                      }
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                        opt.isActive
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                      }`}
                    >
                      {opt.isActive ? 'Active' : 'Disabled'}
                    </button>
                  </div>
                  <p className="text-xs text-neutral-600 mt-2 leading-relaxed">{opt.description}</p>
                </div>

                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase font-sans">Delivery Rate:</span>
                    <p className="font-bold text-neutral-950">
                      {opt.price === 0 ? 'FREE' : formatMoney(opt.price)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-neutral-400 uppercase font-sans">Estimated SLA:</span>
                    <p className="font-semibold text-neutral-700">{opt.estimatedDays}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: PRODUCT SEND / DISPATCH FULFILLMENT */}
      {/* ========================================================================= */}
      {fulfillingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200 bg-neutral-50">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-neutral-900">Send Product / Courier Dispatch</h3>
              </div>
              <button
                type="button"
                onClick={() => setFulfillingOrder(null)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteFulfill} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                <div className="flex justify-between font-mono font-bold">
                  <span>Order Receipt:</span>
                  <span>{fulfillingOrder.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Recipient:</span>
                  <span className="font-semibold text-neutral-900">{fulfillingOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Destination:</span>
                  <span className="font-semibold text-neutral-900 truncate max-w-xs">{fulfillingOrder.customerAddress || 'Local pickup'}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Select Shipping Courier / Method *
                </label>
                <select
                  value={selectedShippingOptionId}
                  onChange={(e) => {
                    setSelectedShippingOptionId(e.target.value);
                    const opt = shippingOptions.find((o) => o.id === e.target.value);
                    if (opt) setSelectedCarrier(opt.carrier);
                  }}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl bg-white text-xs font-semibold"
                >
                  {shippingOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name} ({opt.carrier}) - {opt.price === 0 ? 'FREE' : formatMoney(opt.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Carrier Name *
                </label>
                <input
                  type="text"
                  required
                  value={selectedCarrier}
                  onChange={(e) => setSelectedCarrier(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-neutral-700">
                    Waybill / Consignment Tracking Number
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setCustomTrackingNumber(`TRK-LK-${Math.floor(1000000 + Math.random() * 9000000)}`)
                    }
                    className="text-[10px] font-bold text-neutral-900 underline cursor-pointer"
                  >
                    Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g. TRK-LK-99882211"
                  value={customTrackingNumber}
                  onChange={(e) => setCustomTrackingNumber(e.target.value)}
                  className="w-full px-3 py-2 font-mono text-xs border border-neutral-300 rounded-xl bg-neutral-50"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Dispatch Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Fragile glassware, handle with care, call customer before doorstep delivery."
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setFulfillingOrder(null)}
                  className="px-3.5 py-2 text-xs text-neutral-600 hover:text-neutral-900 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Confirm Dispatch &amp; Send</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PROCESS RETURN & REFUNDS (RMA) */}
      {/* ========================================================================= */}
      {returningOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200 bg-neutral-50">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-neutral-900">Authorize Return &amp; Refund (RMA)</h3>
              </div>
              <button
                type="button"
                onClick={() => setReturningOrder(null)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteReturn} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span>Order: {returningOrder.receiptNumber}</span>
                  <span>Date: {new Date(returningOrder.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between font-sans">
                  <span className="text-neutral-500">Customer:</span>
                  <span className="font-bold text-neutral-900">{returningOrder.customerName}</span>
                </div>
              </div>

              {/* Items Selection */}
              <div className="space-y-2">
                <label className="block font-bold text-neutral-900">Select Items to Return:</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {returningOrder.items.map((it) => {
                    const st = returnItemsState[it.productId] || {
                      selected: false,
                      qty: it.quantity,
                      reason: 'customer_change_mind',
                    };
                    return (
                      <div
                        key={it.productId}
                        className={`p-3 rounded-xl border transition-colors space-y-2 ${
                          st.selected ? 'bg-amber-50/50 border-amber-300' : 'bg-neutral-50 border-neutral-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 font-bold text-neutral-900 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={st.selected}
                              onChange={(e) =>
                                setReturnItemsState((prev) => ({
                                  ...prev,
                                  [it.productId]: { ...st, selected: e.target.checked },
                                }))
                              }
                              className="rounded text-neutral-900"
                            />
                            <span>{it.productName}</span>
                          </label>
                          <span className="font-mono font-bold text-neutral-900">
                            {formatMoney(it.price * st.qty)}
                          </span>
                        </div>

                        {st.selected && (
                          <div className="grid grid-cols-2 gap-2 pl-6 pt-1">
                            <div>
                              <span className="text-[10px] text-neutral-500 font-semibold block mb-0.5">
                                Return Quantity:
                              </span>
                              <input
                                type="number"
                                min="1"
                                max={it.quantity}
                                value={st.qty}
                                onChange={(e) =>
                                  setReturnItemsState((prev) => ({
                                    ...prev,
                                    [it.productId]: {
                                      ...st,
                                      qty: Math.min(it.quantity, Math.max(1, parseInt(e.target.value) || 1)),
                                    },
                                  }))
                                }
                                className="w-full px-2.5 py-1 text-xs border border-neutral-300 rounded-lg bg-white font-mono"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-neutral-500 font-semibold block mb-0.5">
                                Return Reason:
                              </span>
                              <select
                                value={st.reason}
                                onChange={(e) =>
                                  setReturnItemsState((prev) => ({
                                    ...prev,
                                    [it.productId]: { ...st, reason: e.target.value as ReturnReason },
                                  }))
                                }
                                className="w-full px-2.5 py-1 text-xs border border-neutral-300 rounded-lg bg-white"
                              >
                                <option value="defective">Defective / Malfunctioning</option>
                                <option value="damaged_in_transit">Damaged in Transit</option>
                                <option value="wrong_item">Wrong Item Received</option>
                                <option value="customer_change_mind">Customer Change of Mind</option>
                                <option value="expired_quality">Quality Issue</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Refund Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Refund Method *</label>
                  <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl bg-white text-xs"
                  >
                    <option value="cash">Cash Refund ({currency.code})</option>
                    <option value="original_payment">Original Payment Method</option>
                    <option value="store_credit">Store Credit / Loyalty Voucher</option>
                    <option value="exchange">Exchange / Item Replacement</option>
                  </select>
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 font-semibold text-neutral-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={restockInventory}
                      onChange={(e) => setRestockInventory(e.target.checked)}
                      className="rounded text-neutral-900"
                    />
                    <span>Restock items to store inventory</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  RMA Return Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Inspection observations, customer feedback, serial numbers..."
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setReturningOrder(null)}
                  className="px-3.5 py-2 text-xs text-neutral-600 hover:text-neutral-900 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Authorize Return &amp; Refund</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD SHIPPING OPTION */}
      {/* ========================================================================= */}
      {isAddOptionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200 bg-neutral-50">
              <h3 className="text-sm font-bold text-neutral-900">Add Shipping Method</h3>
              <button
                type="button"
                onClick={() => setIsAddOptionModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateShippingOption} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Service Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PromptX Island-wide Priority"
                  value={newOptName}
                  onChange={(e) => setNewOptName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Carrier Provider *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PromptX Logistics / Fardar / Koombiyo"
                  value={newOptCarrier}
                  onChange={(e) => setNewOptCarrier(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Rate Fee ({currency.code}) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={newOptPrice}
                    onChange={(e) => setNewOptPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Estimated Days *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1-2 Business Days"
                    value={newOptDays}
                    onChange={(e) => setNewOptDays(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Coverage, SMS tracking details, delivery hours..."
                  value={newOptDesc}
                  onChange={(e) => setNewOptDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsAddOptionModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-900 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 shadow-xs cursor-pointer"
                >
                  Save Shipping Option
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: 80MM COURIER SHIPPING LABEL (PRINTABLE) */}
      {/* ========================================================================= */}
      {shippingLabelOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/75 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-md bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-800 p-5 text-white space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Barcode className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">80mm Courier Parcel Shipping Label</h3>
              </div>
              <button
                type="button"
                onClick={() => setShippingLabelOrder(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* The 80mm Printable Label Body */}
            <div
              id="printable-shipping-label"
              className="bg-white text-neutral-900 p-4 rounded-xl border border-neutral-300 shadow-inner font-mono text-xs space-y-2.5 max-w-[310px] mx-auto select-none"
            >
              <div className="text-center pb-2 border-b-2 border-dashed border-neutral-800">
                <p className="font-black text-sm uppercase tracking-wider">{currentStore.name}</p>
                <p className="text-[10px] font-sans text-neutral-500">PARCEL LOGISTICS &amp; DISPATCH</p>
                <p className="text-[10px] font-bold text-neutral-800 mt-0.5">
                  CARRIER: {shippingLabelOrder.carrier || 'STANDARD COURIER'}
                </p>
              </div>

              {/* Barcode & Tracking Number */}
              <div className="text-center py-1 bg-neutral-50 border border-neutral-200 rounded p-2">
                <span className="text-[9.5px] uppercase font-sans text-neutral-500 block">Waybill Consignment:</span>
                <span className="font-black text-sm tracking-wider block">
                  {shippingLabelOrder.trackingNumber || `TRK-${shippingLabelOrder.receiptNumber}`}
                </span>
                <div className="flex justify-center gap-0.5 mt-1.5 h-8">
                  {generateBarcodeBars(shippingLabelOrder.trackingNumber || shippingLabelOrder.receiptNumber).map(
                    (w, idx) => (
                      <span
                        key={idx}
                        className="bg-neutral-900 h-full inline-block"
                        style={{ width: `${w * 1.5}px` }}
                      />
                    )
                  )}
                </div>
              </div>

              {/* Delivery To Details */}
              <div className="p-2 border border-neutral-800 rounded space-y-1">
                <span className="text-[9px] uppercase font-bold text-neutral-500 block">DELIVER TO:</span>
                <p className="font-black text-xs">{shippingLabelOrder.customerName || 'Customer'}</p>
                <p className="text-[11px] font-bold">{shippingLabelOrder.customerPhone || 'Phone: N/A'}</p>
                <p className="text-[10.5px] leading-snug font-sans text-neutral-800">
                  {shippingLabelOrder.customerAddress || 'Local Flagship Collection'}
                </p>
              </div>

              {/* Routing & COD Fee */}
              <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-b border-neutral-300 py-1.5">
                <div>
                  <span className="text-neutral-500 block">PAYMENT:</span>
                  <span className="font-bold text-neutral-900 uppercase">
                    {shippingLabelOrder.paymentStatus === 'pending_cod' ? 'CASH ON DELIVERY' : 'PREPAID'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-neutral-500 block">COLLECT DUE:</span>
                  <span className="font-black text-neutral-900 text-xs">
                    {shippingLabelOrder.paymentStatus === 'pending_cod'
                      ? formatMoney(shippingLabelOrder.total)
                      : 'PAID (Rs. 0)'}
                  </span>
                </div>
              </div>

              {/* QR Code for Courier Mobile Scan */}
              {labelQrCode && (
                <div className="text-center pt-1">
                  <img src={labelQrCode} alt="Tracking QR" className="w-20 h-20 mx-auto border border-neutral-300 p-0.5 bg-white" />
                  <p className="text-[9px] text-neutral-500 font-sans mt-0.5">SCAN TO VERIFY TRACKING</p>
                </div>
              )}

              <p className="text-[8.5px] text-center text-neutral-400 font-sans">
                Return if undeliverable to: 45 Galle Road, Kollupitiya, Colombo
              </p>
            </div>

            {/* Print and Close Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShippingLabelOrder(null)}
                className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print 80mm Label</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: 80MM RETURN & RMA SLIP (PRINTABLE) */}
      {/* ========================================================================= */}
      {viewingReturnSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/75 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-md bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-800 p-5 text-white space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">80mm Return &amp; Refund RMA Credit Slip</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingReturnSlip(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 80mm RMA Slip Body */}
            <div
              id="printable-rma-slip"
              className="bg-white text-neutral-900 p-4 rounded-xl border border-neutral-300 font-mono text-xs space-y-2 max-w-[310px] mx-auto select-none"
            >
              <div className="text-center pb-2 border-b-2 border-dashed border-neutral-800">
                <p className="font-black text-sm uppercase">{currentStore.name}</p>
                <p className="text-[10px] font-sans text-neutral-500">RETURN MERCHANDISE AUTHORIZATION</p>
                <p className="text-[11px] font-black text-amber-900 mt-0.5">RMA #{viewingReturnSlip.rmaCode}</p>
              </div>

              <div className="text-[10.5px] space-y-0.5 text-neutral-700">
                <div className="flex justify-between">
                  <span>DATE:</span>
                  <span>{new Date(viewingReturnSlip.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>ORIG. RECEIPT:</span>
                  <span className="font-bold text-neutral-900">{viewingReturnSlip.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>CUSTOMER:</span>
                  <span className="font-bold text-neutral-900">{viewingReturnSlip.customerName}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-neutral-400 my-1.5" />
              <div className="font-bold text-[10px] uppercase text-neutral-600 flex justify-between">
                <span>RETURNED ITEM</span>
                <span>REFUND</span>
              </div>

              <div className="space-y-1.5">
                {viewingReturnSlip.items.map((it, idx) => (
                  <div key={idx} className="space-y-0.5 text-[10.5px]">
                    <div className="flex justify-between">
                      <span className="font-bold text-neutral-900 truncate max-w-[190px]">
                        {it.quantity}x {it.productName}
                      </span>
                      <span className="font-bold tabular-nums font-mono">
                        {formatMoney(it.unitPrice * it.quantity)}
                      </span>
                    </div>
                    <p className="text-[9.5px] text-neutral-500 font-sans italic">
                      Reason: {it.reason.replace(/_/g, ' ')}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-neutral-400 my-1.5" />
              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-bold text-neutral-950">
                  <span>TOTAL REFUND:</span>
                  <span className="font-black text-sm text-amber-950">
                    {formatMoney(viewingReturnSlip.refundAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-neutral-600">
                  <span>REFUND METHOD:</span>
                  <span className="font-bold uppercase">{viewingReturnSlip.refundMethod.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between text-[10px] text-neutral-600">
                  <span>RESTOCKED:</span>
                  <span>{viewingReturnSlip.restocked ? 'YES (+ Stock)' : 'NO (Damaged)'}</span>
                </div>
              </div>

              <div className="border-t-2 border-dashed border-neutral-800 pt-3 mt-3 text-center space-y-1">
                <div className="w-36 border-b border-neutral-400 mx-auto h-6" />
                <p className="text-[9px] text-neutral-500 font-sans">Customer Signature</p>
                <p className="text-[8.5px] text-neutral-400 font-sans">
                  Thank you. Store credit or refund processed pursuant to our 14-day exchange policy.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setViewingReturnSlip(null)}
                className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print 80mm RMA Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
