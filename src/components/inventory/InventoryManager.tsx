import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { Product } from '../../types/pos';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Download,
  Barcode,
  Edit2,
  X,
  Check,
  Building,
  SlidersHorizontal,
  HardDrive,
  Upload,
  Zap,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Tag,
  Percent,
  Sparkles,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
} from 'lucide-react';
import {
  calculatePricingMetrics,
  calculateSalePriceFromMarkup,
  calculateSpecialPriceFromDiscount,
  checkPricingHealth,
} from '../../utils/pricing';

export const PRESET_PRODUCT_IMAGES = [
  {
    name: 'Ceylon Tea Tin',
    url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&h=450&q=80',
  },
  {
    name: 'Cinnamon Spices',
    url: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=600&h=450&q=80',
  },
  {
    name: 'Coconut Virgin Oil',
    url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&h=450&q=80',
  },
  {
    name: 'Specialty Coffee',
    url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=600&h=450&q=80',
  },
  {
    name: 'Ceramic Stoneware',
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&h=450&q=80',
  },
  {
    name: 'Canvas Market Tote',
    url: 'https://images.unsplash.com/photo-1597484662317-9bd7bdda2907?auto=format&fit=crop&w=600&h=450&q=80',
  },
  {
    name: 'Natural Honey Candle',
    url: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=600&h=450&q=80',
  },
  {
    name: 'Artisan Bakery Loaf',
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&h=450&q=80',
  },
];

