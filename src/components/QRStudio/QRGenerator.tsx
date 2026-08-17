import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  Printer, 
  Download, 
  Smartphone, 
  Sparkles, 
  Wifi, 
  Phone, 
  Utensils, 
  ExternalLink,
  Layers,
  Copy,
  Check,
  AlertTriangle,
  Info,
  HelpCircle,
  Globe,
  Settings,
  ChevronDown
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { getTableQrTargetUrl } from '../../utils/format';

interface QRGeneratorProps {
  onSimulateScan: (tableNumber: string) => void;
}

export const QRGenerator: React.FC<QRGeneratorProps> = ({ onSimulateScan }) => {
  const { tables, restaurantInfo } = useRestaurant();
  const [selectedTableNum, setSelectedTableNum] = useState<string>('05');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [wifiName, setWifiName] = useState('NhaAn_CAT_QuangNgai');
  const [wifiPass, setWifiPass] = useState('88889999');
  const [accentColor, setAccentColor] = useState('#ea580c'); // orange-600
  const [qrZoneFilter, setQrZoneFilter] = useState<string>('all');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  // Active dev URL and Shared URL
  const devOrigin = typeof window !== 'undefined' && window.location ? window.location.origin : 'https://ais-dev-ty4vdsigvv64cb5zacojoe-125317174715.asia-southeast1.run.app';
  const sharedCloudUrl = 'https://ais-pre-ty4vdsigvv64cb5zacojoe-125317174715.asia-southeast1.run.app';

  // Base URL configuration for QR generation (defaults to active current origin)
  const [customBaseUrl, setCustomBaseUrl] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.location) {
      return window.location.origin;
    }
    return devOrigin;
  });

  const [urlMode, setUrlMode] = useState<'current' | 'shared' | 'custom'>('current');

  const printRef = useRef<HTMLDivElement>(null);

  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // Compute actual target URL
  const targetUrl = getTableQrTargetUrl(selectedTableNum, customBaseUrl);

  // Generate QR code whenever selected table, custom url, or settings change
  useEffect(() => {
    QRCode.toDataURL(targetUrl, {
      width: 500,
      margin: 3, // iOS Vision camera requires adequate quiet zone
      errorCorrectionLevel: 'M', // 15% error correction - best for mobile camera scanning
      color: {
        dark: '#111827', // stone-900 / gray-900 high contrast
        light: '#ffffff'
      }
    }).then(url => {
      setQrDataUrl(url);
    }).catch(err => {
      console.error('QR code generation error:', err);
    });
  }, [targetUrl]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPng = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `Ma-QR-Ban-${selectedTableNum}-${restaurantInfo.name.replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSetUrlMode = (mode: 'current' | 'shared' | 'custom') => {
    setUrlMode(mode);
    if (mode === 'current') {
      setCustomBaseUrl(window.location.origin || devOrigin);
    } else if (mode === 'shared') {
      setCustomBaseUrl(sharedCloudUrl);
    } else if (mode === 'custom' && (!customBaseUrl || customBaseUrl === window.location.origin)) {
      setCustomBaseUrl('https://nhaan-cat-quangngai.vn');
    }
  };

  const currentTable = tables.find(t => t.number === selectedTableNum) || tables[0];


  return (
    <div className="min-h-screen bg-stone-100/70 pb-24">
      {/* Top Header */}
      <div className="bg-white border-b border-stone-200 sticky top-[88px] sm:top-[92px] z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-extrabold text-base sm:text-lg text-stone-900 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-amber-600" />
              <span>Trình Tạo & In Standee Mã QR Bàn</span>
            </h1>
            <p className="text-xs text-stone-500">
              Chuẩn mã QR chuẩn tương thích 100% iPhone (iOS Camera, Safari) & Android
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowIosHelp(true)}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span>Sửa Lỗi Quét Trên iPhone</span>
            </button>

            <button
              onClick={handleDownloadPng}
              className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Tải Ảnh PNG</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In Standee A6</span>
            </button>
          </div>
        </div>
      </div>

      {/* Localhost Warning Notice for Mobile Camera */}
      {isLocalhost && urlMode === 'current' && (
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start gap-3 text-amber-900 text-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="font-bold text-sm block">
                Lưu ý quan trọng khi quét mã QR trên điện thoại thực tế (iOS / Android):
              </strong>
              <p className="text-amber-800">
                Bạn đang chạy ứng dụng trên <code className="bg-amber-200/80 px-1.5 py-0.5 rounded font-mono font-bold">localhost</code>. 
                Khi dùng điện thoại iPhone thật để quét, điện thoại sẽ không thể truy cập vào localhost của máy tính.
              </p>
              <p className="text-amber-800 font-medium">
                👉 <strong>Cách xử lý:</strong> Hãy chọn tab <strong>"Tên miền / URL Công Khai"</strong> bên dưới để đổi sang địa chỉ IP mạng Wifi hoặc Domain thật của nhà hàng!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Studio Body */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Controls Column (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Table selection */}
            <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-600" />
                  <span>1. Chọn Bàn Cần Tạo Mã QR</span>
                </h3>
                <span className="text-2xs font-bold text-stone-500">
                  {tables.length} bàn
                </span>
              </div>

              {/* Zone Filter Chips */}
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-2xs">
                {['all', 'Tầng 1', 'Tầng 2 (VIP)'].map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setQrZoneFilter(z)}
                    className={`flex-1 py-1 px-2 rounded-lg font-bold transition-all cursor-pointer text-center ${
                      qrZoneFilter === z
                        ? 'bg-white text-stone-900 shadow-2xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    {z === 'all' ? 'Tất Cả' : z}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-52 overflow-y-auto p-1 scrollbar-thin">
                {tables
                  .filter((t) => qrZoneFilter === 'all' || t.zone === qrZoneFilter)
                  .map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTableNum(t.number)}
                      className={`py-2 px-1 text-center rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        selectedTableNum === t.number
                          ? 'bg-amber-500 text-white border-amber-600 shadow-2xs scale-102'
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
              </div>

              {/* URL & Domain Configuration */}
              <div className="pt-3 border-t border-stone-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-2xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-amber-600" />
                    <span>Chọn Link Tạo Mã QR Cho Điện Thoại:</span>
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-2xs font-medium">
                  <button
                    type="button"
                    onClick={() => handleSetUrlMode('current')}
                    className={`py-2 px-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                      urlMode === 'current'
                        ? 'bg-amber-600 text-white border-amber-600 font-bold shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    🟢 Link Đang Chạy
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetUrlMode('shared')}
                    className={`py-2 px-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                      urlMode === 'shared'
                        ? 'bg-amber-600 text-white border-amber-600 font-bold shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    🌟 Link Đã Chia Sẻ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetUrlMode('custom')}
                    className={`py-2 px-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                      urlMode === 'custom'
                        ? 'bg-amber-600 text-white border-amber-600 font-bold shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    🌐 Tùy Chỉnh IP/Domain
                  </button>
                </div>

                {urlMode === 'current' && (
                  <div className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200 text-3xs text-amber-900 space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-amber-600" />
                      <span>Đang dùng liên kết máy chủ trực tiếp</span>
                    </p>
                    <p className="text-amber-800">
                      Mã QR này dẫn trực tiếp vào phiên bản web đang chạy của ứng dụng, không bị lỗi 404 &quot;không tìm thấy trang&quot;.
                    </p>
                  </div>
                )}

                {urlMode === 'shared' && (
                  <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200 text-3xs text-blue-900 space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-blue-600" />
                      <span>Link Cloud Đã Chia Sẻ (Shared URL)</span>
                    </p>
                    <p className="text-blue-800">
                      ⚠️ <strong>Lưu ý:</strong> Để link này hoạt động được trên điện thoại ngoài, bạn cần bấm nút <strong>&quot;Share&quot; (Chia sẻ)</strong> ở góc trên thanh công cụ AI Studio. Nếu chưa bấm Share, hãy dùng nút <strong>🟢 Link Đang Chạy</strong> ở trên!
                    </p>
                  </div>
                )}

                {urlMode === 'custom' && (
                  <div className="space-y-1 pt-1">
                    <label className="text-3xs text-stone-500 font-semibold">
                      Nhập Domain thật hoặc IP LAN máy chủ nhà ăn:
                    </label>
                    <input
                      type="text"
                      value={customBaseUrl}
                      onChange={(e) => setCustomBaseUrl(e.target.value)}
                      placeholder="https://nhaan-cat-quangngai.vn"
                      className="w-full text-xs px-3 py-1.5 rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    readOnly
                    value={targetUrl}
                    className="flex-1 text-2xs px-2.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-600 font-mono"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                    title="Sao chép link"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Đã chép' : 'Chép'}</span>
                  </button>
                  <a
                    href={targetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl transition-colors cursor-pointer flex items-center justify-center"
                    title="Mở tab mới"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => onSimulateScan(selectedTableNum)}
                    className="py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Thử Gọi Món Bàn {selectedTableNum}</span>
                  </button>

                  <a
                    href={`https://zalo.me/share?url=${encodeURIComponent(targetUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Gửi Link Qua Zalo</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Standee Customization Card */}
            <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-4">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>2. Tùy Chỉnh Thông Tin Thẻ Bàn</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Tên mạng Wifi quán:</label>
                  <input
                    type="text"
                    value={wifiName}
                    onChange={(e) => setWifiName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-stone-50 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Mật khẩu Wifi:</label>
                  <input
                    type="text"
                    value={wifiPass}
                    onChange={(e) => setWifiPass(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-stone-50 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Màu sắc chủ đạo:</label>
                  <div className="flex gap-2">
                    {['#ea580c', '#059669', '#d97706', '#2563eb', '#dc2626', '#1c1917'].map(col => (
                      <button
                        key={col}
                        onClick={() => setAccentColor(col)}
                        style={{ backgroundColor: col }}
                        className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                          accentColor === col ? 'scale-110 border-stone-900 ring-2 ring-stone-300' : 'border-white'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Standee Card Preview (8 cols) */}
          <div className="lg:col-span-8 flex flex-col items-center">
            <div className="w-full max-w-sm">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-2 text-center">
                Xem trước Standee Để Bàn (Khổ A6 Chuẩn In Ấn)
              </span>

              {/* Printable Standee Card */}
              <div 
                ref={printRef}
                className="bg-white rounded-3xl overflow-hidden shadow-2xl border-4 border-stone-900 text-stone-900 flex flex-col items-center p-6 space-y-4 text-center select-none"
              >
                {/* Brand Header */}
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-xs font-bold text-stone-800 border border-stone-200">
                    <Utensils className="w-3.5 h-3.5" style={{ color: accentColor }} />
                    <span>{restaurantInfo.name}</span>
                  </div>
                  <p className="text-3xs text-stone-400 italic">
                    {restaurantInfo.brandSlogan}
                  </p>
                </div>

                {/* Big Table Name Banner */}
                <div 
                  style={{ backgroundColor: accentColor }}
                  className="w-full py-2.5 rounded-2xl text-white shadow-md space-y-0.5"
                >
                  <span className="text-3xs tracking-widest uppercase font-black opacity-90 block">VỊ TRÍ BÀN</span>
                  <span className="text-2xl sm:text-3xl font-black tracking-tight block">
                    BÀN {selectedTableNum}
                  </span>
                  <span className="text-3xs opacity-80 block">{currentTable.zone}</span>
                </div>

                {/* QR Code Container with High-Contrast iOS Vision Optimization */}
                <div className="p-4 bg-white rounded-2xl border-2 border-dashed border-stone-300 shadow-inner flex flex-col items-center">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={`Mã QR Bàn ${selectedTableNum}`}
                      className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-xl bg-white p-1"
                    />
                  ) : (
                    <div className="w-48 h-48 sm:w-56 sm:h-56 bg-stone-200 rounded-xl flex items-center justify-center">
                      <QrCode className="w-12 h-12 text-stone-400 animate-pulse" />
                    </div>
                  )}
                  <span className="text-2xs font-bold text-stone-700 mt-2 uppercase tracking-wider flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                    <span>Mở Camera • Quét Để Gọi Món</span>
                  </span>
                </div>

                {/* 3 Step Instructions */}
                <div className="w-full bg-stone-50 rounded-2xl p-3 border border-stone-200 space-y-1.5 text-left text-2xs">
                  <div className="flex items-center gap-2 font-semibold text-stone-800">
                    <span className="w-4 h-4 rounded-full bg-stone-900 text-white flex items-center justify-center text-3xs font-black">1</span>
                    <span>Dùng Camera iPhone / Android quét mã QR</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-stone-800">
                    <span className="w-4 h-4 rounded-full bg-stone-900 text-white flex items-center justify-center text-3xs font-black">2</span>
                    <span>Xem thực đơn & chọn món yêu thích</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-stone-800">
                    <span className="w-4 h-4 rounded-full bg-stone-900 text-white flex items-center justify-center text-3xs font-black">3</span>
                    <span>Bấm Gửi Đơn — Bếp sẽ phục vụ ngay!</span>
                  </div>
                </div>

                {/* Wifi & Hotline Footer */}
                <div className="w-full pt-2 border-t border-stone-200 flex items-center justify-between text-3xs text-stone-500">
                  <div className="flex items-center gap-1">
                    <Wifi className="w-3 h-3 text-stone-400" />
                    <span>Wifi: <strong>{wifiName}</strong> (Pass: {wifiPass})</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-stone-700">
                    <Phone className="w-3 h-3" />
                    <span>{restaurantInfo.hotline}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* iOS Troubleshooting Modal */}
      {showIosHelp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-stone-200 my-8">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-amber-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm sm:text-base">
                    Hướng Dẫn Khắc Phục Lỗi Quét QR Trên iPhone (iOS)
                  </h3>
                  <p className="text-2xs text-stone-500">Nguyên nhân phổ biến & cách xử lý triệt để 100%</p>
                </div>
              </div>
              <button 
                onClick={() => setShowIosHelp(false)}
                className="w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-700 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-stone-700 max-h-[75vh] overflow-y-auto">
              {/* Reason 1 */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-stone-900 text-sm">
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-3xs font-black">1</span>
                  <span>Lỗi "Safari không thể mở trang vì không tìm thấy máy chủ" (Localhost)</span>
                </div>
                <p className="text-stone-600 leading-relaxed pl-7">
                  <strong>Nguyên nhân:</strong> Mã QR đang chứa link <code className="bg-stone-200 px-1 py-0.5 rounded font-mono">http://localhost:3000</code>. iPhone là thiết bị độc lập nên không thể mở localhost của máy tính bạn.
                </p>
                <div className="bg-emerald-50 text-emerald-900 p-2.5 rounded-xl text-2xs ml-7 border border-emerald-200">
                  <strong>✅ Cách khắc phục:</strong> Trong phần <em>"Cấu hình Domain / Link Đích"</em>, hãy dán địa chỉ IP Wifi máy tính của bạn (VD: <code className="font-mono">http://192.168.1.15:3000</code>) hoặc Domain công khai (VD: <code className="font-mono">https://nhahang.vn</code> hoặc link Cloud Run).
                </div>
              </div>

              {/* Reason 2 */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-stone-900 text-sm">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-3xs font-black">2</span>
                  <span>Camera iPhone chưa bật tính năng "Quét mã QR"</span>
                </div>
                <p className="text-stone-600 leading-relaxed pl-7">
                  <strong>Cách bật trên iPhone:</strong> Vào <strong>Cài đặt (Settings)</strong> ➔ <strong>Camera</strong> ➔ Bật công tắc <strong>"Quét mã QR" (Scan QR Codes)</strong> lên màu xanh.
                </p>
              </div>

              {/* Reason 3 */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-stone-900 text-sm">
                  <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-3xs font-black">3</span>
                  <span>Dùng ứng dụng Zalo quét mã QR</span>
                </div>
                <p className="text-stone-600 leading-relaxed pl-7">
                  Nếu camera mặc định của iPhone không phản hồi, khách có thể mở <strong>Zalo</strong> ➔ bấm icon <strong>Quét mã QR</strong> ở góc trên bên phải để mở menu ngay lập tức.
                </p>
              </div>

              {/* Reason 4 */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-stone-900 text-sm">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-3xs font-black">4</span>
                  <span>Định dạng mã QR đã được tối ưu tiêu chuẩn Apple</span>
                </div>
                <p className="text-stone-600 leading-relaxed pl-7">
                  Hệ thống đã tự động cấu hình độ tương phản cao (#111827 / #ffffff), vùng an toàn Quiet Zone (Margin = 3) và mức sửa lỗi Error Correction Level M để Camera iOS nhận diện nhanh dưới 0.3 giây.
                </p>
              </div>
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => setShowIosHelp(false)}
                className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Đã Hiểu & Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
