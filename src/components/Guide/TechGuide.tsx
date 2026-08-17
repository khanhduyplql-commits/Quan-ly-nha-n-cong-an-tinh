import React, { useState } from 'react';
import { 
  BookOpen, 
  Server, 
  Database, 
  ShieldCheck, 
  CreditCard, 
  Code2, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  Copy, 
  Check, 
  Sparkles,
  ChefHat,
  Calculator,
  Wallet,
  Receipt,
  Printer,
  DollarSign
} from 'lucide-react';

export const TechGuide: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'workflow' | 'pos_cashflow' | 'architecture' | 'database' | 'security' | 'code'>('workflow');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const sampleServerCode = `// server.js - Backend Express cho hệ thống Quầy Thu Ngân POS & Sổ Quỹ Thu Chi
const express = require('express');
const http = require('http');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// In-memory state (hoặc kết nối Database PostgreSQL / MongoDB / Firestore)
const activeOrders = [];
const cashflowTransactions = [];

// API Tạo đơn & Thu tiền tại quầy -> Tự động đẩy Phiếu Thu
app.post('/api/pos/checkout', (req, res) => {
  const { order, paymentMethod, amount, cashierName, payerName } = req.body;
  
  // 1. Tạo đơn hàng và đánh dấu đã thanh toán (paid)
  const newOrder = {
    id: \`ord_\${Date.now()}\`,
    ...order,
    status: 'cooking', // Gửi ngay cho bếp nấu
    paymentStatus: 'paid',
    paymentMethod,
    createdAt: Date.now()
  };
  activeOrders.push(newOrder);

  // 2. Tự động sinh Phiếu Thu vào Sổ Quỹ (Cashflow Ledger)
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(cashflowTransactions.length + 1).padStart(3, '0');
  const receiptNumber = \`PT-\${today}-\${seq}\`;

  const newReceipt = {
    id: \`tx-\${Date.now()}\`,
    receiptNumber,
    type: 'income',
    category: 'sales',
    categoryName: 'Doanh thu bán hàng',
    title: \`Thu tiền quầy - \${order.tableName || 'Khách vãng lai'} (\${newOrder.orderNumber})\`,
    amount,
    paymentMethod,
    recordedBy: cashierName || 'Thu ngân',
    payerOrRecipient: payerName || 'Khách tại quầy',
    orderId: newOrder.id,
    createdAt: Date.now()
  };
  cashflowTransactions.push(newReceipt);

  // 3. Phản hồi cho POS in hóa đơn và đẩy dữ liệu cho KDS Bếp
  res.json({
    success: true,
    order: newOrder,
    receipt: newReceipt
  });
});

server.listen(3000, () => {
  console.log('POS & Cashflow Server running on port 3000');
});`;

  const sampleDbSchema = `-- PostgreSQL Schema cho hệ thống POS Bán Hàng & Sổ Quỹ Thu Chi
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    bank_bin VARCHAR(10),
    bank_account VARCHAR(30),
    bank_account_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Quản lý Bàn ăn & Khu vực
CREATE TABLE restaurant_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_number VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    capacity INT DEFAULT 4,
    zone VARCHAR(50) DEFAULT 'Tầng 1',
    status VARCHAR(20) DEFAULT 'empty' -- empty, eating, waiting_bill
);

-- Bảng Thực đơn & Giá món
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    cost_price NUMERIC(12, 2) DEFAULT 0, -- Giá vốn để tính lãi gộp
    is_available BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Đơn Hàng (Orders)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(20) NOT NULL,
    table_number VARCHAR(20),
    customer_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending', -- pending, cooking, served, completed
    payment_status VARCHAR(20) DEFAULT 'unpaid', -- unpaid, paid, refunded
    payment_method VARCHAR(30), -- cash, vietqr, card, momo
    total_amount NUMERIC(12, 2) NOT NULL,
    discount_amount NUMERIC(12, 2) DEFAULT 0,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Sổ Quỹ Thu - Chi (Cashflow Transactions - Phiếu Thu / Phiếu Chi)
CREATE TABLE cash_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number VARCHAR(50) NOT NULL UNIQUE, -- PT-YYYYMMDD-XXX hoặc PC-YYYYMMDD-XXX
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    recorded_by VARCHAR(100) NOT NULL,
    payer_or_recipient VARCHAR(100),
    order_id UUID REFERENCES orders(id),
    table_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-2xs font-extrabold uppercase tracking-wider mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Sổ Tay Hướng Dẫn & Tài Liệu Kỹ Thuật</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Quy Trình Thu Ngân POS & Đẩy Phiếu Thu Tự Động
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 mt-2 leading-relaxed">
            Tài liệu hướng dẫn vận hành quầy thu ngân: chọn món, áp dụng chiết khấu, tính tiền thừa, quét mã VietQR động, tự động lập Phiếu Thu vào Sổ Quỹ và điều phối tức thì cho Màn hình Bếp (KDS).
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
        {[
          { id: 'workflow' as const, label: '1. Quy Trình Thu Ngân Bán Hàng', icon: Calculator },
          { id: 'pos_cashflow' as const, label: '2. Tự Động Đẩy Phiếu Thu & Sổ Quỹ', icon: Receipt },
          { id: 'architecture' as const, label: '3. Kiến Trúc KDS & Thu Ngân', icon: Server },
          { id: 'database' as const, label: '4. Cấu Trúc Database PostgreSQL', icon: Database },
          { id: 'security' as const, label: '5. Thanh Toán VietQR & Bảo Mật', icon: ShieldCheck },
          { id: 'code' as const, label: '6. Mã Nguồn Mẫu Express API', icon: Code2 },
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Section Content */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
        {/* TAB 1: WORKFLOW */}
        {activeSection === 'workflow' && (
          <div className="space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-600" />
                <span>Quy trình 4 bước Bán hàng & Thu ngân tại quầy</span>
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Tối ưu tốc độ phục vụ cho giờ cao điểm của nhà ăn cán bộ và khách vãng lai.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  step: '01',
                  title: 'Chọn Món & Tùy Chọn',
                  desc: 'Thu ngân gõ tên hoặc click trực tiếp món ăn từ thực đơn bên trái. Có thể chọn kích cỡ, gia vị theo yêu cầu của khách.',
                  color: 'border-amber-400 bg-amber-50/40 text-amber-900'
                },
                {
                  step: '02',
                  title: 'Chọn Bàn / Mang Về',
                  desc: 'Mặc định đơn tạo tại quầy mang về, hoặc chọn số bàn nếu khách dùng tại bàn ăn. Nhập tên khách / cán bộ.',
                  color: 'border-blue-400 bg-blue-50/40 text-blue-900'
                },
                {
                  step: '03',
                  title: 'Thu Tiền Đa Phương Thức',
                  desc: 'Chọn Tiền mặt (tính tiền thối tự động), VietQR động sinh theo số tiền, hoặc Quẹt thẻ POS ngân hàng.',
                  color: 'border-emerald-400 bg-emerald-50/40 text-emerald-900'
                },
                {
                  step: '04',
                  title: 'Xuất Phiếu Thu & Đẩy Bếp',
                  desc: 'Hệ thống tự động sinh mã Phiếu Thu PT-YYYYMMDD-XXX ghi nhận doanh thu vào Sổ Quỹ, đồng thời bắn đơn sang Màn hình Bếp KDS.',
                  color: 'border-purple-400 bg-purple-50/40 text-purple-900'
                }
              ].map(card => (
                <div key={card.step} className={`p-4 rounded-2xl border ${card.color} flex flex-col justify-between`}>
                  <div>
                    <span className="text-2xl font-black opacity-40 block mb-1">{card.step}</span>
                    <h3 className="font-extrabold text-sm mb-1.5">{card.title}</h3>
                    <p className="text-xs leading-relaxed opacity-90">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: POS CASHFLOW LEDGER */}
        {activeSection === 'pos_cashflow' && (
          <div className="space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <span>Cơ chế Tự Động Đồng Bộ Sổ Quỹ Thu - Chi (Cashflow)</span>
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Minh bạch tài chính 100%, chống thất thoát và hỗ trợ in phiếu thu tiêu chuẩn.
              </p>
            </div>

            <div className="space-y-4 text-xs text-stone-700 leading-relaxed">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <h4 className="font-extrabold text-emerald-950 text-sm mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Quy tắc sinh mã chứng từ chuẩn kế toán:</span>
                </h4>
                <ul className="list-disc list-inside space-y-1 text-emerald-900">
                  <li><strong>Phiếu Thu (Income):</strong> Định dạng <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-emerald-800">PT-YYYYMMDD-XXX</code> (Ví dụ: PT-20260816-001)</li>
                  <li><strong>Phiếu Chi (Expense):</strong> Định dạng <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-rose-800">PC-YYYYMMDD-XXX</code> cho việc nhập nguyên liệu tươi sống, gas, gia vị, điện nước</li>
                  <li><strong>Số Dư Quỹ (Cash Balance):</strong> Tự động tính toán = Tổng Thu - Tổng Chi theo thời gian thực</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 border border-stone-200 rounded-2xl bg-stone-50">
                  <h5 className="font-black text-stone-900 mb-1.5">Nội dung trên Phiếu Thu:</h5>
                  <p className="text-2xs text-stone-500 mb-2">Tự động điền đầy đủ khi thu ngân bấm xác nhận:</p>
                  <ul className="space-y-1 text-2xs text-stone-700">
                    <li>• Tên đơn vị / Nhà ăn</li>
                    <li>• Ngày giờ lập phiếu & Tên thu ngân thực hiện</li>
                    <li>• Tên người nộp / Cán bộ / Khách hàng</li>
                    <li>• Danh mục món ăn, số lượng, đơn giá, chiết khấu</li>
                    <li>• Hình thức thanh toán (Tiền mặt / VietQR / Thẻ)</li>
                    <li>• Chữ ký người lập phiếu & thủ quỹ</li>
                  </ul>
                </div>

                <div className="p-4 border border-stone-200 rounded-2xl bg-stone-50">
                  <h5 className="font-black text-stone-900 mb-1.5">Xuất & In Ấn:</h5>
                  <p className="text-2xs text-stone-500 mb-2">Hỗ trợ in nhiệt 80mm / 58mm hoặc giấy A5/A4:</p>
                  <ul className="space-y-1 text-2xs text-stone-700">
                    <li>• Nhấn <strong>In Phiếu Thu</strong> để mở lệnh in trình duyệt (<code className="font-mono">window.print()</code>)</li>
                    <li>• Tự động format khổ in hóa đơn tiêu chuẩn, ẩn các nút bấm điều hướng</li>
                    <li>• Có thể tra cứu lại và in lại bất kỳ phiếu thu nào trong ngày từ tab <strong>Quản Lý Thu - Chi</strong></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ARCHITECTURE */}
        {activeSection === 'architecture' && (
          <div className="space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                <Server className="w-5 h-5 text-amber-600" />
                <span>Kiến trúc Kỹ Thuật Tổng Thể</span>
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Mô hình Client-Server đồng bộ dữ liệu thời gian thực giữa POS, KDS Bếp và Sổ Quỹ.
              </p>
            </div>

            <div className="bg-stone-900 text-stone-200 p-4 sm:p-6 rounded-2xl font-mono text-2xs sm:text-xs overflow-x-auto">
              <pre>{`
  [QUẦY THU NGÂN POS] ───────────────► POST /api/orders (Tạo đơn)
          │                                  │
          │ (Thu tiền tại quầy)              ▼
          ├──────────────────────────► POST /api/cashflow (Sinh Phiếu Thu PT-XXXX)
          │                                  │
          │                                  ▼
          │                            [DATABASE POSTGRESQL]
          │                                  │
          ▼                                  ▼
  [IN PHIẾU THU / HÓA ĐƠN]             [SSE / SERVER-SENT EVENTS]
                                             │
                                             ▼
                                    [MÀN HÌNH BẾP KDS]
                                (Hiển thị đơn cần nấu ngay)`}</pre>
            </div>
          </div>
        )}

        {/* TAB 4: DATABASE */}
        {activeSection === 'database' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-amber-600" />
                  <span>Cấu Trúc Database PostgreSQL Chuẩn</span>
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  Bao gồm các bảng: Orders, Menu Items, Cash Transactions (Sổ quỹ), Tables.
                </p>
              </div>
              <button
                onClick={() => handleCopy('db_schema', sampleDbSchema)}
                className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-2xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {copiedCodeId === 'db_schema' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCodeId === 'db_schema' ? 'Đã sao chép' : 'Sao chép SQL'}</span>
              </button>
            </div>

            <pre className="bg-stone-900 text-stone-200 p-4 rounded-2xl font-mono text-2xs overflow-x-auto max-h-[450px]">
              {sampleDbSchema}
            </pre>
          </div>
        )}

        {/* TAB 5: SECURITY & PAYMENT */}
        {activeSection === 'security' && (
          <div className="space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Thanh Toán VietQR & An Toàn Thu Quỹ</span>
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Tích hợp chuẩn Napas 247 VietQR trực tiếp tại quầy thanh toán.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 border border-stone-200 rounded-2xl bg-stone-50">
                <h4 className="font-black text-stone-900 mb-2 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  <span>VietQR Động (Dynamic VietQR)</span>
                </h4>
                <p className="text-stone-600 leading-relaxed text-2xs">
                  Mã QR hiển thị tại màn hình POS tự động mã hóa: Mã định danh ngân hàng (BIN), Số tài khoản, Số tiền chính xác và Cú pháp chuyển khoản. Khách quét bằng ứng dụng ngân hàng bất kỳ không cần gõ số tiền hay số tài khoản.
                </p>
              </div>

              <div className="p-4 border border-stone-200 rounded-2xl bg-stone-50">
                <h4 className="font-black text-stone-900 mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Kiểm Soát Thất Thoát Ca Thu Ngân</span>
                </h4>
                <p className="text-stone-600 leading-relaxed text-2xs">
                  Mỗi đơn bán hàng tại quầy đều liên kết trực tiếp 1-1 với một mã Phiếu Thu. Thu ngân chốt ca có thể xem ngay Báo cáo tổng thu tiền mặt vs chuyển khoản vs quẹt thẻ trong tab Quản Lý Thu - Chi.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SAMPLE CODE */}
        {activeSection === 'code' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-amber-600" />
                  <span>Mã Nguồn Mẫu Express Backend</span>
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  Triển khai API nhận đơn POS và tự động ghi nhận Phiếu Thu.
                </p>
              </div>
              <button
                onClick={() => handleCopy('server_code', sampleServerCode)}
                className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-2xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {copiedCodeId === 'server_code' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCodeId === 'server_code' ? 'Đã sao chép' : 'Sao chép Code'}</span>
              </button>
            </div>

            <pre className="bg-stone-900 text-stone-200 p-4 rounded-2xl font-mono text-2xs overflow-x-auto max-h-[450px]">
              {sampleServerCode}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
