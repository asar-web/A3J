import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { Order } from '../../types/pos';
import { ReceiptModal } from '../pos/ReceiptModal';
import {
  TrendingUp,
  Download,
  Eye,
  CreditCard,
  Building,
  FileText,
  Truck,
  DollarSign,
  Percent,
  Printer,
} from 'lucide-react';

export const SalesAnalytics: React.FC = () => {
  const { orders, stores, products, formatMoney, currency, createTestReceiptOrder } = usePOS();
  const [timeRange, setTimeRange] = useState<'today' | '7days' | 'month' | 'all'>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<Order | null>(null);

  const filteredOrders = orders.filter((ord) => {
    if (timeRange === 'all') return true;
    const orderDate = new Date(ord.createdAt);
    const now = new Date();
    if (timeRange === 'today') {
      return orderDate.toDateString() === now.toDateString();
    } else if (timeRange === '7days') {
      const diffMs = now.getTime() - orderDate.getTime();
      return diffMs <= 7 * 24 * 60 * 60 * 1000;
    } else if (timeRange === 'month') {
      return (
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getFullYear() === now.getFullYear()
      );
    }
    return true;
  });

  const grossRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = filteredOrders.length;
  const aov = totalOrders > 0 ? grossRevenue / totalOrders : 0;
  const totalTaxes = filteredOrders.reduce((sum, o) => sum + o.taxAmount, 0);

  const handleExportCSV = () => {
    const headers =
      'ReceiptNumber,InvoiceNumber,Date,Store,Cashier,Customer,ItemsCount,Subtotal,Tax,Total,Currency,PaymentStatus\n';
    const rows = filteredOrders
      .map((o) => {
        const itemCount = o.items.reduce((s, i) => s + i.quantity, 0);
        return `"${o.receiptNumber}","${o.invoiceNumber}","${o.createdAt}","${o.storeName}","${o.cashierName}","${o.customerName || 'Walk-in'}",${itemCount},${o.subtotal},${o.taxAmount},${o.total},"${o.currencyCode}","${o.paymentStatus}"`;
      })
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${timeRange}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Sales Reporting &amp; Orders</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-neutral-100 text-neutral-800 border border-neutral-300">
              {currency.code}
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Financial ledger across retail branches, Cash on Delivery, and 80mm thermal receipts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white border border-neutral-200 rounded-xl p-0.5 text-xs shadow-2xs">
            {(['today', '7days', 'month', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  timeRange === range
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {range === 'today'
                  ? 'Today'
                  : range === '7days'
                  ? '7 Days'
                  : range === 'month'
                  ? 'This Month'
                  : 'All Time'}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSelectedReceipt(createTestReceiptOrder())}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors shadow-2xs cursor-pointer"
            title="Preview 80mm Thermal Receipt Sample"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sample 80mm Slip</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 rounded-xl hover:bg-neutral-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards in LKR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <p className="text-xs text-neutral-500 font-semibold">Gross Sales ({currency.code})</p>
          <p className="text-2xl font-bold font-mono text-neutral-900 mt-1 tabular-nums">
            {formatMoney(grossRevenue)}
          </p>
          <p className="text-[11px] text-emerald-700 mt-1">Across all branches &amp; COD</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <p className="text-xs text-neutral-500 font-semibold">Total Transactions</p>
          <p className="text-2xl font-bold font-mono text-neutral-900 mt-1 tabular-nums">
            {totalOrders}
          </p>
          <p className="text-[11px] text-neutral-400 mt-1">Orders processed</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <p className="text-xs text-neutral-500 font-semibold">Average Order Value</p>
          <p className="text-2xl font-bold font-mono text-neutral-900 mt-1 tabular-nums">
            {formatMoney(aov)}
          </p>
          <p className="text-[11px] text-neutral-400 mt-1">Basket average</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <p className="text-xs text-neutral-500 font-semibold">Sales Tax Collected</p>
          <p className="text-2xl font-bold font-mono text-neutral-900 mt-1 tabular-nums">
            {formatMoney(totalTaxes)}
          </p>
          <p className="text-[11px] text-neutral-400 mt-1">VAT &amp; Municipal Tax</p>
        </div>
      </div>

      {/* Transaction Journal with 80mm Receipt Trigger */}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
          <h3 className="text-sm font-bold text-neutral-900">Transaction Ledger</h3>
          <span className="text-xs font-mono text-neutral-500">
            {filteredOrders.length} records in view
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Receipt / Invoice</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Store Branch</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-center">Payment Status</th>
                <th className="py-3 px-4 text-right">Items</th>
                <th className="py-3 px-4 text-right">Total ({currency.code})</th>
                <th className="py-3 px-4 text-center">80mm Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-mono">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-neutral-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-bold text-neutral-900">{ord.receiptNumber}</p>
                    <p className="text-[11px] text-neutral-400 font-normal">{ord.invoiceNumber}</p>
                  </td>
                  <td className="py-3 px-4 text-neutral-500 text-[11px]">
                    {new Date(ord.createdAt).toLocaleDateString()}{' '}
                    {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 font-sans text-neutral-700 font-medium">{ord.storeName}</td>
                  <td className="py-3 px-4 font-sans text-neutral-800">
                    {ord.customerName || <span className="text-neutral-400">Walk-in</span>}
                  </td>
                  <td className="py-3 px-4 text-center font-sans">
                    {ord.paymentStatus === 'pending_cod' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Truck className="w-3 h-3" />
                        <span>Pending COD</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <span>Paid</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-neutral-700">
                    {ord.items.reduce((s, i) => s + i.quantity, 0)}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums font-bold text-neutral-950">
                    {formatMoney(ord.total)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setSelectedReceipt(ord)}
                      className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer shadow-2xs"
                      title="View 80mm Thermal Receipt Preview"
                    >
                      <Printer className="w-3 h-3 text-emerald-400" />
                      <span>80mm Slip</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 80mm Thermal Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal order={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
      )}
    </div>
  );
};
