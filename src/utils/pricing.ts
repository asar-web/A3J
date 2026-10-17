/**
 * Utility functions for pricing options:
 * - Buy Price (Cost from supplier / Wholesale cost)
 * - Sale Price (Standard retail selling price)
 * - Special Price (Promotional / Offer / VIP / Clearance price)
 */

export interface MarginMetrics {
  grossProfit: number;
  grossMarginPct: number;
  markupPct: number;
  specialSavingsAmount?: number;
  specialSavingsPct?: number;
}

/**
 * Calculates gross profit and margins between selling price and buy price (cost).
 */
export function calculatePricingMetrics(
  salePrice: number,
  costPrice: number,
  specialPrice?: number
): MarginMetrics {
  const safeCost = Math.max(0, costPrice || 0);
  const safeSale = Math.max(0, salePrice || 0);

  const grossProfit = Number((safeSale - safeCost).toFixed(2));
  const grossMarginPct =
    safeSale > 0 ? Number((((safeSale - safeCost) / safeSale) * 100).toFixed(1)) : 0;
  const markupPct =
    safeCost > 0 ? Number((((safeSale - safeCost) / safeCost) * 100).toFixed(1)) : 0;

  let specialSavingsAmount: number | undefined;
  let specialSavingsPct: number | undefined;

  if (specialPrice !== undefined && specialPrice > 0 && specialPrice < safeSale) {
    specialSavingsAmount = Number((safeSale - specialPrice).toFixed(2));
    specialSavingsPct = Number((((safeSale - specialPrice) / safeSale) * 100).toFixed(1));
  }

  return {
    grossProfit,
    grossMarginPct,
    markupPct,
    specialSavingsAmount,
    specialSavingsPct,
  };
}

/**
 * Calculates Sale Price given a Buy Price (cost) and a desired Markup percentage.
 * Example: buyPrice = 100, markup = 50% -> salePrice = 150
 */
export function calculateSalePriceFromMarkup(costPrice: number, markupPercent: number): number {
  const safeCost = Math.max(0, costPrice || 0);
  const factor = 1 + markupPercent / 100;
  return Number((safeCost * factor).toFixed(2));
}

/**
 * Calculates Special Price given a Sale Price and a desired discount percentage.
 * Example: salePrice = 100, discount = 20% -> specialPrice = 80
 */
export function calculateSpecialPriceFromDiscount(
  salePrice: number,
  discountPercent: number
): number {
  const safeSale = Math.max(0, salePrice || 0);
  const factor = Math.max(0, 1 - discountPercent / 100);
  return Number((safeSale * factor).toFixed(2));
}

/**
 * Checks whether a selling price is dangerously close to or below buy price (cost).
 */
export function checkPricingHealth(
  sellingPrice: number,
  costPrice: number,
  minHealthyMargin = 10
): {
  isBelowCost: boolean;
  isLowMargin: boolean;
  marginPct: number;
} {
  const safeCost = Math.max(0, costPrice || 0);
  const safeSelling = Math.max(0, sellingPrice || 0);

  if (safeSelling < safeCost) {
    return {
      isBelowCost: true,
      isLowMargin: true,
      marginPct: safeSelling > 0 ? Number((((safeSelling - safeCost) / safeSelling) * 100).toFixed(1)) : -100,
    };
  }

  const marginPct =
    safeSelling > 0 ? Number((((safeSelling - safeCost) / safeSelling) * 100).toFixed(1)) : 0;

  return {
    isBelowCost: false,
    isLowMargin: marginPct < minHealthyMargin,
    marginPct,
  };
}
