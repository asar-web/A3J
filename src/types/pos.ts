export type UserRole = 'admin' | 'cashier' | 'customer';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  storeId?: string;
  avatarUrl?: string;
  phone?: string;
  loyaltyPoints?: number;
  isVerified?: boolean;
  adminVerified?: boolean;
}

export interface SiteBranding {
  storeName: string;
  logoUrl?: string;
  heroTitle: string;
  heroSubtitle: string;
  heroBadge: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  supportEmail?: string;
  bannerImageUrl?: string;
  storeAddress?: string;
}

export interface AdminStoreOptions {
  // Thermal Printing & 80mm Roll
  receiptAnimationEnabled: boolean;
  thermalPaperSlideSpeed: 'fast' | 'normal' | 'slow';
  receiptFeedSound: boolean;
  defaultPrintFormat: 'mobile' | 'pc';
  receiptFooterNote: string;
  receiptTaxNumber: string;
  showBarcodeOnReceipt: boolean;
  showQrOnReceipt: boolean;
  showStoreAddressOnReceipt: boolean;
  showPhoneOnReceipt: boolean;
  showLogoOnReceipt: boolean;
  showProductImageOnReceipt?: boolean;
  // Buyer Access & Public Security
  requireAdminApprovalForBuyers: boolean;
  hideAdminInfoFromPublic: boolean;
  allowGuestCheckout: boolean;
  defaultBuyerType: 'product_buyer' | 'pos_buyer' | 'both';
  // Cash on Delivery Controls
  enableCOD: boolean;
  maxCodOrderAmount: number;
  codHandlingFee: number;
  requireCodPhoneVerification: boolean;
  // Register & Inventory Alerts
  lowStockThresholdDefault: number;
  autoRestockBatchAmount: number;
  scannerAutoAdd: boolean;
}

export interface StoreLocation {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  taxRate: number; // percentage e.g. 8.0
  phone: string;
  manager: string;
  activeRegisters: number;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  price: number; // Sale Price (Retail Selling Price)
  costPrice: number; // Buy Price (Wholesale Cost Price)
  specialPrice?: number; // Special Price (Promotional / Member Offer Price)
  isSpecialActive?: boolean;
  taxExempt?: boolean;
  imageUrl: string; // Product photo URL
  description: string;
  stockByStore: Record<string, number>; // storeId -> quantity
  lowStockThreshold: number; // alert trigger threshold (e.g. 10 units)
  reorderQuantity?: number;
  updatedAt?: string;
}

export type AlertUrgency = 'critical' | 'warning' | 'info';

export interface StockAlert {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  storeId: string;
  storeName: string;
  currentStock: number;
  threshold: number;
  urgency: AlertUrgency;
  timestamp: string;
  acknowledged: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  useSpecialPrice?: boolean;
  pricingOption?: 'sale' | 'special' | 'custom';
  discountPercent?: number; // 0-100
  customPrice?: number;
  notes?: string;
}

export type PaymentMethod = 'cash' | 'card' | 'qr_wallet' | 'split' | 'cod';

export interface CodDetails {
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  city: string;
  postalCode: string;
  deliveryInstructions?: string;
  collectionStatus: 'pending_collection' | 'collected' | 'cancelled';
}

export interface PaymentDetail {
  method: PaymentMethod;
  amount: number;
  tenderedCash?: number;
  changeDue?: number;
  cardBrand?: string;
  lastFour?: string;
  referenceId?: string;
  codDetails?: CodDetails;
}

export type InvoiceDeliveryMethod = 'print_a4' | 'print_thermal' | 'email' | 'sms' | 'whatsapp';

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  barcode: string;
  price: number;
  regularPrice?: number;
  costPrice?: number; // Buy Price for margin calculations
  isSpecialPrice?: boolean;
  pricingOption?: 'sale' | 'special' | 'custom';
  quantity: number;
  discountPercent: number;
  subtotal: number;
  imageUrl?: string;
}

export type FulfillmentStatus =
  | 'unfulfilled'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'returned'
  | 'cancelled';

export interface ShippingOption {
  id: string;
  name: string;
  carrier: string;
  estimatedDays: string;
  price: number;
  freeAboveThreshold?: number;
  isActive: boolean;
  description: string;
}

