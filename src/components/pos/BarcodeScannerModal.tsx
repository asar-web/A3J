import React, { useState, useEffect, useRef } from 'react';
import { usePOS } from '../../context/POSContext';
import { Product } from '../../types/pos';
import {
  Camera,
  Barcode,
  X,
  Check,
  AlertCircle,
  Sparkles,
  Search,
  Plus,
  Minus,
  RefreshCw,
  ShoppingBag,
  SlidersHorizontal,
  Printer,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { generateBarcodeBars } from '../../utils/barcode';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'cart' | 'audit';
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'cart',
}) => {
  const { products, scanBarcode, currentStore, adjustStock, formatMoney } = usePOS();
  const [scannerMode, setScannerMode] = useState<'cart' | 'audit'>(initialMode);
  const [manualCode, setManualCode] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [useCamera, setUseCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selectedAuditProduct, setSelectedAuditProduct] = useState<Product | null>(null);
  const [showLabelPrint, setShowLabelPrint] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const scanIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
      setStatusMessage(null);
      setSelectedAuditProduct(null);
    } else {
      setUseCamera(false);
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    }
  }, [isOpen]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (isOpen && useCamera) {
      navigator.mediaDevices
        ?.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
          if ('BarcodeDetector' in window) {
            const barcodeDetector = new (window as any).BarcodeDetector({
              formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code'],
            });
            scanIntervalRef.current = setInterval(async () => {
              if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
                try {
                  const barcodes = await barcodeDetector.detect(videoRef.current);
                  if (barcodes.length > 0) {
                    const rawValue = barcodes[0].rawValue;
                    if (rawValue) {
                      handleScanSubmit(rawValue);
                    }
                  }
                } catch {}
              }
            }, 600);
          }
        })
        .catch(() => {
          setCameraError('Camera access denied or unavailable. Use manual barcode input or 1-tap simulator.');
          setUseCamera(false);
        });
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, [isOpen, useCamera]);

  if (!isOpen) return null;

  const handleScanSubmit = (codeToScan?: string) => {
    const code = codeToScan || manualCode;
    if (!code.trim()) return;
    const res = scanBarcode(code.trim(), scannerMode);
    if (res.success && res.product) {
      setStatusMessage({ text: res.message, isError: false });
      setManualCode('');
      if (scannerMode === 'audit') {
        setSelectedAuditProduct(res.product);
      }
    } else {
      setStatusMessage({ text: res.message, isError: true });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleScanSubmit();
    }
  };

  const handleQuickAdjustAudit = (delta: number) => {
    if (!selectedAuditProduct) return;
    adjustStock(selectedAuditProduct.id, currentStore.id, delta, 'Barcode Audit Adjustment');
    setSelectedAuditProduct((prev) => {
      if (!prev) return null;
      const current = prev.stockByStore[currentStore.id] ?? 0;
      return {
        ...prev,
        stockByStore: {
          ...prev.stockByStore,
          [currentStore.id]: Math.max(0, current + delta),
        },
      };
    });
    setStatusMessage({
      text: `Stock adjusted by ${delta > 0 ? `+${delta}` : delta} for ${selectedAuditProduct.name}.`,
      isError: false,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200 bg-neutral-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center shadow-xs">
              <Barcode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Retail Barcode Scanner</h3>
              <p className="text-[11px] text-neutral-500">
                Branch: <strong>{currentStore.name}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 transition-colors rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="px-5 py-2.5 bg-neutral-100/60 border-b border-neutral-200 flex items-center justify-between gap-3 text-xs">
          <span className="font-semibold text-neutral-700">Mode:</span>
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-neutral-200">
            <button
              type="button"
              onClick={() => {
                setScannerMode('cart');
                setSelectedAuditProduct(null);
                setStatusMessage(null);
              }}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                scannerMode === 'cart'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Scan to Cart</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setScannerMode('audit');
                setStatusMessage(null);
              }}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                scannerMode === 'audit'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Check Stock</span>
            </button>
          </div>
        </div>

        {/* Viewfinder / Laser Simulation Area */}
        <div className="relative bg-neutral-950 p-6 flex flex-col items-center justify-center min-h-[220px] overflow-hidden select-none">
          {useCamera ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
              <div className="relative w-64 h-32 border-2 border-dashed border-red-500/80 rounded-xl flex items-center justify-center overflow-hidden bg-neutral-900/50">
                <div className="absolute inset-x-0 h-0.5 bg-red-500 shadow-[0_0_12px_#ef4444] animate-pulse" />
                <div className="text-neutral-400 text-[11px] font-mono tracking-wider">
                  [ LASER RETICLE READY ]
                </div>
              </div>
              <p className="mt-3 text-xs text-neutral-400">
                Point laser scanner or phone camera at product barcode
              </p>
            </div>
          )}

          <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
            <button
              onClick={() => {
                setCameraError(null);
                setUseCamera(!useCamera);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-neutral-800/90 hover:bg-neutral-700 text-neutral-100 rounded-lg backdrop-blur-xs transition-colors border border-neutral-700 shadow-xs cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-neutral-300" />
              <span>{useCamera ? 'Turn Off Camera' : 'Live Camera'}</span>
            </button>
          </div>

          {cameraError && (
            <div className="absolute bottom-3 left-4 right-4 z-20 bg-neutral-900/95 text-amber-300 text-xs px-3 py-2 rounded-lg flex items-center gap-2 border border-amber-500/30">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{cameraError}</span>
            </div>
          )}
        </div>

        {/* Feedback Message */}
        {statusMessage && (
          <div
            className={`px-5 py-2.5 text-xs font-medium flex items-center gap-2 ${
              statusMessage.isError
                ? 'bg-rose-50 text-rose-800 border-b border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
            }`}
          >
            {statusMessage.isError ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Audit Mode Result with Product Image */}
          {scannerMode === 'audit' && selectedAuditProduct && (
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-3 text-xs animate-in fade-in">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border border-neutral-200 shrink-0">
                    <img
                      src={selectedAuditProduct.imageUrl}
                      alt={selectedAuditProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-900 text-sm">{selectedAuditProduct.name}</h4>
                    <p className="text-[11px] font-mono text-neutral-500 mt-0.5">
                      SKU: {selectedAuditProduct.sku} · Barcode: {selectedAuditProduct.barcode}
                    </p>
                    <p className="text-neutral-700 font-semibold mt-1">
                      Price: {formatMoney(selectedAuditProduct.price)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono text-neutral-400 block">Current Stock</span>
                  <span
                    className={`text-xl font-bold font-mono ${
                      (selectedAuditProduct.stockByStore[currentStore.id] ?? 0) === 0
                        ? 'text-rose-600'
                        : (selectedAuditProduct.stockByStore[currentStore.id] ?? 0) <=
                          selectedAuditProduct.lowStockThreshold
                        ? 'text-amber-600'
                        : 'text-neutral-900'
                    }`}
                  >
                    {selectedAuditProduct.stockByStore[currentStore.id] ?? 0} units
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-200 flex items-center justify-between gap-2">
                <span className="font-semibold text-neutral-700">Quick Adjust:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickAdjustAudit(5)}
                    className="px-2.5 py-1 bg-white hover:bg-neutral-100 border border-neutral-300 rounded font-bold text-xs cursor-pointer"
                  >
                    +5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAdjustAudit(10)}
                    className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded font-bold text-xs shadow-xs cursor-pointer"
                  >
                    +10 Restock
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAdjustAudit(-1)}
                    className="px-2 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-neutral-300 rounded text-xs font-medium cursor-pointer"
                  >
                    -1 Damaged
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Barcode input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleScanSubmit();
            }}
            className="flex gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Scan with laser gun or enter barcode / SKU..."
              className="flex-1 px-3.5 py-2.5 text-sm font-mono border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-neutral-900 text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-colors shrink-0 shadow-xs cursor-pointer active:scale-[0.98]"
            >
              Scan
            </button>
          </form>

          {/* 1-Tap Quick Simulation Barcodes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-neutral-800">
                1-Tap Barcode Simulation (All Catalog SKUs):
              </span>
              <button
                type="button"
                onClick={() => setShowLabelPrint(!showLabelPrint)}
                className="text-[11px] text-neutral-600 hover:text-neutral-900 font-semibold underline flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-3 h-3" />
                <span>{showLabelPrint ? 'Hide Shelf Tags' : 'View Shelf Tags'}</span>
              </button>
            </div>

            {showLabelPrint ? (
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {products.map((p) => {
                    const bars = generateBarcodeBars(p.barcode);
                    return (
                      <div
                        key={p.id}
                        className="p-2 bg-white border border-neutral-300 rounded-lg flex flex-col justify-between"
                      >
                        <p className="font-bold text-[11px] text-neutral-900 truncate">{p.name}</p>
                        <p className="text-[10px] text-neutral-500 font-mono">SKU: {p.sku}</p>
                        <div className="h-7 w-full flex items-stretch justify-between py-1 my-1 bg-white">
                          {bars.map((w, idx) => (
                            <div key={idx} className="bg-neutral-900" style={{ width: `${w * 1.5}px` }} />
                          ))}
                        </div>
                        <div className="flex justify-between items-baseline font-mono text-[10px]">
                          <span className="text-neutral-500">{p.barcode}</span>
                          <span className="font-bold text-neutral-900">{formatMoney(p.price)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {products.map((prod) => {
                  const stock = prod.stockByStore[currentStore.id] ?? 0;
                  return (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => handleScanSubmit(prod.barcode)}
                      className="flex items-center justify-between p-2 text-left bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2 truncate mr-2">
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-7 h-7 object-cover rounded shrink-0 border border-neutral-200"
                        />
                        <div className="truncate">
                          <p className="text-xs font-semibold text-neutral-900 truncate">{prod.name}</p>
                          <p className="text-[11px] font-mono text-neutral-500">{prod.barcode}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-bold text-neutral-900 block">
                          {formatMoney(prod.price)}
                        </span>
                        <span
                          className={`text-[10px] font-mono ${
                            stock === 0 ? 'text-rose-600 font-bold' : stock <= prod.lowStockThreshold ? 'text-amber-600 font-semibold' : 'text-neutral-400'
                          }`}
                        >
                          {stock} in store
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-neutral-50 border-t border-neutral-200 flex justify-between items-center text-xs">
          <span className="text-neutral-500 font-mono text-[11px]">
            Laser Gun &amp; Optical Camera Ready
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold text-neutral-700 hover:text-neutral-900 transition-colors cursor-pointer"
          >
            Done Scanning
          </button>
        </div>
      </div>
    </div>
  );
};