export const InventoryManager: React.FC = () => {
  const {
    products,
    stores,
    currentStore,
    addProduct,
    updateProduct,
    adjustStock,
    categories,
    addCategory,
    updateProductThreshold,
    batchUpdateThresholds,
    bulkRestockLowStock,
    formatMoney,
    currency,
    catalogValuation,
  } = usePOS();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<
    'all' | 'low' | 'out' | 'adequate' | 'special'
  >('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustmentDelta, setAdjustmentDelta] = useState<number>(5);
  const [adjustmentReason, setAdjustmentReason] = useState('Supplier Restock');
  const [adjustmentStoreId, setAdjustmentStoreId] = useState(currentStore.id);

  // Quick Add Category State
  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Threshold Configuration
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);
  const [targetCategoryForThreshold, setTargetCategoryForThreshold] = useState('all');
  const [newBatchThreshold, setNewBatchThreshold] = useState<number>(10);
  const [editingThresholdProduct, setEditingThresholdProduct] = useState<Product | null>(null);
  const [singleThresholdValue, setSingleThresholdValue] = useState<number>(10);

  // Toast
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  // New product form state with Buy Price, Sale Price, and Special Price
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<string>(categories[0] || 'Ceylon Tea & Spices');
  const [newProdPrice, setNewProdPrice] = useState(10.0); // Sale Price
  const [newProdCost, setNewProdCost] = useState(4.5); // Buy Price
  const [newProdSpecialPrice, setNewProdSpecialPrice] = useState(8.5); // Special Price
  const [newProdIsSpecial, setNewProdIsSpecial] = useState(true);
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdBarcode, setNewProdBarcode] = useState('');
  const [newProdImageUrl, setNewProdImageUrl] = useState(PRESET_PRODUCT_IMAGES[0].url);
  const [newProdTaxExempt, setNewProdTaxExempt] = useState(false);
  const [newProdDescription, setNewProdDescription] = useState('');
  const [newProdInitialQty, setNewProdInitialQty] = useState(25);
  const [newProdThreshold, setNewProdThreshold] = useState(10);

  // Edit Product & Pricing State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPrice, setEditPrice] = useState(0);
  const [editCost, setEditCost] = useState(0);
  const [editSpecialPrice, setEditSpecialPrice] = useState(0);
  const [editIsSpecial, setEditIsSpecial] = useState(false);
  const [editSku, setEditSku] = useState('');
  const [editBarcode, setEditBarcode] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editThreshold, setEditThreshold] = useState(10);
  const [editTaxExempt, setEditTaxExempt] = useState(false);

  const filteredProducts = products.filter((prod) => {
    const stockInStore = prod.stockByStore[currentStore.id] ?? 0;
    const threshold = prod.lowStockThreshold ?? 10;
    const matchesCat = categoryFilter === 'all' || prod.category === categoryFilter;
    const matchesSearch =
      prod.name.toLowerCase().includes(search.toLowerCase()) ||
      prod.sku.toLowerCase().includes(search.toLowerCase()) ||
      prod.barcode.includes(search);
    let matchesStock = true;
    if (stockStatusFilter === 'low') {
      matchesStock = stockInStore > 0 && stockInStore <= threshold;
    } else if (stockStatusFilter === 'out') {
      matchesStock = stockInStore === 0;
    } else if (stockStatusFilter === 'adequate') {
      matchesStock = stockInStore > threshold;
    } else if (stockStatusFilter === 'special') {
      matchesStock = Boolean(prod.isSpecialActive && prod.specialPrice !== undefined);
    }
    return matchesCat && matchesSearch && matchesStock;
  });

  const lowStockProducts = products.filter((p) => {
    const qty = p.stockByStore[currentStore.id] ?? 0;
    return qty > 0 && qty <= (p.lowStockThreshold ?? 10);
  });
  const outOfStockProducts = products.filter((p) => {
    const qty = p.stockByStore[currentStore.id] ?? 0;
    return qty === 0;
  });
  const specialDealsProducts = products.filter(
    (p) => Boolean(p.isSpecialActive && p.specialPrice !== undefined)
  );
  const totalLowAndOutCount = lowStockProducts.length + outOfStockProducts.length;

  const showToast = (message: string, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 4000);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setEditName(prod.name);
    setEditCategory(prod.category);
    setEditPrice(prod.price);
    setEditCost(prod.costPrice);
    setEditSpecialPrice(prod.specialPrice || 0);
    setEditIsSpecial(Boolean(prod.isSpecialActive && prod.specialPrice));
    setEditSku(prod.sku);
    setEditBarcode(prod.barcode);
    setEditImageUrl(prod.imageUrl);
    setEditDescription(prod.description);
    setEditThreshold(prod.lowStockThreshold ?? 10);
    setEditTaxExempt(Boolean(prod.taxExempt));
  };

  const handleSaveEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const updated: Product = {
      ...editingProduct,
      name: editName.trim() || editingProduct.name,
      category: editCategory || editingProduct.category,
      price: Math.max(0, editPrice),
      costPrice: Math.max(0, editCost),
      specialPrice: editSpecialPrice > 0 ? editSpecialPrice : undefined,
      isSpecialActive: editIsSpecial && editSpecialPrice > 0,
      sku: editSku.trim() || editingProduct.sku,
      barcode: editBarcode.trim() || editingProduct.barcode,
      imageUrl: editImageUrl.trim() || editingProduct.imageUrl,
      description: editDescription.trim() || editingProduct.description,
      lowStockThreshold: Math.max(0, editThreshold),
      taxExempt: editTaxExempt,
    };
    updateProduct(updated);
    setEditingProduct(null);
    showToast(`Updated Buy/Sale/Special Pricing & details for "${updated.name}".`);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;
    const autoSku = newProdSku.trim() || `SKU-${Date.now().toString().slice(-6)}`;
    const autoBarcode = newProdBarcode.trim() || `479${Math.floor(1000000 + Math.random() * 9000000)}`;
    const initialStockObj: Record<string, number> = {};
    stores.forEach((s) => {
      initialStockObj[s.id] = s.id === currentStore.id ? newProdInitialQty : Math.floor(newProdInitialQty / 2);
    });

    addProduct({
      name: newProdName.trim(),
      category: newProdCategory,
      price: newProdPrice, // Sale Price
      costPrice: newProdCost, // Buy Price
      specialPrice: newProdSpecialPrice > 0 ? newProdSpecialPrice : undefined, // Special Price
      isSpecialActive: newProdIsSpecial && newProdSpecialPrice > 0,
      sku: autoSku,
      barcode: autoBarcode,
      imageUrl: newProdImageUrl.trim() || PRESET_PRODUCT_IMAGES[0].url,
      taxExempt: newProdTaxExempt,
      description: newProdDescription.trim() || 'Quality retail item.',
      stockByStore: initialStockObj,
      lowStockThreshold: Math.max(0, newProdThreshold),
    });

    setNewProdName('');
    setNewProdSku('');
    setNewProdBarcode('');
    setNewProdDescription('');
    setNewProdImageUrl(PRESET_PRODUCT_IMAGES[0].url);
    setNewProdThreshold(10);
    setIsAddModalOpen(false);
    showToast(`Added SKU "${newProdName.trim()}" with Buy/Sale/Special Pricing.`);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryInput.trim()) return;
    addCategory(newCategoryInput.trim());
    setCategoryFilter(newCategoryInput.trim());
    setNewCategoryInput('');
    setIsAddCatModalOpen(false);
    showToast(`Category "${newCategoryInput.trim()}" created successfully.`);
  };

  const handleToggleProductSpecial = (product: Product) => {
    const nextSpecialActive = !product.isSpecialActive;
    const updated = {
      ...product,
      isSpecialActive: nextSpecialActive,
    };
    updateProduct(updated);
    showToast(
      `Special Price ${nextSpecialActive ? 'Activated' : 'Deactivated'} for "${product.name}".`
    );
  };

  const handleApplyAdjustment = () => {
    if (!adjustingProduct) return;
    adjustStock(adjustingProduct.id, adjustmentStoreId, adjustmentDelta, adjustmentReason);
    const storeName = stores.find((s) => s.id === adjustmentStoreId)?.name || 'Store';
    showToast(
      `Stock for ${adjustingProduct.name} adjusted by ${adjustmentDelta > 0 ? `+${adjustmentDelta}` : adjustmentDelta} units at ${storeName}.`
    );
    setAdjustingProduct(null);
  };

  const handleQuickRestock = (product: Product, delta = 10) => {
    adjustStock(product.id, currentStore.id, delta, 'Quick 1-Click Restock');
    showToast(`Quick Restocked +${delta} units for "${product.name}" at ${currentStore.name}.`);
  };

  const handleExportCSV = () => {
    const headers =
      'ID,Name,Category,SKU,Barcode,BuyPriceCost,SalePriceRetail,SpecialPrice,SpecialActive,GrossMarginPct,StockCurrentStore,LowStockThreshold,StockStatus,Image\n';
    const rows = products
      .map((p) => {
        const margin = (((p.price - p.costPrice) / p.price) * 100).toFixed(1);
        const stock = p.stockByStore[currentStore.id] ?? 0;
        const thresh = p.lowStockThreshold ?? 10;
        const status = stock === 0 ? 'OUT_OF_STOCK' : stock <= thresh ? 'LOW_STOCK' : 'ADEQUATE';
        return `"${p.id}","${p.name}","${p.category}","${p.sku}","${p.barcode}",${p.costPrice},${p.price},${p.specialPrice || ''},${p.isSpecialActive ? 'YES' : 'NO'},${margin}%,${stock},${thresh},${status},"${p.imageUrl}"`;
      })
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-pricing-${currentStore.code}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Inventory & Pricing audit CSV exported.');
  };

  // Live metrics for Add Form
  const addFormMetrics = calculatePricingMetrics(newProdPrice, newProdCost, newProdSpecialPrice);
  const addFormHealth = checkPricingHealth(
    newProdIsSpecial && newProdSpecialPrice > 0 ? newProdSpecialPrice : newProdPrice,
    newProdCost
  );

  // Live metrics for Edit Form
  const editFormMetrics = calculatePricingMetrics(editPrice, editCost, editSpecialPrice);
  const editFormHealth = checkPricingHealth(
    editIsSpecial && editSpecialPrice > 0 ? editSpecialPrice : editPrice,
    editCost
  );

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
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
              Inventory &amp; Pricing Catalog
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-neutral-100 text-neutral-800 border border-neutral-300">
              {currency.code} ({currency.symbol})
            </span>
            {specialDealsProducts.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-700" />
                <span>{specialDealsProducts.length} Special Deals Active</span>
              </span>
            )}
            {totalLowAndOutCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-100 text-rose-900 border border-rose-300">
                {totalLowAndOutCount} Low Stock
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Full-spectrum pricing control: Buy Price (Cost), Sale Price (Retail), Special Offer Deals &amp; Margins.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddCatModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 rounded-xl hover:bg-neutral-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-neutral-600" />
            <span>Add Category</span>
          </button>
          <button
            type="button"
            onClick={() => setIsThresholdModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 rounded-xl hover:bg-neutral-50 transition-colors shadow-2xs cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-600" />
            <span>Thresholds</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 rounded-xl hover:bg-neutral-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-neutral-900 rounded-xl hover:bg-neutral-800 transition-colors shadow-xs active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Add Product &amp; Pricing</span>
          </button>
        </div>
      </div>

      {/* Catalog Valuation & Pricing Metrics KPI Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Inventory Cost Basis</span>
            <span className="w-6 h-6 rounded-lg bg-neutral-100 flex items-center justify-center font-bold text-neutral-700 text-xs">
              B
            </span>
          </div>
          <p className="text-xl font-bold font-mono text-neutral-900 tabular-nums">
            {formatMoney(catalogValuation.totalBuyCost)}
          </p>
          <p className="text-[11px] text-neutral-400 mt-0.5">Total Buy Price investment</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Retail Valuation</span>
            <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
              S
            </span>
          </div>
          <p className="text-xl font-bold font-mono text-emerald-950 tabular-nums">
            {formatMoney(catalogValuation.totalRetailValue)}
          </p>
          <p className="text-[11px] text-neutral-400 mt-0.5">Potential Sale Price revenue</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Gross Profit Potential</span>
            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
              %
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-bold font-mono text-indigo-950 tabular-nums">
              {formatMoney(catalogValuation.potentialProfit)}
            </p>
            <span className="text-xs font-bold text-emerald-700 font-mono">
              ({catalogValuation.averageMarginPct}%)
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">Average gross margin across catalog</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Special Price Deals</span>
            <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
              ★
            </span>
          </div>
          <p className="text-xl font-bold font-mono text-amber-950 tabular-nums">
            {catalogValuation.specialDealsCount}{' '}
            <span className="text-xs font-normal text-neutral-400">active items</span>
          </p>
          <button
            type="button"
            onClick={() => setStockStatusFilter('special')}
            className="text-[11px] text-amber-800 hover:text-amber-950 font-bold underline mt-0.5 block cursor-pointer"
          >
            Filter active special offers &rarr;
          </button>
        </div>
      </div>

      {/* Pricing Options Guide Banner */}
      <div className="bg-neutral-900 text-white p-4 rounded-2xl shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300 font-bold shrink-0">
            B
          </div>
          <div>
            <h4 className="font-bold text-white text-xs">Buy Price (Wholesale Cost)</h4>
            <p className="text-[11px] text-neutral-400 leading-snug">
              Cost of purchasing goods from suppliers. Used to track inventory asset valuation and gross profit margins.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-emerald-400 font-bold shrink-0">
            S
          </div>
          <div>
            <h4 className="font-bold text-white text-xs">Sale Price (Standard Retail)</h4>
            <p className="text-[11px] text-neutral-400 leading-snug">
              Standard customer retail price applied at POS register and public storefront checkout.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold shrink-0">
            ★
          </div>
          <div>
            <h4 className="font-bold text-amber-300 text-xs">Special Price (Promotional Offer)</h4>
            <p className="text-[11px] text-neutral-400 leading-snug">
              Discounted promotional or wholesale tier price. Highlights customer savings in the register, cart, and 80mm thermal receipt.
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-3.5 rounded-2xl border border-neutral-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product name, SKU or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-700 focus:outline-none font-semibold cursor-pointer"
          >
            <option value="all">All Categories ({categories.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-xl">
            <button
              onClick={() => setStockStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                stockStatusFilter === 'all' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600'
              }`}
            >
              All ({products.length})
            </button>
            <button
              onClick={() => setStockStatusFilter('special')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                stockStatusFilter === 'special'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-amber-800 hover:text-amber-950'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Special ({specialDealsProducts.length})</span>
            </button>
            <button
              onClick={() => setStockStatusFilter('low')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                stockStatusFilter === 'low' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-800'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Low ({lowStockProducts.length})</span>
            </button>
            <button
              onClick={() => setStockStatusFilter('out')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                stockStatusFilter === 'out' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-800'
              }`}
            >
              <span>Out ({outOfStockProducts.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Inventory & Pricing Table */}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Item &amp; Photo</th>
                <th className="py-3 px-4">SKU / Barcode</th>
                <th className="py-3 px-4 text-right">Buy Price (Cost)</th>
                <th className="py-3 px-4 text-right">Sale Price (Retail)</th>
                <th className="py-3 px-4 text-right">Special Price</th>
                <th className="py-3 px-4 text-center">Gross Margin</th>
                <th className="py-3 px-4 text-right">{currentStore.code} Stock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredProducts.map((prod) => {
                const stockInCurrentStore = prod.stockByStore[currentStore.id] ?? 0;
                const threshold = prod.lowStockThreshold ?? 10;
                const isOutOfStock = stockInCurrentStore === 0;
                const isLow = !isOutOfStock && stockInCurrentStore <= threshold;
                const margin =
                  prod.price > 0 ? (((prod.price - prod.costPrice) / prod.price) * 100).toFixed(0) : '0';
                const marginNum = parseFloat(margin);

                return (
                  <tr key={prod.id} className="hover:bg-neutral-50/70 transition-colors">
                    {/* Photo & Title */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0">
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=160&h=160&q=80';
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-bold text-neutral-900 leading-snug">{prod.name}</p>
                          <span className="text-[11px] text-neutral-500 font-medium">{prod.category}</span>
                        </div>
                      </div>
                    </td>

                    {/* SKU & Barcode */}
                    <td className="py-3 px-4 font-mono text-neutral-600">
                      <div>{prod.sku}</div>
                      <div className="text-[11px] text-neutral-400">{prod.barcode}</div>
                    </td>

                    {/* Buy Price (Cost) */}
                    <td className="py-3 px-4 font-mono text-right text-neutral-600 tabular-nums">
                      <span className="font-semibold">{formatMoney(prod.costPrice)}</span>
                      <span className="block text-[10px] text-neutral-400 font-sans">Wholesale</span>
                    </td>

                    {/* Sale Price (Retail) */}
                    <td className="py-3 px-4 font-mono text-right font-bold text-neutral-950 tabular-nums">
                      <span>{formatMoney(prod.price)}</span>
                      {prod.costPrice > 0 && (
                        <span className="block text-[10px] text-emerald-700 font-sans font-medium">
                          +{(((prod.price - prod.costPrice) / prod.costPrice) * 100).toFixed(0)}% markup
                        </span>
                      )}
                    </td>

                    {/* Special Price */}
                    <td className="py-3 px-4 text-right">
                      {prod.specialPrice !== undefined ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="font-mono font-bold text-amber-900">
                              {formatMoney(prod.specialPrice)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleProductSpecial(prod)}
                              className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold cursor-pointer transition-colors ${
                                prod.isSpecialActive
                                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                  : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-700'
                              }`}
                              title="Toggle Special Price active status"
                            >
                              {prod.isSpecialActive ? 'Active' : 'Off'}
                            </button>
                          </div>
                          <span className="text-[9.5px] text-emerald-700 block font-semibold">
                            Save {formatMoney(prod.price - prod.specialPrice)}
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openEditModal(prod)}
                          className="text-[11px] text-neutral-400 hover:text-neutral-900 underline font-medium cursor-pointer"
                        >
                          + Set Special
                        </button>
                      )}
                    </td>

                    {/* Margin */}
                    <td className="py-3 px-4 text-center font-mono">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[11px] border ${
                          marginNum >= 40
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : marginNum >= 20
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : marginNum > 0
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {margin}%
                      </span>
                    </td>

                    {/* Stock level */}
                    <td className="py-3 px-4 font-mono text-right font-bold tabular-nums text-sm">
                      <span
                        className={
                          isOutOfStock ? 'text-rose-600' : isLow ? 'text-amber-700' : 'text-neutral-900'
                        }
                      >
                        {stockInCurrentStore}
                      </span>{' '}
                      <span className="text-[10px] font-normal text-neutral-400">units</span>
                    </td>

                    {/* Actions: Edit Pricing, Quick Restock, Adjust */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(prod)}
                          className="px-2.5 py-1 text-xs font-semibold text-neutral-800 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          title="Edit Buy Price, Sale Price, Special Price & Details"
                        >
                          <Edit2 className="w-3 h-3 text-neutral-600" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickRestock(prod, 10)}
                          className="px-2.5 py-1 text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                          title="Restock +10 units"
                        >
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>+10</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAdjustingProduct(prod);
                            setAdjustmentStoreId(currentStore.id);
                            setAdjustmentDelta(5);
                          }}
                          className="px-2 py-1 text-xs font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg cursor-pointer"
                        >
                          Stock
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

      {/* Quick Add Category Modal */}
      {isAddCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200 bg-neutral-50">
              <h3 className="text-sm font-bold text-neutral-900">Add Product Category</h3>
              <button
                type="button"
                onClick={() => setIsAddCatModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Produce, Spices, Bakery"
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCatModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-900 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 shadow-xs cursor-pointer"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEDICATED EDIT PRODUCT & PRICING OPTIONS MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200 bg-neutral-50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-xs">
                  <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">Edit Product &amp; Pricing Options</h3>
                  <p className="text-[11px] text-neutral-500 font-mono">
                    SKU: {editingProduct.sku} · ID: {editingProduct.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Product Title */}
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl font-medium text-neutral-900"
                />
              </div>

              {/* THREE PRICING MATRIX BOX */}
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-900 text-xs flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-neutral-700" />
                    <span>Pricing Matrix &amp; Margins ({currency.code})</span>
                  </span>
                  <span className="text-[11px] font-mono text-neutral-500">
                    Gross Margin: <strong className="text-emerald-700">{editFormMetrics.grossMarginPct}%</strong> · Markup: <strong className="text-neutral-800">{editFormMetrics.markupPct}%</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Buy Price */}
                  <div className="bg-white p-3 rounded-xl border border-neutral-200">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-neutral-700 text-xs">
                        Buy Price (Cost) *
                      </label>
                      <span className="text-[10px] text-neutral-400 font-mono">Supplier</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={editCost}
                        onChange={(e) => setEditCost(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 font-mono font-bold text-neutral-900 border border-neutral-300 rounded-lg bg-neutral-50/60"
                      />
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-1">Wholesale cost per item</p>
                  </div>

                  {/* Sale Price */}
                  <div className="bg-white p-3 rounded-xl border border-neutral-200">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-neutral-900 text-xs">
                        Sale Price (Retail) *
                      </label>
                      <span className="text-[10px] text-emerald-700 font-mono font-bold">Standard</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={editPrice}
                        onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 font-mono font-bold text-neutral-950 border border-neutral-300 rounded-lg bg-white"
                      />
                    </div>
                    {/* Quick Markup Presets from Cost */}
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      <span className="text-[9.5px] text-neutral-400">Markup:</span>
                      {[20, 30, 50, 100].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setEditPrice(calculateSalePriceFromMarkup(editCost, pct))}
                          className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 cursor-pointer"
                        >
                          +{pct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Special Price */}
                  <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-amber-950 text-xs">
                        Special Price ★
                      </label>
                      <span className="text-[10px] text-amber-700 font-mono font-bold">Offer</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editSpecialPrice}
                        onChange={(e) => setEditSpecialPrice(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 font-mono font-bold text-amber-950 border border-amber-300 rounded-lg bg-white"
                      />
                    </div>
                    {/* Quick Discount Presets from Sale Price */}
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      <span className="text-[9.5px] text-amber-800">Discount:</span>
                      {[10, 15, 20, 25].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() =>
                            setEditSpecialPrice(calculateSpecialPriceFromDiscount(editPrice, pct))
                          }
                          className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 cursor-pointer"
                        >
                          -{pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Special Price Activation Toggle */}
                <div className="flex items-center justify-between pt-1 border-t border-neutral-200">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="editIsSpecial"
                      checked={editIsSpecial}
                      onChange={(e) => setEditIsSpecial(e.target.checked)}
                      className="rounded text-neutral-900"
                    />
                    <label htmlFor="editIsSpecial" className="text-neutral-800 font-semibold cursor-pointer">
                      Activate Special Price offer for retail &amp; COD checkouts
                    </label>
                  </div>
                  {editFormMetrics.specialSavingsAmount !== undefined && (
                    <span className="text-[11px] font-bold text-emerald-700 font-mono">
                      Customer Saves {formatMoney(editFormMetrics.specialSavingsAmount)} ({editFormMetrics.specialSavingsPct}% OFF)
                    </span>
                  )}
                </div>

                {/* Loss / Negative Margin Warning */}
                {editFormHealth.isBelowCost && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <p className="text-[11px] font-semibold">
                      Caution: Selected selling price ({formatMoney(editIsSpecial ? editSpecialPrice : editPrice)}) is below the Buy Price cost ({formatMoney(editCost)}). This will result in a loss!
                    </p>
                  </div>
                )}
              </div>

              {/* Photo URL & Image Preview */}
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2">
                <label className="block font-bold text-neutral-900">Product Image URL</label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg bg-white border border-neutral-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {editImageUrl ? (
                      <img src={editImageUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-neutral-400" />
                    )}
                  </div>
                  <input
                    type="url"
                    required
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    className="flex-1 px-3 py-2 border border-neutral-300 rounded-xl font-mono text-xs bg-white"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-neutral-500 font-medium">Quick Pick Preset:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {PRESET_PRODUCT_IMAGES.map((pi) => (
                      <button
                        key={pi.name}
                        type="button"
                        onClick={() => setEditImageUrl(pi.url)}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium border cursor-pointer ${
                          editImageUrl === pi.url
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                        }`}
                      >
                        {pi.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Category & Tax Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Low Stock Alert Min</label>
                  <input
                    type="number"
                    min="1"
                    value={editThreshold}
                    onChange={(e) => setEditThreshold(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 font-mono border border-neutral-300 rounded-xl"
                  />
                </div>
              </div>

              {/* SKU & Barcode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">SKU Code</label>
                  <input
                    type="text"
                    value={editSku}
                    onChange={(e) => setEditSku(e.target.value)}
                    className="w-full px-3 py-2 font-mono border border-neutral-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Barcode</label>
                  <input
                    type="text"
                    value={editBarcode}
                    onChange={(e) => setEditBarcode(e.target.value)}
                    className="w-full px-3 py-2 font-mono border border-neutral-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-neutral-800"
                />
              </div>

              <div className="pt-3 border-t border-neutral-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-3.5 py-2 text-xs text-neutral-600 hover:text-neutral-900 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 shadow-xs cursor-pointer active:scale-95"
                >
                  Save Pricing &amp; Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Product Modal with Buy Price, Sale Price, and Special Price */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200 bg-neutral-50">
              <h3 className="text-sm font-bold text-neutral-900">Add Product &amp; Pricing Options</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateProduct} className="p-5 space-y-3.5 text-xs max-h-[82vh] overflow-y-auto">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pure Ceylon Cinnamon (250g)"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl"
                />
              </div>

              {/* Product Image URL & Preview */}
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2">
                <label className="block font-bold text-neutral-900">Product Image URL *</label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg bg-white border border-neutral-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {newProdImageUrl ? (
                      <img src={newProdImageUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-neutral-400" />
                    )}
                  </div>
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/product-image.jpg"
                    value={newProdImageUrl}
                    onChange={(e) => setNewProdImageUrl(e.target.value)}
                    className="flex-1 px-3 py-2 border border-neutral-300 rounded-xl font-mono text-xs bg-white"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-neutral-500 font-medium">Quick Pick Image:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {PRESET_PRODUCT_IMAGES.map((pi) => (
                      <button
                        key={pi.name}
                        type="button"
                        onClick={() => setNewProdImageUrl(pi.url)}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium border cursor-pointer ${
                          newProdImageUrl === pi.url
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                        }`}
                      >
                        {pi.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Category</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Initial Stock (Units)</label>
                  <input
                    type="number"
                    min="0"
                    value={newProdInitialQty}
                    onChange={(e) => setNewProdInitialQty(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 font-mono border border-neutral-300 rounded-xl"
                  />
                </div>
              </div>

              {/* THREE PRICING OPTIONS: Buy Price, Sale Price, Special Price */}
              <div className="p-3.5 bg-neutral-100/70 border border-neutral-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-900 block text-xs">
                    Pricing Matrix ({currency.code})
                  </span>
                  <span className="text-[11px] font-mono text-neutral-500">
                    Gross Margin: <strong className="text-emerald-700">{addFormMetrics.grossMarginPct}%</strong>
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">
                      Buy Price (Cost) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newProdCost}
                      onChange={(e) => setNewProdCost(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 font-mono text-neutral-900 border border-neutral-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-900 mb-1">
                      Sale Price (Retail) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newProdPrice}
                      onChange={(e) => setNewProdPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 font-mono font-bold text-neutral-950 border border-neutral-300 rounded-lg bg-white"
                    />
                    <div className="flex items-center gap-1 mt-1">
                      <button
                        type="button"
                        onClick={() => setNewProdPrice(calculateSalePriceFromMarkup(newProdCost, 30))}
                        className="text-[9px] font-bold text-neutral-600 bg-neutral-200 hover:bg-neutral-300 px-1 py-0.5 rounded cursor-pointer"
                      >
                        +30%
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewProdPrice(calculateSalePriceFromMarkup(newProdCost, 50))}
                        className="text-[9px] font-bold text-neutral-600 bg-neutral-200 hover:bg-neutral-300 px-1 py-0.5 rounded cursor-pointer"
                      >
                        +50%
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-amber-900 mb-1">
                      Special Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProdSpecialPrice}
                      onChange={(e) => setNewProdSpecialPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 font-mono font-bold text-amber-900 border border-amber-300 rounded-lg bg-amber-50"
                    />
                    <div className="flex items-center gap-1 mt-1">
                      <button
                        type="button"
                        onClick={() =>
                          setNewProdSpecialPrice(calculateSpecialPriceFromDiscount(newProdPrice, 15))
                        }
                        className="text-[9px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-1 py-0.5 rounded cursor-pointer"
                      >
                        -15%
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setNewProdSpecialPrice(calculateSpecialPriceFromDiscount(newProdPrice, 25))
                        }
                        className="text-[9px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-1 py-0.5 rounded cursor-pointer"
                      >
                        -25%
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="newProdIsSpecial"
                    checked={newProdIsSpecial}
                    onChange={(e) => setNewProdIsSpecial(e.target.checked)}
                    className="rounded text-neutral-900"
                  />
                  <label htmlFor="newProdIsSpecial" className="text-neutral-700 font-medium cursor-pointer">
                    Activate Special Price immediately on retail checkout
                  </label>
                </div>
                {addFormHealth.isBelowCost && (
                  <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[10.5px]">
                    Warning: Selling price is below buy price cost.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">SKU (Optional)</label>
                  <input
                    type="text"
                    placeholder="Auto-generated if empty"
                    value={newProdSku}
                    onChange={(e) => setNewProdSku(e.target.value)}
                    className="w-full px-3 py-2 font-mono border border-neutral-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Low Stock Alert Min</label>
                  <input
                    type="number"
                    min="1"
                    value={newProdThreshold}
                    onChange={(e) => setNewProdThreshold(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 font-mono border border-neutral-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 text-xs text-neutral-600 hover:text-neutral-900 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 shadow-xs cursor-pointer active:scale-95"
                >
                  Save Product &amp; Pricing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200 bg-neutral-50">
              <h3 className="text-sm font-bold text-neutral-900">Adjust Stock</h3>
              <button
                type="button"
                onClick={() => setAdjustingProduct(null)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-center gap-3">
                <img
                  src={adjustingProduct.imageUrl}
                  alt={adjustingProduct.name}
                  className="w-12 h-12 object-cover rounded-xl border border-neutral-200"
                />
                <div>
                  <p className="font-bold text-neutral-900">{adjustingProduct.name}</p>
                  <p className="font-mono text-neutral-500 mt-0.5">
                    SKU: {adjustingProduct.sku} · Current: {adjustingProduct.stockByStore[currentStore.id] ?? 0}
                  </p>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Delta (+ to add, - to reduce)
                </label>
                <input
                  type="number"
                  value={adjustmentDelta}
                  onChange={(e) => setAdjustmentDelta(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 font-mono font-bold border border-neutral-300 rounded-xl"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-900 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyAdjustment}
                  className="px-4 py-1.5 text-xs font-bold bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 shadow-xs cursor-pointer"
                >
                  Save Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