export interface TrackingEvent {
  id: string;
  timestamp: string;
  status:
    | 'order_placed'
    | 'processing'
    | 'packed'
    | 'shipped'
    | 'in_transit'
    | 'out_for_delivery'
    | 'delivered'
    | 'returned';
  title: string;
  description: string;
  location?: string;
}

export type ReturnReason =
  | 'defective'
  | 'wrong_item'
  | 'damaged_in_transit'
  | 'customer_change_mind'
  | 'expired_quality'
  | 'other';

export interface ReturnItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  reason: ReturnReason;
}

export interface OrderReturn {
  id: string;
  orderId: string;
  receiptNumber: string;
  customerName: string;
  customerPhone?: string;
  items: ReturnItem[];
  refundMethod: 'cash' | 'original_payment' | 'store_credit' | 'exchange';
  refundAmount: number;
  restocked: boolean;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  createdAt: string;
  notes?: string;
  rmaCode: string;
}

export interface Order {
  id: string;
  receiptNumber: string;
  invoiceNumber: string;
  storeId: string;
  storeName: string;
  cashierId: string;
  cashierName: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  items: OrderItem[];
  subtotal: number;
  discountTotal: number;
  specialSavingsTotal?: number;
  grossProfit?: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currencyCode: string;
  currencyRate: number;
  payments: PaymentDetail[];
  createdAt: string;
  isOffline: boolean;
  syncedToCloud: boolean;
  loyaltyPointsEarned: number;
  loyaltyPointsRedeemed: number;
  codDetails?: CodDetails;
  invoiceDeliveredVia?: InvoiceDeliveryMethod[];
  paymentStatus: 'paid' | 'pending_cod' | 'net30' | 'pending_admin_approval';
  adminApproved?: boolean;

  // Shipping, Dispatch, Product Send & Tracking
  fulfillmentStatus?: FulfillmentStatus;
  shippingOptionId?: string;
  shippingOptionName?: string;
  carrier?: string;
  trackingNumber?: string;
  shippingFee?: number;
  dispatchedAt?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  shippingNotes?: string;
  trackingEvents?: TrackingEvent[];
  returns?: OrderReturn[];
}

export interface LoyaltyTier {
  id: string;
  name: string;
  minPoints: number;
  multiplier: number;
  perkDescription: string;
}

export interface LoyaltyProgramConfig {
  enabled: boolean;
  pointsPerDollar: number;
  redemptionRate: number;
  tiers: LoyaltyTier[];
}

export type BuyerType = 'product_buyer' | 'pos_buyer' | 'both';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  password?: string;
  buyerType?: BuyerType;
  businessName?: string;
  deliveryAddress?: string;
  city?: string;
  postalCode?: string;
  loyaltyPoints: number;
  lifetimeSpend: number;
  tierId: string;
  registeredAt: string;
  notes?: string;
  verifiedByAdmin?: boolean;
  adminConfirmed?: boolean;
  registrationStatus?: 'pending_confirmation' | 'confirmed' | 'rejected';
  confirmedAt?: string;
}

export interface BuyRequest {
  id: string;
  orderId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  total: number;
  currencyCode: string;
  itemsCount: number;
  itemsSummary: string;
  requestType: 'retail_pos' | 'cod_order' | 'registration_request' | 'software_license';
  businessName?: string;
  licenseKey?: string;
  status: 'pending' | 'accepted' | 'rejected';
  requestedAt: string;
  acceptedAt?: string;
  softwareDownloaded?: boolean;
  notes?: string;
}

export interface SyncLog {
  id: string;
  timestamp: string;
  type: 'order_sync' | 'inventory_push' | 'cloud_pull' | 'manual_sync';
  status: 'success' | 'failed' | 'pending';
  itemsCount: number;
  details: string;
}

export interface VercelBuildDiagnostic {
  framework: string;
  buildCommand: string;
  outputDirectory: string;
  nodeVersion: string;
  packageManager: string;
  cleanUrls: boolean;
  hasVercelJson: boolean;
  dependenciesStatus: 'ok' | 'warning' | 'error';
  routesRewriteConfigured: boolean;
  issues: string[];
  recommendations: string[];
}
