import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Product,
  StoreLocation,
  Order,
  OrderItem,
  CartItem,
  Customer,
  LoyaltyProgramConfig,
  UserProfile,
  SyncLog,
  PaymentDetail,
  CodDetails,
  InvoiceDeliveryMethod,
  SiteBranding,
  StockAlert,
  VercelBuildDiagnostic,
  BuyRequest,
  BuyerType,
  AdminStoreOptions,
  ShippingOption,
  TrackingEvent,
  ReturnItem,
  OrderReturn,
  FulfillmentStatus,
} from '../types/pos';
import {
  INITIAL_STORES,
  INITIAL_PRODUCTS,
  INITIAL_LOYALTY_CONFIG,
  INITIAL_CUSTOMERS,
  INITIAL_ORDERS,
  INITIAL_BUY_REQUESTS,
  INITIAL_SHIPPING_OPTIONS,
} from '../data/initialData';
import { Currency, SUPPORTED_CURRENCIES, DEFAULT_CURRENCY, formatPrice } from '../utils/currency';
import { playScannerBeep, playSuccessChime, playStockWarningAlert } from '../utils/audio';

export const MASTER_ADMIN_EMAIL = 'alikkhanasarkhan@gmail.com';
export const DEFAULT_MASTER_PASSWORD = 'A*ahdee1996';

const INITIAL_CATEGORIES: string[] = [
  'Ceylon Tea & Spices',
  'Gourmet & Oils',
  'Beverage & Pantry',
  'Tableware & Living',
  'Lifestyle & Apparel',
  'Bakery & Deli',
];

const INITIAL_BRANDING: SiteBranding = {
  storeName: 'Aura Retail POS',
  logoUrl: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=160&h=160&q=80',
  heroTitle: '80mm Thermal Receipt POS, Live Inventory & Multi-Branch Sync',
  heroSubtitle:
    'Full-featured mobile retail terminal with realistic 80mm thermal roll preview, live barcode scanning, real-time stock alert telemetry, and uninterrupted offline synchronization.',
  heroBadge: 'Retail Mobile Suite & POS',
  phoneNumber: '+94 11 234 5678',
  whatsappNumber: '+94 77 123 4567',
  supportEmail: 'support@aurapos.lk',
  bannerImageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
  storeAddress: '45 Galle Road, Kollupitiya, Colombo',
};

export const DEFAULT_ADMIN_OPTIONS: AdminStoreOptions = {
  receiptAnimationEnabled: true,
  thermalPaperSlideSpeed: 'normal',
  receiptFeedSound: true,
  defaultPrintFormat: 'mobile',
  receiptFooterNote: 'Goods once sold are returnable within 14 days with original receipt. Thank you!',
  receiptTaxNumber: 'LK-VAT-99887766-CMB',
  showBarcodeOnReceipt: true,
  showQrOnReceipt: true,
  showStoreAddressOnReceipt: true,
  showPhoneOnReceipt: true,
  showLogoOnReceipt: true,
  showProductImageOnReceipt: false,
  requireAdminApprovalForBuyers: true,
  hideAdminInfoFromPublic: true,
  allowGuestCheckout: true,
  defaultBuyerType: 'product_buyer',
  enableCOD: true,
  maxCodOrderAmount: 250000,
  codHandlingFee: 0,
  requireCodPhoneVerification: true,
  lowStockThresholdDefault: 8,
  autoRestockBatchAmount: 15,
  scannerAutoAdd: true,
};

interface POSContextType {
  // Auth & Roles
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  loginAsDemo: (role: 'admin' | 'cashier' | 'customer') => void;
  loginWithMasterAdmin: (email: string, password: string) => { success: boolean; message: string };
  changePassword: (oldPassword: string, newPassword: string) => { success: boolean; message: string };
  logout: () => void;
  masterPassword: string;

  // Public Buyer Registration & Customer Login
  registerPublicBuyer: (data: {
    name: string;
    email: string;
    phone: string;
    password?: string;
    buyerType: BuyerType;
    businessName?: string;
    deliveryAddress?: string;
    city?: string;
    postalCode?: string;
    notes?: string;
  }) => { success: boolean; message: string; customer?: Customer };
  loginCustomer: (
    email: string,
    password?: string
  ) => { success: boolean; message: string; pendingApproval?: boolean; customer?: Customer };
  confirmCustomerRegistration: (customerId: string) => { success: boolean; message: string };
  rejectCustomerRegistration: (customerId: string) => { success: boolean; message: string };
  pendingRegistrationCount: number;

  // Buy Requests & Software System
  buyRequests: BuyRequest[];
  submitBuyRequest: (req: Omit<BuyRequest, 'id' | 'requestedAt' | 'status' | 'softwareDownloaded'>) => BuyRequest;
  approveBuyRequest: (requestId: string) => { success: boolean; message: string; requiresDownload?: boolean };
  rejectBuyRequest: (requestId: string) => void;
  downloadSoftwareSystemPackage: (requestId?: string) => void;

  // Site Branding & Catalog Categories
  branding: SiteBranding;
  updateBranding: (updated: Partial<SiteBranding>) => void;
  resetLogo: () => void;
  adminOptions: AdminStoreOptions;
  updateAdminOptions: (updated: Partial<AdminStoreOptions>) => void;
  categories: string[];
  addCategory: (name: string) => boolean;
  editCategory: (oldName: string, newName: string) => boolean;
  deleteCategory: (name: string) => boolean;

  // Multi-Currency
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatMoney: (amountInUSD: number) => string;
  allCurrencies: Currency[];

  // Store Management
  stores: StoreLocation[];
  currentStore: StoreLocation;
  setCurrentStoreId: (storeId: string) => void;
  updateStore: (updated: StoreLocation) => void;
  transferInventory: (productId: string, fromStoreId: string, toStoreId: string, quantity: number) => boolean;

  // Products & Inventory Management
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Product;
  updateProduct: (product: Product) => void;
  adjustStock: (productId: string, storeId: string, delta: number, reason?: string) => void;
  updateProductThreshold: (productId: string, threshold: number) => void;
  batchUpdateThresholds: (threshold: number, category?: string) => void;
  bulkRestockLowStock: (storeId: string, quantityToAdd?: number, category?: string) => number;

  // Real-Time Stock Notifications & Alerts
  stockAlerts: StockAlert[];
  unreadAlertCount: number;
  acknowledgeAlert: (alertId: string) => void;
  acknowledgeAllAlerts: () => void;
  dismissAlert: (alertId: string) => void;
  soundAlertsEnabled: boolean;
  setSoundAlertsEnabled: (enabled: boolean) => void;
  recentStockNotification: StockAlert | null;
  clearRecentNotification: () => void;

  // Barcode Scanning
  scanBarcode: (
    barcode: string,
    mode?: 'cart' | 'audit'
  ) => { success: boolean; product?: Product; message: string; stockInCurrentStore?: number };

  // Offline Data Syncing
  isOnline: boolean;
  isOfflineMode: boolean;
  setIsOfflineMode: (offline: boolean) => void;
  offlineQueueCount: number;
  syncLogs: SyncLog[];
  syncPendingTransactions: () => Promise<{ success: boolean; count: number }>;
  lastSyncTime: string | null;

  // Cart & POS Terminal
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, useSpecialPrice?: boolean, customPrice?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  toggleCartItemSpecialPrice: (productId: string) => void;
  setCartItemPricingOption: (
    productId: string,
    option: 'sale' | 'special' | 'custom',
    customPrice?: number
  ) => void;
  setCartItemDiscount: (productId: string, discountPercent: number) => void;
  clearCart: () => void;
  cartSpecialSavingsTotal: number;

  // Inventory Valuation & Pricing Analytics
  catalogValuation: {
    totalBuyCost: number;
    totalRetailValue: number;
    potentialProfit: number;
    averageMarginPct: number;
    specialDealsCount: number;
  };

