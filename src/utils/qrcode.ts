import QRCode from 'qrcode';

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

/**
 * Generates an SVG string representation of a QR Code for optimal thermal printer rendering.
 * High contrast (pure black on pure white) with zero rasterization artifacts.
 */
export async function generateQRCodeSVG(
  text: string,
  options: QRCodeOptions = { width: 140, margin: 1 }
): Promise<string> {
  try {
    const svgString = await QRCode.toString(text, {
      type: 'svg',
      width: options.width || 140,
      margin: options.margin !== undefined ? options.margin : 1,
      color: {
        dark: options.color?.dark || '#000000',
        light: options.color?.light || '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    return svgString;
  } catch (err) {
    console.error('Failed to generate QR code SVG:', err);
    return '';
  }
}

/**
 * Generates a PNG Data URL for standard image rendering.
 */
export async function generateQRCodeDataURL(
  text: string,
  options: QRCodeOptions = { width: 160, margin: 1 }
): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: options.width || 160,
      margin: options.margin !== undefined ? options.margin : 1,
      color: {
        dark: options.color?.dark || '#000000',
        light: options.color?.light || '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate QR code DataURL:', err);
    return '';
  }
}

/**
 * Encodes structured transaction lookup data for post-sale retrieval.
 */
export function buildTransactionLookupPayload(
  receiptNumber: string,
  storeCode?: string,
  totalAmount?: number,
  currencyCode?: string
): string {
  if (!storeCode || totalAmount === undefined) {
    return receiptNumber;
  }
  return `AURA-TXN:${receiptNumber}|BRANCH:${storeCode}|AMT:${currencyCode || 'LKR'}-${totalAmount.toFixed(2)}`;
}