  // Loyalty & Customers
  activeLoyaltyCustomer: Customer | null;
  setActiveLoyaltyCustomer: (customer: Customer | null) => void;
  redeemedPoints: number;
  setRedeemedPoints: (points: number) => void;
  loyaltyConfig: LoyaltyProgramConfig;
  updateLoyaltyConfig: (config: LoyaltyProgramConfig) => void;
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'loyaltyPoints' | 'lifetimeSpend' | 'registeredAt'>) => Customer;
  updateCustomer: (customer: Customer) => void;
  verifyCustomer: (customerId: string, status: boolean) => void;
  isAddCustomerModalOpen: boolean;
  setIsAddCustomerModalOpen: (open: boolean) => void;

  // Financial Calculations
  subtotal: number;
  discountTotal: number;
  taxableSubtotal: number;
  taxRate: number;
  taxAmount: number;
  loyaltyDiscountAmount: number;
  grandTotal: number;
  pointsToEarn: number;

  // Orders & Invoicing
  orders: Order[];
  processCheckout: (payments: PaymentDetail[], codInfo?: CodDetails) => Promise<Order>;
  processPublicCODOrder: (items: CartItem[], codInfo: CodDetails) => Promise<Order>;
  activeReceiptOrder: Order | null;
  setActiveReceiptOrder: (order: Order | null) => void;
  activeInvoiceOrder: Order | null;
  setActiveInvoiceOrder: (order: Order | null) => void;
  recordInvoiceDelivery: (orderId: string, method: InvoiceDeliveryMethod) => void;
  createTestReceiptOrder: () => Order;

  // Product Send, Fulfillment, Shipping Options & Order Tracking
  shippingOptions: ShippingOption[];
  updateShippingOption: (option: ShippingOption) => void;
  addShippingOption: (option: Omit<ShippingOption, 'id'>) => ShippingOption;
  deleteShippingOption: (id: string) => void;
  fulfillOrder: (
    orderId: string,
    details: {
      carrier: string;
      trackingNumber: string;
      shippingOptionId?: string;
      shippingFee?: number;
      notes?: string;
      notifyCustomer?: boolean;
    }
  ) => { success: boolean; message: string; trackingNumber: string };
  updateTrackingStatus: (
    orderId: string,
    status: FulfillmentStatus,
    title: string,
    description: string,
    location?: string
  ) => { success: boolean; message: string };
  lookupOrderByQuery: (query: string) => Order | null;

  // Product Return & Refunds (RMA)
  returns: OrderReturn[];
  processOrderReturn: (
    orderId: string,
    returnData: {
      items: ReturnItem[];
      refundMethod: 'cash' | 'original_payment' | 'store_credit' | 'exchange';
      refundAmount: number;
      restockInventory: boolean;
      notes?: string;
    }
  ) => { success: boolean; message: string; returnRecord: OrderReturn };
  activeReturnRecord: OrderReturn | null;
  setActiveReturnRecord: (rec: OrderReturn | null) => void;

  // Vercel Build Diagnostic & System Disaster Recovery
  getVercelBuildDiagnostic: () => VercelBuildDiagnostic;
  exportSystemBackup: () => { data: string; filename: string };
  restoreSystemBackup: (jsonContent: string) => { success: boolean; message: string; details?: any };
  resetToFactoryDefaults: () => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: 'aura_pos_user_v3',
  ADMIN_PASSWORD: 'aura_pos_admin_password_v3',
  STORES: 'aura_pos_stores_v3',
  CURRENT_STORE: 'aura_pos_store_id_v3',
  PRODUCTS: 'aura_pos_products_v3',
  CATEGORIES: 'aura_pos_categories_v3',
  CUSTOMERS: 'aura_pos_customers_v3',
  LOYALTY: 'aura_pos_loyalty_v3',
  ORDERS: 'aura_pos_orders_v3',
  OFFLINE_QUEUE: 'aura_pos_offline_queue_v3',
  SYNC_LOGS: 'aura_pos_sync_logs_v3',
  IS_OFFLINE: 'aura_pos_is_offline_v3',
  CURRENCY: 'aura_pos_currency_v3',
  BRANDING: 'aura_pos_branding_v3',
  DISMISSED_ALERTS: 'aura_pos_dismissed_alerts_v3',
  SOUND_ENABLED: 'aura_pos_sound_alerts_v3',
  BUY_REQUESTS: 'aura_pos_buy_requests_v3',
  ADMIN_OPTIONS: 'aura_pos_admin_options_v3',
  SHIPPING_OPTIONS: 'aura_pos_shipping_options_v3',
  RETURNS: 'aura_pos_returns_v3',
};

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [masterPassword, setMasterPassword] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_PASSWORD);
      return saved || DEFAULT_MASTER_PASSWORD;
    } catch {
      return DEFAULT_MASTER_PASSWORD;
    }
  });

  const [currentUser, setCurrentUserState] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [branding, setBranding] = useState<SiteBranding>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BRANDING);
      return saved ? JSON.parse(saved) : INITIAL_BRANDING;
    } catch {
      return INITIAL_BRANDING;
    }
  });

  const [adminOptions, setAdminOptionsState] = useState<AdminStoreOptions>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_OPTIONS);
      return saved ? { ...DEFAULT_ADMIN_OPTIONS, ...JSON.parse(saved) } : DEFAULT_ADMIN_OPTIONS;
    } catch {
      return DEFAULT_ADMIN_OPTIONS;
    }
  });

  const updateAdminOptions = useCallback((updated: Partial<AdminStoreOptions>) => {
    setAdminOptionsState((prev) => {
      const next = { ...prev, ...updated };
      try {
        localStorage.setItem(STORAGE_KEYS.ADMIN_OPTIONS, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save admin options', e);
      }
      return next;
    });
  }, []);

  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  // Currency: defaults to LKR (Sri Lankan Rupee)
  const [currency, setCurrencyState] = useState<Currency>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENCY);
      if (saved) {
        const found = SUPPORTED_CURRENCIES.find((c) => c.code === saved);
        if (found) return found;
      }
      return DEFAULT_CURRENCY; // LKR
    } catch {
      return DEFAULT_CURRENCY;
    }
  });

  const [stores, setStores] = useState<StoreLocation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STORES);
      return saved ? JSON.parse(saved) : INITIAL_STORES;
    } catch {
      return INITIAL_STORES;
    }
  });

  const [currentStoreId, setCurrentStoreIdState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_STORE);
      return saved || INITIAL_STORES[0].id;
    } catch {
      return INITIAL_STORES[0].id;
    }
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
    } catch {
      return INITIAL_CUSTOMERS;
    }
  });

  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyProgramConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOYALTY);
      return saved ? JSON.parse(saved) : INITIAL_LOYALTY_CONFIG;
    } catch {
      return INITIAL_LOYALTY_CONFIG;
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  const [buyRequests, setBuyRequests] = useState<BuyRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BUY_REQUESTS);
      return saved ? JSON.parse(saved) : INITIAL_BUY_REQUESTS;
    } catch {
      return INITIAL_BUY_REQUESTS;
    }
  });

  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const [isOfflineMode, setIsOfflineModeState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.IS_OFFLINE);
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [offlineQueue, setOfflineQueue] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [syncLogs, setSyncLogs] = useState<SyncLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SYNC_LOGS);
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 'log_boot',
              timestamp: new Date().toISOString(),
              type: 'cloud_pull',
              status: 'success',
              itemsCount: INITIAL_PRODUCTS.length,
              details: 'Local inventory and catalog initialized with LKR currency support.',
            },
          ];
    } catch {
      return [];
    }
  });

  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => new Date().toISOString());

  const [acknowledgedAlertIds, setAcknowledgedAlertIds] = useState<Set<string>>(new Set());
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DISMISSED_ALERTS);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [soundAlertsEnabled, setSoundAlertsEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [recentStockNotification, setRecentStockNotification] = useState<StockAlert | null>(null);

  // Cart & Terminal
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeLoyaltyCustomer, setActiveLoyaltyCustomer] = useState<Customer | null>(null);
  const [redeemedPoints, setRedeemedPoints] = useState<number>(0);
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<Order | null>(null);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);

  // Shipping Options & Product Send / Returns
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SHIPPING_OPTIONS);
      return saved ? JSON.parse(saved) : INITIAL_SHIPPING_OPTIONS;
    } catch {
      return INITIAL_SHIPPING_OPTIONS;
    }
  });

  const [returns, setReturns] = useState<OrderReturn[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RETURNS);
      if (saved) return JSON.parse(saved);
      const initReturns: OrderReturn[] = [];
      INITIAL_ORDERS.forEach((o) => {
        if (o.returns && o.returns.length > 0) {
          initReturns.push(...o.returns);
        }
      });
      return initReturns;
    } catch {
      return [];
    }
  });

  const [activeReturnRecord, setActiveReturnRecord] = useState<OrderReturn | null>(null);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD, masterPassword);
  }, [masterPassword]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BRANDING, JSON.stringify(branding));
  }, [branding]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(stores));
  }, [stores]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_STORE, currentStoreId);
  }, [currentStoreId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOYALTY, JSON.stringify(loyaltyConfig));
  }, [loyaltyConfig]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BUY_REQUESTS, JSON.stringify(buyRequests));
  }, [buyRequests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHIPPING_OPTIONS, JSON.stringify(shippingOptions));
  }, [shippingOptions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify(returns));
  }, [returns]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.IS_OFFLINE, JSON.stringify(isOfflineMode));
  }, [isOfflineMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SYNC_LOGS, JSON.stringify(syncLogs));
  }, [syncLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DISMISSED_ALERTS, JSON.stringify(Array.from(dismissedAlertIds)));
  }, [dismissedAlertIds]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, JSON.stringify(soundAlertsEnabled));
  }, [soundAlertsEnabled]);

  // Online / offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (!isOfflineMode && offlineQueue.length > 0) {
        syncPendingTransactions();
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOfflineMode, offlineQueue.length]);

  const currentStore = useMemo(() => {
    return stores.find((s) => s.id === currentStoreId) || stores[0] || INITIAL_STORES[0];
  }, [stores, currentStoreId]);

  const setCurrentStoreId = useCallback((storeId: string) => {
    setCurrentStoreIdState(storeId);
  }, []);

  const setCurrentUser = useCallback((user: UserProfile | null) => {
    setCurrentUserState(user);
  }, []);

  // MASTER ADMIN AUTH
  const loginWithMasterAdmin = useCallback(
    (emailInput: string, passwordInput: string): { success: boolean; message: string } => {
      const cleanEmail = emailInput.trim().toLowerCase();
      if (cleanEmail !== MASTER_ADMIN_EMAIL.toLowerCase()) {
        return {
          success: false,
          message: 'Access restricted: Unauthorized administrator credentials.',
        };
      }
      if (passwordInput !== masterPassword) {
        return {
          success: false,
          message: 'Incorrect admin password. Verification failed.',
        };
      }
      const adminUser: UserProfile = {
        id: 'usr_master_admin',
        name: 'Master Administrator',
        email: MASTER_ADMIN_EMAIL,
        role: 'admin',
        storeId: currentStoreId,
        isVerified: true,
        adminVerified: true,
      };
      setCurrentUserState(adminUser);
      playSuccessChime();
      return { success: true, message: 'Welcome back, Master Administrator!' };
    },
    [masterPassword, currentStoreId]
  );

  const changePassword = useCallback(
    (oldPass: string, newPass: string): { success: boolean; message: string } => {
      if (oldPass !== masterPassword) {
        return { success: false, message: 'Current password verification failed.' };
      }
      if (!newPass || newPass.length < 6) {
        return { success: false, message: 'New password must be at least 6 characters long.' };
      }
      setMasterPassword(newPass);
      return { success: true, message: 'Master admin password updated successfully!' };
    },
    [masterPassword]
  );

  // PUBLIC BUYER REGISTRATION
  const registerPublicBuyer = useCallback(
    (data: {
      name: string;
      email: string;
      phone: string;
      password?: string;
      buyerType: BuyerType;
      businessName?: string;
      deliveryAddress?: string;
      city?: string;
      postalCode?: string;
      notes?: string;
    }): { success: boolean; message: string; customer?: Customer } => {
      const cleanEmail = data.email.trim().toLowerCase();
      const existing = customers.find((c) => c.email.toLowerCase() === cleanEmail);
      if (existing) {
        return {
          success: false,
          message: 'An account with this email already exists.',
        };
      }
      const newCustomer: Customer = {
        id: `cust_${Date.now()}`,
        name: data.name.trim(),
        email: cleanEmail,
        phone: data.phone.trim(),
        password: data.password || 'password123',
        buyerType: data.buyerType,
        businessName: data.businessName?.trim() || undefined,
        deliveryAddress: data.deliveryAddress?.trim() || undefined,
        city: data.city?.trim() || undefined,
        postalCode: data.postalCode?.trim() || undefined,
        loyaltyPoints: 50,
        lifetimeSpend: 0,
        tierId: 'tier_bronze',
        registeredAt: new Date().toISOString(),
        notes: data.notes?.trim() || undefined,
        verifiedByAdmin: false,
        adminConfirmed: false,
        registrationStatus: 'pending_confirmation',
      };
      setCustomers((prev) => [newCustomer, ...prev]);

      const newReq: BuyRequest = {
        id: `req_${Date.now()}`,
        customerName: newCustomer.name,
        customerEmail: newCustomer.email,
        customerPhone: newCustomer.phone,
        total: 0,
        currencyCode: currency.code,
        itemsCount: 1,
        itemsSummary:
          data.buyerType === 'pos_buyer'
            ? `New POS Buyer Registration (${data.businessName || 'Store Operation'})`
            : `New Product Buyer Registration (${newCustomer.name})`,
        requestType: 'registration_request',
        businessName: data.businessName,
        status: 'pending',
        requestedAt: new Date().toISOString(),
        softwareDownloaded: false,
        notes: `Buyer registration awaiting administrator confirmation. Contact: ${newCustomer.phone}`,
      };
      setBuyRequests((prev) => [newReq, ...prev]);

      return {
        success: true,
        message:
          'Your registration was submitted successfully! It has been forwarded to Store Administration for confirmation.',
        customer: newCustomer,
      };
    },
    [customers, currency.code]
  );

  // PUBLIC CUSTOMER LOGIN
  const loginCustomer = useCallback(
    (
      emailInput: string,
      passwordInput?: string
    ): { success: boolean; message: string; pendingApproval?: boolean; customer?: Customer } => {
      const cleanEmail = emailInput.trim().toLowerCase();
      const customer = customers.find((c) => c.email.toLowerCase() === cleanEmail);
      if (!customer) {
        return {
          success: false,
          message: 'No account found with this email. Please register as a Product Buyer or POS Buyer first.',
        };
      }
      if (!customer.adminConfirmed || customer.registrationStatus === 'pending_confirmation') {
        return {
          success: false,
          pendingApproval: true,
          message:
            'Your account registration has been submitted and is currently awaiting Administrator confirmation. You will be able to log in once approved by the administrator.',
          customer,
        };
      }
      if (customer.registrationStatus === 'rejected') {
        return {
          success: false,
          message: 'This registration application was not approved by the administrator.',
          customer,
        };
      }
      if (customer.password && passwordInput && customer.password !== passwordInput) {
        return {
          success: false,
          message: 'Incorrect password. Please verify your credentials.',
        };
      }
      const userProfile: UserProfile = {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        role: 'customer',
        phone: customer.phone,
        loyaltyPoints: customer.loyaltyPoints,
        isVerified: customer.adminConfirmed,
        adminVerified: customer.verifiedByAdmin,
      };
      setCurrentUserState(userProfile);
      playSuccessChime();
      return {
        success: true,
        message: `Welcome back, ${customer.name}! You are logged in.`,
        customer,
      };
    },
    [customers]
  );

  const confirmCustomerRegistration = useCallback(
    (customerId: string): { success: boolean; message: string } => {
      const target = customers.find((c) => c.id === customerId);
      if (!target) return { success: false, message: 'Customer not found.' };
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId
            ? {
                ...c,
                adminConfirmed: true,
                registrationStatus: 'confirmed',
                confirmedAt: new Date().toISOString(),
                verifiedByAdmin: true,
              }
            : c
        )
      );
      setBuyRequests((prev) =>
        prev.map((r) =>
          r.customerEmail.toLowerCase() === target.email.toLowerCase() && r.requestType === 'registration_request'
            ? { ...r, status: 'accepted', acceptedAt: new Date().toISOString() }
            : r
        )
      );
      playSuccessChime();
      return {
        success: true,
        message: `Registration confirmed for ${target.name}! The buyer can now log in to the application.`,
      };
    },
    [customers]
  );

  const rejectCustomerRegistration = useCallback(
    (customerId: string): { success: boolean; message: string } => {
      setCustomers((prev) =>
        prev.map((c) => (c.id === customerId ? { ...c, registrationStatus: 'rejected' } : c))
      );
      return { success: true, message: 'Customer registration rejected.' };
    },
    []
  );

  const pendingRegistrationCount = useMemo(() => {
    return customers.filter((c) => !c.adminConfirmed && c.registrationStatus === 'pending_confirmation').length;
  }, [customers]);

  const submitBuyRequest = useCallback(
    (req: Omit<BuyRequest, 'id' | 'requestedAt' | 'status' | 'softwareDownloaded'>): BuyRequest => {
      const newReq: BuyRequest = {
        ...req,
        id: `req_${Date.now()}`,
        status: 'pending',
        requestedAt: new Date().toISOString(),
        softwareDownloaded: false,
      };
      setBuyRequests((prev) => [newReq, ...prev]);
      return newReq;
    },
    []
  );

  const downloadSoftwareSystemPackage = useCallback(
    (requestId?: string) => {
      const softwarePackage = {
        softwareName: 'Aura Omnichannel POS & Retail System',
        packageVersion: '3.0.0-LKR-THERMAL-80MM',
        buildDate: new Date().toISOString(),
        storeLocation: currentStore,
        activeCurrencies: SUPPORTED_CURRENCIES,
        offlineDatabaseSnapshot: {
          productsCount: products.length,
          ordersCount: orders.length,
          customersCount: customers.length,
          categoriesList: categories,
          brandingConfig: branding,
        },
        securitySignature: `RSA2048-CERT-SIG-${Date.now()}-${Math.floor(100000 + Math.random() * 900000)}`,
        installationInstructions: [
          '1. Mount offline PWA/Desktop database package.',
          '2. Connect 80mm thermal receipt printer and configure roll cut feed.',
          '3. Connect barcode laser scanner.',
        ],
      };
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(softwarePackage, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `aura-pos-system-package-${currentStore.code}-${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      if (requestId) {
        setBuyRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, softwareDownloaded: true } : r))
        );
      }
    },
    [currentStore, products, orders, customers, categories, branding]
  );

  const approveBuyRequest = useCallback(
    (requestId: string): { success: boolean; message: string; requiresDownload?: boolean } => {
      const targetReq = buyRequests.find((r) => r.id === requestId);
      if (!targetReq) return { success: false, message: 'Request not found.' };
      if (!targetReq.softwareDownloaded) {
        downloadSoftwareSystemPackage(requestId);
        return {
          success: false,
          requiresDownload: true,
          message: 'Software system package downloaded! Click "Accept" again to finalize approval.',
        };
      }
      const generatedKey = `AURA-SYS-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
      setBuyRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? {
                ...r,
                status: 'accepted',
                acceptedAt: new Date().toISOString(),
                licenseKey: generatedKey,
              }
            : r
        )
      );
      const matchingCust = customers.find(
        (c) => c.email.toLowerCase() === targetReq.customerEmail.toLowerCase()
      );
      if (matchingCust) {
        confirmCustomerRegistration(matchingCust.id);
      }
      playSuccessChime();
      return {
        success: true,
        message: `Request approved! Software authorization dispatched to ${targetReq.customerEmail}.`,
      };
    },
    [buyRequests, downloadSoftwareSystemPackage, customers, confirmCustomerRegistration]
  );

  const rejectBuyRequest = useCallback((requestId: string) => {
    setBuyRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'rejected' } : r))
    );
  }, []);

  const loginAsDemo = useCallback(
    (role: 'admin' | 'cashier' | 'customer') => {
      if (role === 'admin') {
        loginWithMasterAdmin(MASTER_ADMIN_EMAIL, masterPassword);
      } else if (role === 'cashier') {
        setCurrentUserState({
          id: 'usr_cashier',
          name: 'Kasun Wickramasinghe',
          email: 'kasun.w@auraretail.lk',
          role: 'cashier',
          storeId: currentStoreId,
          isVerified: true,
          adminVerified: true,
        });
      } else {
        const cust = customers[0] || INITIAL_CUSTOMERS[0];
        setCurrentUserState({
          id: cust.id,
          name: cust.name,
          email: cust.email,
          role: 'customer',
          loyaltyPoints: cust.loyaltyPoints,
          phone: cust.phone,
          isVerified: cust.adminConfirmed,
        });
      }
    },
    [currentStoreId, customers, loginWithMasterAdmin, masterPassword]
  );

  const logout = useCallback(() => {
    setCurrentUserState(null);
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENCY, c.code);
    } catch {}
  }, []);

  const formatMoney = useCallback(
    (amountInUSD: number) => {
      return formatPrice(amountInUSD, currency);
    },
    [currency]
  );

  const addCategory = useCallback((name: string): boolean => {
    const clean = name.trim();
    if (!clean) return false;
    setCategories((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
    return true;
  }, []);

  const editCategory = useCallback((oldName: string, newName: string): boolean => {
    const clean = newName.trim();
    if (!clean) return false;
    setCategories((prev) => prev.map((c) => (c === oldName ? clean : c)));
    setProducts((prev) =>
      prev.map((p) => (p.category === oldName ? { ...p, category: clean } : p))
    );
    return true;
  }, []);

  const deleteCategory = useCallback((name: string): boolean => {
    setCategories((prev) => {
      const remaining = prev.filter((c) => c !== name);
      const fallback = remaining[0] || 'General';
      setProducts((prods) =>
        prods.map((p) => (p.category === name ? { ...p, category: fallback } : p))
      );
      return remaining;
    });
    return true;
  }, []);

  const updateBranding = useCallback((updated: Partial<SiteBranding>) => {
    setBranding((prev) => ({ ...prev, ...updated }));
  }, []);

  const resetLogo = useCallback(() => {
    setBranding((prev) => ({ ...prev, logoUrl: INITIAL_BRANDING.logoUrl }));
  }, []);

  const updateStore = useCallback((updated: StoreLocation) => {
    setStores((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }, []);

  // Stock Alerts
  const stockAlerts: StockAlert[] = useMemo(() => {
    const alerts: StockAlert[] = [];
    products.forEach((prod) => {
      stores.forEach((st) => {
        const stock = prod.stockByStore[st.id] ?? 0;
        const threshold = prod.lowStockThreshold ?? 10;
        const alertId = `alert_${prod.id}_${st.id}`;
        if (!dismissedAlertIds.has(alertId)) {
          if (stock === 0) {
            alerts.push({
              id: alertId,
              productId: prod.id,
              productName: prod.name,
              sku: prod.sku,
              storeId: st.id,
              storeName: st.name,
              currentStock: 0,
              threshold,
              urgency: 'critical',
              timestamp: prod.updatedAt || new Date().toISOString(),
              acknowledged: acknowledgedAlertIds.has(alertId),
            });
          } else if (stock <= threshold) {
            alerts.push({
              id: alertId,
              productId: prod.id,
              productName: prod.name,
              sku: prod.sku,
              storeId: st.id,
              storeName: st.name,
              currentStock: stock,
              threshold,
              urgency: 'warning',
              timestamp: prod.updatedAt || new Date().toISOString(),
              acknowledged: acknowledgedAlertIds.has(alertId),
            });
          }
        }
      });
    });
    return alerts.sort((a, b) => {
      if (a.urgency === 'critical' && b.urgency !== 'critical') return -1;
      if (b.urgency === 'critical' && a.urgency !== 'critical') return 1;
      return a.currentStock - b.currentStock;
    });
  }, [products, stores, dismissedAlertIds, acknowledgedAlertIds]);

  const unreadAlertCount = useMemo(() => {
    return stockAlerts.filter((a) => !a.acknowledged).length;
  }, [stockAlerts]);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAcknowledgedAlertIds((prev) => new Set(prev).add(alertId));
  }, []);

  const acknowledgeAllAlerts = useCallback(() => {
    setAcknowledgedAlertIds(new Set(stockAlerts.map((a) => a.id)));
  }, [stockAlerts]);

  const dismissAlert = useCallback((alertId: string) => {
    setDismissedAlertIds((prev) => new Set(prev).add(alertId));
  }, []);

  const clearRecentNotification = useCallback(() => {
    setRecentStockNotification(null);
  }, []);

  const triggerStockAlertCheck = useCallback(
    (product: Product, storeId: string, newStock: number) => {
      const threshold = product.lowStockThreshold ?? 10;
      const storeObj = stores.find((s) => s.id === storeId) || currentStore;
      if (newStock <= threshold) {
        const isCritical = newStock === 0;
        const newAlert: StockAlert = {
          id: `alert_${product.id}_${storeId}`,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          storeId,
          storeName: storeObj.name,
          currentStock: newStock,
          threshold,
          urgency: isCritical ? 'critical' : 'warning',
          timestamp: new Date().toISOString(),
          acknowledged: false,
        };
        setRecentStockNotification(newAlert);
        if (soundAlertsEnabled) {
          playStockWarningAlert();
        }
      }
    },
    [stores, currentStore, soundAlertsEnabled]
  );

  const addProduct = useCallback(
    (productData: Omit<Product, 'id'>): Product => {
      const newProduct: Product = {
        ...productData,
        id: `prod_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        updatedAt: new Date().toISOString(),
      };
      setProducts((prev) => [newProduct, ...prev]);
      return newProduct;
    },
    []
  );

  const updateProduct = useCallback((product: Product) => {
    const updated = { ...product, updatedAt: new Date().toISOString() };
    setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
  }, []);

  const adjustStock = useCallback(
    (productId: string, storeId: string, delta: number, _reason?: string) => {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== productId) return p;
          const currentQty = p.stockByStore[storeId] ?? 0;
          const newQty = Math.max(0, currentQty + delta);
          triggerStockAlertCheck(p, storeId, newQty);
          return {
            ...p,
            updatedAt: new Date().toISOString(),
            stockByStore: {
              ...p.stockByStore,
              [storeId]: newQty,
            },
          };
        })
      );
    },
    [triggerStockAlertCheck]
  );

  const transferInventory = useCallback(
    (productId: string, fromStoreId: string, toStoreId: string, quantity: number): boolean => {
      let success = false;
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== productId) return p;
          const fromQty = p.stockByStore[fromStoreId] ?? 0;
          if (fromQty < quantity) {
            success = false;
            return p;
          }
          success = true;
          const newFrom = fromQty - quantity;
          const newTo = (p.stockByStore[toStoreId] ?? 0) + quantity;
          triggerStockAlertCheck(p, fromStoreId, newFrom);
          return {
            ...p,
            updatedAt: new Date().toISOString(),
            stockByStore: {
              ...p.stockByStore,
              [fromStoreId]: newFrom,
              [toStoreId]: newTo,
            },
          };
        })
      );
      return success;
    },
    [triggerStockAlertCheck]
  );

  const updateProductThreshold = useCallback((productId: string, threshold: number) => {
    const safeThreshold = Math.max(0, Math.round(threshold));
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, lowStockThreshold: safeThreshold } : p))
    );
  }, []);

  const batchUpdateThresholds = useCallback((threshold: number, category?: string) => {
    const safeThreshold = Math.max(0, Math.round(threshold));
    setProducts((prev) =>
      prev.map((p) => {
        if (!category || category === 'all' || p.category === category) {
          return { ...p, lowStockThreshold: safeThreshold };
        }
        return p;
      })
    );
  }, []);

  const bulkRestockLowStock = useCallback(
    (storeId: string, quantityToAdd = 15, category?: string): number => {
      let count = 0;
      setProducts((prev) =>
        prev.map((p) => {
          if (category && category !== 'all' && p.category !== category) return p;
          const currentQty = p.stockByStore[storeId] ?? 0;
          if (currentQty <= p.lowStockThreshold) {
            count++;
            return {
              ...p,
              updatedAt: new Date().toISOString(),
              stockByStore: {
                ...p.stockByStore,
                [storeId]: currentQty + quantityToAdd,
              },
            };
          }
          return p;
        })
      );
      playSuccessChime();
      return count;
    },
    []
  );

  // Barcode Scanner
  const scanBarcode = useCallback(
    (
      barcodeInput: string,
      mode: 'cart' | 'audit' = 'cart'
    ): { success: boolean; product?: Product; message: string; stockInCurrentStore?: number } => {
      const clean = barcodeInput.trim();
      if (!clean) return { success: false, message: 'Invalid or empty barcode' };
      const match = products.find(
        (p) =>
          p.barcode === clean ||
          p.sku.toLowerCase() === clean.toLowerCase() ||
          p.id === clean
      );
      if (match) {
        playScannerBeep();
        const stockInStore = match.stockByStore[currentStore.id] ?? 0;
        if (mode === 'cart') {
          if (stockInStore <= 0) {
            return {
              success: false,
              product: match,
              message: `"${match.name}" is currently Out of Stock at ${currentStore.name}.`,
              stockInCurrentStore: 0,
            };
          }
          setCart((prev) => {
            const existing = prev.find((item) => item.product.id === match.id);
            if (existing) {
              return prev.map((item) =>
                item.product.id === match.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              );
            }
            return [...prev, { product: match, quantity: 1, discountPercent: 0 }];
          });
          return {
            success: true,
            product: match,
            message: `Scanned & added "${match.name}"`,
            stockInCurrentStore: stockInStore,
          };
        } else {
          return {
            success: true,
            product: match,
            message: `Item identified: ${match.name} (SKU: ${match.sku})`,
            stockInCurrentStore: stockInStore,
          };
        }
      }
      return { success: false, message: `No inventory product found matching barcode "${clean}".` };
    },
    [products, currentStore]
  );

  // Cart operations with Buy, Sale, and Special Price Options
  const addToCart = useCallback(
    (product: Product, quantity = 1, useSpecialPrice?: boolean, customPrice?: number) => {
      setCart((prev) => {
        const existing = prev.find((item) => item.product.id === product.id);
        const preferSpecial =
          useSpecialPrice !== undefined
            ? useSpecialPrice
            : Boolean(product.isSpecialActive && product.specialPrice !== undefined);
        const pricingOption: 'sale' | 'special' | 'custom' =
          customPrice !== undefined ? 'custom' : preferSpecial ? 'special' : 'sale';

        if (existing) {
          return prev.map((item) =>
            item.product.id === product.id
              ? {
                  ...item,
                  quantity: item.quantity + quantity,
                  useSpecialPrice: preferSpecial,
                  pricingOption,
                  customPrice: customPrice !== undefined ? customPrice : item.customPrice,
                }
              : item
          );
        }
        return [
          ...prev,
          {
            product,
            quantity,
            discountPercent: 0,
            useSpecialPrice: preferSpecial,
            pricingOption,
            customPrice,
          },
        ];
      });
    },
    []
  );

  const toggleCartItemSpecialPrice = useCallback((productId: string) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;
        const nextUseSpecial = !item.useSpecialPrice;
        return {
          ...item,
          useSpecialPrice: nextUseSpecial,
          pricingOption: nextUseSpecial ? 'special' : 'sale',
          customPrice: undefined,
        };
      })
    );
  }, []);

  const setCartItemPricingOption = useCallback(
    (productId: string, option: 'sale' | 'special' | 'custom', customPrice?: number) => {
      setCart((prev) =>
        prev.map((item) => {
          if (item.product.id !== productId) return item;
          const isSpecial = option === 'special';
          return {
            ...item,
            pricingOption: option,
            useSpecialPrice: isSpecial,
            customPrice:
              option === 'custom'
                ? customPrice !== undefined
                  ? customPrice
                  : item.customPrice || item.product.price
                : undefined,
          };
        })
      );
    },
    []
  );

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  }, []);

  const setCartItemDiscount = useCallback((productId: string, discountPercent: number) => {
    const safePercent = Math.max(0, Math.min(100, discountPercent));
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, discountPercent: safePercent } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setActiveLoyaltyCustomer(null);
    setRedeemedPoints(0);
  }, []);

  // Customer Management
  const addCustomer = useCallback(
    (
      customerData: Omit<Customer, 'id' | 'loyaltyPoints' | 'lifetimeSpend' | 'registeredAt'>
    ): Customer => {
      const newCust: Customer = {
        ...customerData,
        id: `cust_${Date.now()}`,
        loyaltyPoints: 50,
        lifetimeSpend: 0,
        tierId: 'tier_bronze',
        registeredAt: new Date().toISOString(),
        verifiedByAdmin: true,
        adminConfirmed: true,
        registrationStatus: 'confirmed',
      };
      setCustomers((prev) => [newCust, ...prev]);
      return newCust;
    },
    []
  );

  const updateCustomer = useCallback(
    (customer: Customer) => {
      setCustomers((prev) => prev.map((c) => (c.id === customer.id ? customer : c)));
      if (activeLoyaltyCustomer?.id === customer.id) {
        setActiveLoyaltyCustomer(customer);
      }
    },
    [activeLoyaltyCustomer]
  );

  const verifyCustomer = useCallback((customerId: string, status: boolean) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, verifiedByAdmin: status } : c))
    );
  }, []);

  const updateLoyaltyConfig = useCallback((config: LoyaltyProgramConfig) => {
    setLoyaltyConfig(config);
  }, []);

  // Financial Calculations
  const taxRate = currentStore.taxRate;
  const {
    subtotal,
    discountTotal,
    cartSpecialSavingsTotal,
    taxableSubtotal,
    taxAmount,
    loyaltyDiscountAmount,
    grandTotal,
    pointsToEarn,
  } = useMemo(() => {
    let sub = 0;
    let disc = 0;
    let specialSavings = 0;
    let taxable = 0;
    cart.forEach((item) => {
      const isSpecial = Boolean(item.useSpecialPrice && item.product.specialPrice !== undefined);
      const unitPrice = isSpecial
        ? item.product.specialPrice!
        : item.customPrice !== undefined
        ? item.customPrice
        : item.product.price;
      const lineOriginal = unitPrice * item.quantity;
      const lineDisc = (lineOriginal * (item.discountPercent || 0)) / 100;
      const lineNet = lineOriginal - lineDisc;
      sub += lineOriginal;
      disc += lineDisc;
      if (isSpecial && item.product.specialPrice) {
        specialSavings += Math.max(0, item.product.price - item.product.specialPrice) * item.quantity;
      }
      if (!item.product.taxExempt) {
        taxable += lineNet;
      }
    });
    const loyaltyDisc = redeemedPoints > 0 ? redeemedPoints * loyaltyConfig.redemptionRate : 0;
    const finalTaxable = Math.max(0, taxable - loyaltyDisc);
    const tax = Number(((finalTaxable * taxRate) / 100).toFixed(2));
    const total = Math.max(0, Number((sub - disc - loyaltyDisc + tax).toFixed(2)));
    let multiplier = 1.0;
    if (activeLoyaltyCustomer && loyaltyConfig.enabled) {
      const tier = loyaltyConfig.tiers.find((t) => t.id === activeLoyaltyCustomer.tierId);
      if (tier) multiplier = tier.multiplier;
    }
    const earned = Math.round((sub - disc - loyaltyDisc) * loyaltyConfig.pointsPerDollar * multiplier);
    return {
      subtotal: Number(sub.toFixed(2)),
      discountTotal: Number(disc.toFixed(2)),
      cartSpecialSavingsTotal: Number(specialSavings.toFixed(2)),
      taxableSubtotal: Number(taxable.toFixed(2)),
      taxAmount: tax,
      loyaltyDiscountAmount: Number(loyaltyDisc.toFixed(2)),
      grandTotal: total,
      pointsToEarn: Math.max(0, earned),
    };
  }, [cart, taxRate, redeemedPoints, loyaltyConfig, activeLoyaltyCustomer]);

  // Catalog Valuation & Pricing Metrics
  const catalogValuation = useMemo(() => {
    let totalBuyCost = 0;
    let totalRetailValue = 0;
    let specialDealsCount = 0;

    products.forEach((p) => {
      const storeStock = p.stockByStore[currentStore.id] ?? 0;
      totalBuyCost += (p.costPrice || 0) * storeStock;
      totalRetailValue += (p.price || 0) * storeStock;
      if (p.specialPrice !== undefined && p.isSpecialActive) {
        specialDealsCount++;
      }
    });

    const potentialProfit = Math.max(0, totalRetailValue - totalBuyCost);
    const averageMarginPct =
      totalRetailValue > 0
        ? Number((((totalRetailValue - totalBuyCost) / totalRetailValue) * 100).toFixed(1))
        : 0;

    return {
      totalBuyCost: Number(totalBuyCost.toFixed(2)),
      totalRetailValue: Number(totalRetailValue.toFixed(2)),
      potentialProfit: Number(potentialProfit.toFixed(2)),
      averageMarginPct,
      specialDealsCount,
    };
  }, [products, currentStore.id]);

  // Offline Sync Management
  const setIsOfflineMode = useCallback((offline: boolean) => {
    setIsOfflineModeState(offline);
  }, []);

  const syncPendingTransactions = useCallback(async (): Promise<{ success: boolean; count: number }> => {
    if (offlineQueue.length === 0) {
      return { success: true, count: 0 };
    }
    const countToSync = offlineQueue.length;
    const syncedOrders: Order[] = offlineQueue.map((ord) => ({
      ...ord,
      isOffline: false,
      syncedToCloud: true,
    }));
    setOrders((prev) => {
      const existingIds = new Set(prev.map((o) => o.id));
      const fresh = syncedOrders.filter((o) => !existingIds.has(o.id));
      return [...fresh, ...prev];
    });
    setOfflineQueue([]);
    const nowIso = new Date().toISOString();
    setLastSyncTime(nowIso);
    const newLog: SyncLog = {
      id: `sync_${Date.now()}`,
      timestamp: nowIso,
      type: 'order_sync',
      status: 'success',
      itemsCount: countToSync,
      details: `Reconciled ${countToSync} offline buffered transaction(s) with central cloud ledger.`,
    };
    setSyncLogs((prev) => [newLog, ...prev.slice(0, 19)]);
    playSuccessChime();
    return { success: true, count: countToSync };
  }, [offlineQueue]);

  const recordInvoiceDelivery = useCallback((orderId: string, method: InvoiceDeliveryMethod) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const currentMethods = o.invoiceDeliveredVia || [];
        if (!currentMethods.includes(method)) {
          return { ...o, invoiceDeliveredVia: [...currentMethods, method] };
        }
        return o;
      })
    );
  }, []);

  // Checkout Processing
  const processCheckout = useCallback(
    async (payments: PaymentDetail[], codInfo?: CodDetails): Promise<Order> => {
      const seq = Math.floor(1000 + Math.random() * 9000);
      const receiptNum = `REC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${seq}`;
      const invoiceNum = `INV-${new Date().getFullYear()}-${seq}`;
      const nowIso = new Date().toISOString();
      let orderCostTotal = 0;
      let orderSpecialSavings = 0;

      const orderItems: OrderItem[] = cart.map((item) => {
        const isSpecial = Boolean(item.useSpecialPrice && item.product.specialPrice !== undefined);
        const unitPrice = isSpecial
          ? item.product.specialPrice!
          : item.customPrice !== undefined
          ? item.customPrice
          : item.product.price;
        const lineNet = Number(
          (unitPrice * item.quantity * (1 - (item.discountPercent || 0) / 100)).toFixed(2)
        );

        orderCostTotal += (item.product.costPrice || 0) * item.quantity;
        if (isSpecial && item.product.specialPrice) {
          orderSpecialSavings += Math.max(0, item.product.price - item.product.specialPrice) * item.quantity;
        }

        return {
          productId: item.product.id,
          productName: item.product.name,
          sku: item.product.sku,
          barcode: item.product.barcode,
          price: unitPrice,
          regularPrice: item.product.price,
          costPrice: item.product.costPrice,
          isSpecialPrice: isSpecial,
          pricingOption: item.pricingOption || (isSpecial ? 'special' : 'sale'),
          quantity: item.quantity,
          discountPercent: item.discountPercent || 0,
          subtotal: lineNet,
          imageUrl: item.product.imageUrl,
        };
      });
      const isCOD = payments.some((p) => p.method === 'cod') || !!codInfo;
      const isCurrentlyOffline = isOfflineMode || !isOnline;
      const grossProfit = Number((grandTotal - orderCostTotal).toFixed(2));

      const newOrder: Order = {
        id: `ord_${Date.now()}`,
        receiptNumber: receiptNum,
        invoiceNumber: invoiceNum,
        storeId: currentStore.id,
        storeName: currentStore.name,
        cashierId: currentUser?.id || 'cashier_guest',
        cashierName: currentUser?.name || 'Kasun Wickramasinghe',
        customerId: activeLoyaltyCustomer?.id,
        customerName: codInfo?.recipientName || activeLoyaltyCustomer?.name || 'Walk-in Customer',
        customerEmail: activeLoyaltyCustomer?.email,
        customerPhone: codInfo?.recipientPhone || activeLoyaltyCustomer?.phone,
        customerAddress: codInfo
          ? `${codInfo.deliveryAddress}, ${codInfo.city} ${codInfo.postalCode}`
          : activeLoyaltyCustomer?.deliveryAddress,
        items: orderItems,
        subtotal,
        discountTotal: Number((discountTotal + loyaltyDiscountAmount).toFixed(2)),
        specialSavingsTotal: Number(orderSpecialSavings.toFixed(2)),
        grossProfit,
        taxRate,
        taxAmount,
        total: grandTotal,
        currencyCode: currency.code,
        currencyRate: currency.rateAgainstUSD,
        payments,
        createdAt: nowIso,
        isOffline: isCurrentlyOffline,
        syncedToCloud: !isCurrentlyOffline,
        loyaltyPointsEarned: pointsToEarn,
        loyaltyPointsRedeemed: redeemedPoints,
        codDetails: codInfo,
        paymentStatus: isCOD ? 'pending_cod' : 'paid',
        adminApproved: true,
        invoiceDeliveredVia: ['print_thermal'],
      };

      setProducts((prev) =>
        prev.map((p) => {
          const cartItem = cart.find((ci) => ci.product.id === p.id);
          if (!cartItem) return p;
          const currentQty = p.stockByStore[currentStore.id] ?? 0;
          const newQty = Math.max(0, currentQty - cartItem.quantity);
          triggerStockAlertCheck(p, currentStore.id, newQty);
          return {
            ...p,
            updatedAt: nowIso,
            stockByStore: {
              ...p.stockByStore,
              [currentStore.id]: newQty,
            },
          };
        })
      );

      if (activeLoyaltyCustomer) {
        setCustomers((prev) =>
          prev.map((c) => {
            if (c.id !== activeLoyaltyCustomer.id) return c;
            const newBalance = Math.max(0, c.loyaltyPoints - redeemedPoints + pointsToEarn);
            const newLifetime = Number((c.lifetimeSpend + grandTotal).toFixed(2));
            return {
              ...c,
              loyaltyPoints: newBalance,
              lifetimeSpend: newLifetime,
            };
          })
        );
      }

      if (isCurrentlyOffline) {
        setOfflineQueue((prev) => [newOrder, ...prev]);
        setSyncLogs((prev) => [
          {
            id: `log_off_${Date.now()}`,
            timestamp: nowIso,
            type: 'manual_sync',
            status: 'pending',
            itemsCount: orderItems.length,
            details: `Order #${newOrder.receiptNumber} recorded offline into local storage buffer.`,
          },
          ...prev.slice(0, 19),
        ]);
      } else {
        setOrders((prev) => [newOrder, ...prev]);
      }

      playSuccessChime();
      setActiveReceiptOrder(newOrder);
      setActiveInvoiceOrder(newOrder);
      clearCart();
      return newOrder;
    },
    [
      cart,
      currentStore,
      currentUser,
      activeLoyaltyCustomer,
      subtotal,
      discountTotal,
      loyaltyDiscountAmount,
      taxRate,
      taxAmount,
      grandTotal,
      isOfflineMode,
      isOnline,
      currency,
      pointsToEarn,
      redeemedPoints,
      triggerStockAlertCheck,
      clearCart,
    ]
  );

  // Public COD order
  const processPublicCODOrder = useCallback(
    async (items: CartItem[], codInfo: CodDetails): Promise<Order> => {
      const seq = Math.floor(1000 + Math.random() * 9000);
      const receiptNum = `REC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${seq}`;
      const invoiceNum = `INV-${new Date().getFullYear()}-${seq}`;
      const nowIso = new Date().toISOString();
      let sub = 0;
      let taxable = 0;
      const orderItems: OrderItem[] = items.map((item) => {
        const isSpecial = Boolean(
          (item.useSpecialPrice || item.product.isSpecialActive) &&
            item.product.specialPrice !== undefined
        );
        const unitPrice = isSpecial ? item.product.specialPrice! : item.product.price;
        const itemGross = unitPrice * item.quantity;
        sub += itemGross;
        if (!item.product.taxExempt) taxable += itemGross;
        return {
          productId: item.product.id,
          productName: item.product.name,
          sku: item.product.sku,
          barcode: item.product.barcode,
          price: unitPrice,
          regularPrice: item.product.price,
          costPrice: item.product.costPrice,
          isSpecialPrice: isSpecial,
          pricingOption: isSpecial ? 'special' : 'sale',
          quantity: item.quantity,
          discountPercent: 0,
          subtotal: itemGross,
          imageUrl: item.product.imageUrl,
        };
      });
      const tax = Number(((taxable * currentStore.taxRate) / 100).toFixed(2));
      const total = Number((sub + tax).toFixed(2));
      const orderCostTotal = items.reduce(
        (acc, i) => acc + (i.product.costPrice || 0) * i.quantity,
        0
      );
      const orderSpecialSavings = items.reduce((acc, i) => {
        const isSpecial = Boolean(
          (i.useSpecialPrice || i.product.isSpecialActive) &&
            i.product.specialPrice !== undefined
        );
        return isSpecial && i.product.specialPrice
          ? acc + Math.max(0, i.product.price - i.product.specialPrice) * i.quantity
          : acc;
      }, 0);
      const grossProfit = Number((total - orderCostTotal).toFixed(2));

      const newOrder: Order = {
        id: `ord_cod_${Date.now()}`,
        receiptNumber: receiptNum,
        invoiceNumber: invoiceNum,
        storeId: currentStore.id,
        storeName: currentStore.name,
        cashierId: 'storefront_dispatch',
        cashierName: 'Online Storefront Dispatch',
        customerName: codInfo.recipientName,
        customerPhone: codInfo.recipientPhone,
        customerAddress: `${codInfo.deliveryAddress}, ${codInfo.city} ${codInfo.postalCode}`,
        items: orderItems,
        subtotal: sub,
        discountTotal: 0,
        specialSavingsTotal: Number(orderSpecialSavings.toFixed(2)),
        grossProfit,
        taxRate: currentStore.taxRate,
        taxAmount: tax,
        total,
        currencyCode: currency.code,
        currencyRate: currency.rateAgainstUSD,
        payments: [
          {
            method: 'cod',
            amount: total,
            codDetails: codInfo,
          },
        ],
        createdAt: nowIso,
        isOffline: false,
        syncedToCloud: true,
        loyaltyPointsEarned: Math.round(total * loyaltyConfig.pointsPerDollar),
        loyaltyPointsRedeemed: 0,
        codDetails: codInfo,
        paymentStatus: 'pending_cod',
        adminApproved: false,
        invoiceDeliveredVia: ['print_thermal', 'sms'],
      };

      setProducts((prev) =>
        prev.map((p) => {
          const cartItem = items.find((ci) => ci.product.id === p.id);
          if (!cartItem) return p;
          const currentQty = p.stockByStore[currentStore.id] ?? 0;
          const newQty = Math.max(0, currentQty - cartItem.quantity);
          triggerStockAlertCheck(p, currentStore.id, newQty);
          return {
            ...p,
            updatedAt: nowIso,
            stockByStore: {
              ...p.stockByStore,
              [currentStore.id]: newQty,
            },
          };
        })
      );

      setOrders((prev) => [newOrder, ...prev]);

      submitBuyRequest({
        orderId: newOrder.id,
        customerName: codInfo.recipientName,
        customerEmail: `${codInfo.recipientName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        customerPhone: codInfo.recipientPhone,
        total,
        currencyCode: currency.code,
        itemsCount: items.reduce((s, i) => s + i.quantity, 0),
        itemsSummary: items.map((i) => `${i.product.name} (${i.quantity})`).join(', '),
        requestType: 'cod_order',
        notes: `Delivery address: ${codInfo.deliveryAddress}, ${codInfo.city} ${codInfo.postalCode}`,
      });

      playSuccessChime();
      setActiveReceiptOrder(newOrder);
      setActiveInvoiceOrder(newOrder);
      return newOrder;
    },
    [currentStore, currency, loyaltyConfig.pointsPerDollar, triggerStockAlertCheck, submitBuyRequest]
  );

  // Helper to create dynamic sample receipt for instant preview
  const createTestReceiptOrder = useCallback((): Order => {
    const seq = Math.floor(1000 + Math.random() * 9000);
    let specialSavings = 0;
    const sampleItems: OrderItem[] = products.slice(0, 3).map((p, idx) => {
      const qty = idx === 0 ? 2 : 1;
      const isSpecial = idx === 0 && (p.specialPrice !== undefined || true);
      const regularPrice = p.price;
      const appliedPrice = isSpecial
        ? p.specialPrice || Number((p.price * 0.85).toFixed(2))
        : p.price;
      const sub = Number((appliedPrice * qty).toFixed(2));
      const lineDisc = idx === 1 ? 10 : 0;
      const finalSub = lineDisc > 0 ? Number((sub * 0.9).toFixed(2)) : sub;

      if (isSpecial) {
        specialSavings += (regularPrice - appliedPrice) * qty;
      }

      return {
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        barcode: p.barcode,
        price: appliedPrice,
        regularPrice,
        costPrice: p.costPrice,
        isSpecialPrice: isSpecial,
        pricingOption: isSpecial ? 'special' : 'sale',
        quantity: qty,
        discountPercent: lineDisc,
        subtotal: finalSub,
        imageUrl: p.imageUrl,
      };
    });
    const sub = sampleItems.reduce((acc, i) => acc + i.subtotal, 0);
    const tax = Number(((sub * currentStore.taxRate) / 100).toFixed(2));
    const total = Number((sub + tax).toFixed(2));
    const cost = sampleItems.reduce((acc, i) => acc + (i.costPrice || 0) * i.quantity, 0);

    const testOrder: Order = {
      id: `ord_test_${Date.now()}`,
      receiptNumber: `REC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${seq}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-${seq}`,
      storeId: currentStore.id,
      storeName: currentStore.name,
      cashierId: 'cashier_kasun',
      cashierName: 'Kasun Wickramasinghe',
      customerName: 'Nalinda Jayawardena',
      customerEmail: 'nalinda.j@example.com',
      customerPhone: '+94 77 123 4567',
      customerAddress: '14 Dharmapala Mawatha, Colombo',
      items: sampleItems,
      subtotal: sub,
      discountTotal: Number((1.2 + specialSavings).toFixed(2)),
      specialSavingsTotal: Number(specialSavings.toFixed(2)),
      grossProfit: Number((total - cost).toFixed(2)),
      taxRate: currentStore.taxRate,
      taxAmount: tax,
      total,
      currencyCode: currency.code,
      currencyRate: currency.rateAgainstUSD,
      payments: [
        {
          method: 'cash',
          amount: total,
          tenderedCash: Math.ceil(total / 10) * 10,
          changeDue: Number((Math.ceil(total / 10) * 10 - total).toFixed(2)),
        },
      ],
      createdAt: new Date().toISOString(),
      isOffline: false,
      syncedToCloud: true,
      loyaltyPointsEarned: 150,
      loyaltyPointsRedeemed: 0,
      paymentStatus: 'paid',
    };
    return testOrder;
  }, [products, currentStore, currency]);

  // Shipping Options Handlers
  const updateShippingOption = useCallback((option: ShippingOption) => {
    setShippingOptions((prev) => prev.map((o) => (o.id === option.id ? option : o)));
  }, []);

  const addShippingOption = useCallback((optionData: Omit<ShippingOption, 'id'>): ShippingOption => {
    const newOpt: ShippingOption = {
      ...optionData,
      id: `ship_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    };
    setShippingOptions((prev) => [...prev, newOpt]);
    return newOpt;
  }, []);

  const deleteShippingOption = useCallback((id: string) => {
    setShippingOptions((prev) => prev.filter((o) => o.id !== id));
  }, []);

  // Product Send / Dispatch Fulfillment
  const fulfillOrder = useCallback(
    (
      orderId: string,
      details: {
        carrier: string;
        trackingNumber: string;
        shippingOptionId?: string;
        shippingFee?: number;
        notes?: string;
        notifyCustomer?: boolean;
      }
    ) => {
      const targetOrder = orders.find((o) => o.id === orderId);
      if (!targetOrder) {
        return { success: false, message: 'Order not found', trackingNumber: '' };
      }

      const nowIso = new Date().toISOString();
      const trkNum =
        details.trackingNumber.trim() ||
        `TRK-LK-${Math.floor(1000000 + Math.random() * 9000000)}`;

      const newEvent: TrackingEvent = {
        id: `evt_${Date.now()}`,
        timestamp: nowIso,
        status: 'shipped',
        title: `Product Dispatched with ${details.carrier}`,
        description: `Package handed over to ${details.carrier}. Consignment tracking # ${trkNum}.${details.notes ? ` Notes: ${details.notes}` : ''}`,
        location: currentStore.name,
      };

      const matchedOption = shippingOptions.find((o) => o.id === details.shippingOptionId);

      setOrders((prev) =>
        prev.map((ord) => {
          if (ord.id !== orderId) return ord;
          const existingEvents = ord.trackingEvents || [];
          return {
            ...ord,
            fulfillmentStatus: 'shipped',
            carrier: details.carrier,
            trackingNumber: trkNum,
            shippingOptionId: details.shippingOptionId || ord.shippingOptionId,
            shippingOptionName: matchedOption?.name || ord.shippingOptionName || details.carrier,
            shippingFee: details.shippingFee !== undefined ? details.shippingFee : ord.shippingFee,
            dispatchedAt: nowIso,
            shippingNotes: details.notes || ord.shippingNotes,
            trackingEvents: [...existingEvents, newEvent],
          };
        })
      );

      playSuccessChime();
      return {
        success: true,
        message: `Product successfully sent / dispatched via ${details.carrier}! Tracking # ${trkNum}`,
        trackingNumber: trkNum,
      };
    },
    [orders, currentStore.name, shippingOptions]
  );

  // Update Tracking Status (e.g. In Transit, Out for Delivery, Delivered)
  const updateTrackingStatus = useCallback(
    (
      orderId: string,
      status: FulfillmentStatus,
      title: string,
      description: string,
      location?: string
    ) => {
      const targetOrder = orders.find((o) => o.id === orderId);
      if (!targetOrder) {
        return { success: false, message: 'Order not found' };
      }

      const nowIso = new Date().toISOString();
      const newEvent: TrackingEvent = {
        id: `evt_${Date.now()}`,
        timestamp: nowIso,
        status: status === 'delivered' ? 'delivered' : status === 'out_for_delivery' ? 'out_for_delivery' : 'in_transit',
        title,
        description,
        location: location || currentStore.name,
      };

      setOrders((prev) =>
        prev.map((ord) => {
          if (ord.id !== orderId) return ord;
          const existingEvents = ord.trackingEvents || [];
          return {
            ...ord,
            fulfillmentStatus: status,
            deliveredAt: status === 'delivered' ? nowIso : ord.deliveredAt,
            paymentStatus:
              status === 'delivered' && ord.paymentStatus === 'pending_cod'
                ? 'paid'
                : ord.paymentStatus,
            trackingEvents: [...existingEvents, newEvent],
          };
        })
      );

      playSuccessChime();
      return {
        success: true,
        message: `Order #${targetOrder.receiptNumber} tracking status updated to "${status}".`,
      };
    },
    [orders, currentStore.name]
  );

  // Order Lookup (Search by Tracking #, Receipt #, Invoice #, Phone, Email)
  const lookupOrderByQuery = useCallback(
    (query: string): Order | null => {
      const clean = query.trim().toLowerCase();
      if (!clean) return null;
      return (
        orders.find(
          (o) =>
            o.receiptNumber.toLowerCase() === clean ||
            o.invoiceNumber.toLowerCase() === clean ||
            (o.trackingNumber && o.trackingNumber.toLowerCase() === clean) ||
            o.id.toLowerCase() === clean ||
            (o.customerPhone && o.customerPhone.replace(/\s+/g, '').includes(clean.replace(/\s+/g, ''))) ||
            (o.customerEmail && o.customerEmail.toLowerCase() === clean)
        ) || null
      );
    },
    [orders]
  );

  // Product Return & Refund Processing (RMA)
  const processOrderReturn = useCallback(
    (
      orderId: string,
      returnData: {
        items: ReturnItem[];
        refundMethod: 'cash' | 'original_payment' | 'store_credit' | 'exchange';
        refundAmount: number;
        restockInventory: boolean;
        notes?: string;
      }
    ) => {
      const targetOrder = orders.find((o) => o.id === orderId);
      if (!targetOrder) {
        throw new Error('Order not found for return');
      }

      const nowIso = new Date().toISOString();
      const rmaCode = `RMA-LK-${Date.now().toString().slice(-6)}`;
      const returnRecord: OrderReturn = {
        id: `ret_${Date.now()}`,
        orderId,
        receiptNumber: targetOrder.receiptNumber,
        customerName: targetOrder.customerName || 'Customer',
        customerPhone: targetOrder.customerPhone,
        items: returnData.items,
        refundMethod: returnData.refundMethod,
        refundAmount: returnData.refundAmount,
        restocked: returnData.restockInventory,
        status: 'completed',
        createdAt: nowIso,
        notes: returnData.notes,
        rmaCode,
      };

      // Restock inventory if requested
      if (returnData.restockInventory) {
        returnData.items.forEach((item) => {
          adjustStock(
            item.productId,
            targetOrder.storeId || currentStore.id,
            item.quantity,
            `Customer Return #${rmaCode}`
          );
        });
      }

      const returnEvent: TrackingEvent = {
        id: `evt_ret_${Date.now()}`,
        timestamp: nowIso,
        status: 'returned',
        title: 'Customer Return Processed (RMA)',
        description: `Refund of ${formatMoney(returnData.refundAmount)} issued via ${returnData.refundMethod}. Items return verified under #${rmaCode}.${returnData.notes ? ` Note: ${returnData.notes}` : ''}`,
        location: currentStore.name,
      };

      setOrders((prev) =>
        prev.map((ord) => {
          if (ord.id !== orderId) return ord;
          const existingReturns = ord.returns || [];
          const existingEvents = ord.trackingEvents || [];
          return {
            ...ord,
            fulfillmentStatus: 'returned',
            returns: [...existingReturns, returnRecord],
            trackingEvents: [...existingEvents, returnEvent],
          };
        })
      );

      setReturns((prev) => [returnRecord, ...prev]);
      setActiveReturnRecord(returnRecord);
      playSuccessChime();

      return {
        success: true,
        message: `Return #${rmaCode} successfully authorized and refund processed!`,
        returnRecord,
      };
    },
    [orders, adjustStock, currentStore.id, currentStore.name, formatMoney]
  );

  // Vercel Build Diagnostic
  const getVercelBuildDiagnostic = useCallback((): VercelBuildDiagnostic => {
    return {
      framework: 'Vite',
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
      nodeVersion: 'Node.js 18.x / 20.x / 22.x',
      packageManager: 'npm / bun',
      cleanUrls: true,
      hasVercelJson: true,
      dependenciesStatus: 'ok',
      routesRewriteConfigured: true,
      issues: [],
      recommendations: [
        'Ensure Vercel Project Settings > Framework Preset is set to "Vite".',
        'Ensure Output Directory is "dist" (Vite default).',
        'Vercel routing rewrites in vercel.json redirect all SPA paths to /index.html.',
      ],
    };
  }, []);

  const exportSystemBackup = useCallback(() => {
    const backupSnapshot = {
      aura_backup_version: '3.0.0',
      exportedAt: new Date().toISOString(),
      currency,
      currentStore,
      stores,
      products,
      categories,
      customers,
      loyaltyConfig,
      orders,
      branding,
      buyRequests,
      offlineQueue,
      adminOptions,
      meta: {
        totalProducts: products.length,
        totalOrders: orders.length,
        totalCustomers: customers.length,
        totalStores: stores.length,
        defaultCurrency: currency.code,
      },
    };
    const jsonStr = JSON.stringify(backupSnapshot, null, 2);
    const filename = `aura-retail-backup-${currentStore.code}-${new Date().toISOString().slice(0, 10)}.json`;
    try {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {}
    return { data: jsonStr, filename };
  }, [currency, currentStore, stores, products, categories, customers, loyaltyConfig, orders, branding, buyRequests, offlineQueue, adminOptions]);

  const restoreSystemBackup = useCallback(
    (jsonContent: string): { success: boolean; message: string; details?: any } => {
      try {
        const parsed = JSON.parse(jsonContent);
        if (!parsed || typeof parsed !== 'object') {
          return { success: false, message: 'Invalid backup file: Not a valid JSON document.' };
        }
        const detailsInfo: any = {};
        if (Array.isArray(parsed.products) && parsed.products.length > 0) {
          setProducts(parsed.products);
          detailsInfo.products = parsed.products.length;
        }
        if (Array.isArray(parsed.stores) && parsed.stores.length > 0) {
          setStores(parsed.stores);
          detailsInfo.stores = parsed.stores.length;
        }
        if (Array.isArray(parsed.categories) && parsed.categories.length > 0) {
          setCategories(parsed.categories);
        }
        if (Array.isArray(parsed.customers) && parsed.customers.length > 0) {
          setCustomers(parsed.customers);
        }
        if (parsed.loyaltyConfig) {
          setLoyaltyConfig(parsed.loyaltyConfig);
        }
        if (Array.isArray(parsed.orders) && parsed.orders.length > 0) {
          setOrders(parsed.orders);
          detailsInfo.orders = parsed.orders.length;
        }
        if (parsed.branding) {
          setBranding(parsed.branding);
        }
        if (parsed.adminOptions) {
          setAdminOptionsState(parsed.adminOptions);
        }
        if (parsed.currency) {
          setCurrencyState(parsed.currency);
        }
        playSuccessChime();
        return {
          success: true,
          message: `Backup restored successfully! Verified ${detailsInfo.products || 0} items and ${detailsInfo.stores || 0} store branches.`,
          details: detailsInfo,
        };
      } catch (err: any) {
        return {
          success: false,
          message: `Restore failed: ${err?.message || 'Syntax error'}`,
        };
      }
    },
    []
  );

  const resetToFactoryDefaults = useCallback(() => {
    setProducts(INITIAL_PRODUCTS);
    setStores(INITIAL_STORES);
    setCategories(INITIAL_CATEGORIES);
    setCustomers(INITIAL_CUSTOMERS);
    setLoyaltyConfig(INITIAL_LOYALTY_CONFIG);
    setOrders(INITIAL_ORDERS);
    setBranding(INITIAL_BRANDING);
    setBuyRequests(INITIAL_BUY_REQUESTS);
    setAdminOptionsState(DEFAULT_ADMIN_OPTIONS);
    setCurrencyState(DEFAULT_CURRENCY);
    setOfflineQueue([]);
    setIsOfflineModeState(false);
    setAcknowledgedAlertIds(new Set());
    setDismissedAlertIds(new Set());
    playSuccessChime();
  }, []);

  return (
    <POSContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        loginAsDemo,
        loginWithMasterAdmin,
        changePassword,
        logout,
        masterPassword,
        registerPublicBuyer,
        loginCustomer,
        confirmCustomerRegistration,
        rejectCustomerRegistration,
        pendingRegistrationCount,
        buyRequests,
        submitBuyRequest,
        approveBuyRequest,
        rejectBuyRequest,
        downloadSoftwareSystemPackage,
        branding,
        updateBranding,
        resetLogo,
        adminOptions,
        updateAdminOptions,
        categories,
        addCategory,
        editCategory,
        deleteCategory,
        currency,
        setCurrency,
        formatMoney,
        allCurrencies: SUPPORTED_CURRENCIES,
        stores,
        currentStore,
        setCurrentStoreId,
        updateStore,
        transferInventory,
        products,
        addProduct,
        updateProduct,
        adjustStock,
        updateProductThreshold,
        batchUpdateThresholds,
        bulkRestockLowStock,
        stockAlerts,
        unreadAlertCount,
        acknowledgeAlert,
        acknowledgeAllAlerts,
        dismissAlert,
        soundAlertsEnabled,
        setSoundAlertsEnabled,
        recentStockNotification,
        clearRecentNotification,
        scanBarcode,
        isOnline,
        isOfflineMode,
        setIsOfflineMode,
        offlineQueueCount: offlineQueue.length,
        syncLogs,
        syncPendingTransactions,
        lastSyncTime,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        toggleCartItemSpecialPrice,
        setCartItemPricingOption,
        setCartItemDiscount,
        clearCart,
        cartSpecialSavingsTotal,
        catalogValuation,
        activeLoyaltyCustomer,
        setActiveLoyaltyCustomer,
        redeemedPoints,
        setRedeemedPoints,
        loyaltyConfig,
        updateLoyaltyConfig,
        customers,
        addCustomer,
        updateCustomer,
        verifyCustomer,
        isAddCustomerModalOpen,
        setIsAddCustomerModalOpen,
        subtotal,
        discountTotal,
        taxableSubtotal,
        taxRate,
        taxAmount,
        loyaltyDiscountAmount,
        grandTotal,
        pointsToEarn,
        orders: isOfflineMode ? [...offlineQueue, ...orders] : orders,
        processCheckout,
        processPublicCODOrder,
        activeReceiptOrder,
        setActiveReceiptOrder,
        activeInvoiceOrder,
        setActiveInvoiceOrder,
        recordInvoiceDelivery,
        createTestReceiptOrder,
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
        getVercelBuildDiagnostic,
        exportSystemBackup,
        restoreSystemBackup,
        resetToFactoryDefaults,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = (): POSContextType => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};
