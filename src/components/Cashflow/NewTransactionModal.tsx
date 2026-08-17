import React, { useState } from 'react';
import { 
  X, 
  PlusCircle, 
  MinusCircle, 
  DollarSign, 
  Calendar, 
  User, 
  FileText, 
  Tag, 
  CreditCard,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { CashflowType, IncomeCategory, ExpenseCategory } from '../../types';
import { formatVND } from '../../utils/format';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: CashflowType;
}

const INCOME_CATEGORIES: { id: IncomeCategory; name: string }[] = [
  { id: 'sales', name: 'Doanh thu bán hàng' },
  { id: 'deposit', name: 'Thu tiền cọc đặt tiệc / giữ bàn' },
  { id: 'supplier_refund', name: 'Nhà cung cấp hoàn tiền / Chiết khấu' },
  { id: 'scrap_sales', name: 'Bán phế liệu / vỏ chai bia / dầu thừa' },
  { id: 'other_income', name: 'Khoản thu khác' },
];

const EXPENSE_CATEGORIES: { id: ExpenseCategory; name: string }[] = [
  { id: 'food_ingredients', name: 'Thực phẩm tươi sống, thịt cá, rau củ quả' },
  { id: 'beverages_alcohol', name: 'Nhập bia, nước giải khát, rượu, trà' },
  { id: 'staff_salary', name: 'Lương, thưởng, tạm ứng nhân viên' },
  { id: 'rent_utilities', name: 'Tiền thuê mặt bằng, điện, nước, internet' },
  { id: 'gas_fuel', name: 'Gas công nghiệp, than nướng, cồn khô' },
  { id: 'supplies_packaging', name: 'Hộp mang về, đũa muỗng, khăn giấy, hóa phẩm' },
  { id: 'maintenance_repair', name: 'Sửa chữa bảo trì thiết bị bếp, bàn ghế' },
  { id: 'marketing', name: 'Quảng cáo, in menu, biển bảng' },
  { id: 'taxes_fees', name: 'Thuế, phí môn bài, phí dịch vụ' },
  { id: 'other_expense', name: 'Chi phí vận hành khác' },
];

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'expense'
}) => {
  const { addTransaction } = useRestaurant();

  const [type, setType] = useState<CashflowType>(defaultType);
  const [amountStr, setAmountStr] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(
    defaultType === 'income' ? 'sales' : 'food_ingredients'
  );
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'vietqr' | 'transfer' | 'card' | 'momo'>('cash');
  const [payerOrRecipient, setPayerOrRecipient] = useState('');
  const [recordedBy, setRecordedBy] = useState('Quản lý');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync category when type changes
  const handleTypeChange = (newType: CashflowType) => {
    setType(newType);
    if (newType === 'income') {
      setCategory('sales');
    } else {
      setCategory('food_ingredients');
    }
  };

  // Preset quick amounts
  const quickAmounts = [50000, 100000, 200000, 500000, 1000000, 2000000, 5000000];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const numericAmount = parseInt(amountStr.replace(/\D/g, ''), 10);
    if (!numericAmount || numericAmount <= 0) {
      setErrorMsg('Vui lòng nhập số tiền hợp lệ lớn hơn 0');
      return;
    }

    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tiêu đề / lý do thu chi');
      return;
    }

    setIsSubmitting(true);
    try {
      const categoryList = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
      const matchedCat = categoryList.find(c => c.id === category);
      const categoryName = matchedCat ? matchedCat.name : 'Khác';

      await addTransaction({
        type,
        category: category as any,
        categoryName,
        amount: numericAmount,
        title: title.trim(),
        description: description.trim() || undefined,
        paymentMethod,
        recordedBy: recordedBy.trim() || 'Quản lý',
        payerOrRecipient: payerOrRecipient.trim() || undefined
      });

      // Reset & close
      setAmountStr('');
      setTitle('');
      setDescription('');
      setPayerOrRecipient('');
      onClose();
    } catch (err) {
      setErrorMsg('Lỗi khi lưu phiếu thu/chi, vui lòng thử lại');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className={`px-5 py-4 flex items-center justify-between border-b ${
          type === 'income' 
            ? 'bg-emerald-50 text-emerald-950 border-emerald-100' 
            : 'bg-rose-50 text-rose-950 border-rose-100'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${
              type === 'income' ? 'bg-emerald-600' : 'bg-rose-600'
            }`}>
              {type === 'income' ? <PlusCircle className="w-5 h-5" /> : <MinusCircle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                {type === 'income' ? 'Tạo Phiếu Thu Tiền (Thu Nhập)' : 'Tạo Phiếu Chi Tiền (Chi Phí)'}
              </h3>
              <p className="text-xs text-stone-500">
                Ghi nhận vào sổ quỹ tiền mặt & doanh số nhà hàng
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-sm flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Type Selector (Thu vs Chi) */}
          <div className="grid grid-cols-2 gap-2 bg-stone-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>PHIẾU THU (+)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <MinusCircle className="w-4 h-4" />
              <span>PHIẾU CHI (-)</span>
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Số tiền (VNĐ) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="0"
                value={amountStr}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  if (!raw) {
                    setAmountStr('');
                  } else {
                    setAmountStr(new Intl.NumberFormat('vi-VN').format(parseInt(raw, 10)));
                  }
                }}
                className={`w-full text-xl sm:text-2xl font-black rounded-xl border px-3 py-2.5 pl-10 focus:outline-none focus:ring-2 ${
                  type === 'income'
                    ? 'text-emerald-700 border-emerald-300 focus:ring-emerald-500 bg-emerald-50/20'
                    : 'text-rose-700 border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                }`}
              />
              <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-bold text-base ${
                type === 'income' ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                ₫
              </span>
            </div>

            {/* Quick Amounts */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickAmounts.map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmountStr(new Intl.NumberFormat('vi-VN').format(amt))}
                  className="px-2 py-1 text-2xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors cursor-pointer"
                >
                  +{formatVND(amt)}
                </button>
              ))}
            </div>
          </div>

          {/* Title / Reason */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Lý do / Tiêu đề thu chi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder={type === 'income' ? 'VD: Thu cọc bàn tiệc tối mai, Thu bán phế liệu...' : 'VD: Mua 10kg bò tái Wagyu, Tiền điện tháng 7, Đổi bình gas...'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            />
          </div>

          {/* Category & Payment Method Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Danh mục phân loại
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                {(type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Hình thức thanh toán
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="cash">💵 Tiền mặt tại két</option>
                <option value="vietqr">📲 Quét mã VietQR</option>
                <option value="transfer">🏦 Chuyển khoản ngân hàng</option>
                <option value="card">💳 Quẹt thẻ POS</option>
                <option value="momo">🟣 Ví MoMo</option>
              </select>
            </div>
          </div>

          {/* Person in charge & Counterparty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Payer or Recipient */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {type === 'income' ? 'Người nộp tiền / Khách hàng' : 'Người nhận tiền / Nhà cung cấp'}
              </label>
              <input
                type="text"
                placeholder={type === 'income' ? 'VD: Anh Tuấn, Chị Lan...' : 'VD: Đại lý thịt Cô Ba, Gas Petrolimex...'}
                value={payerOrRecipient}
                onChange={(e) => setPayerOrRecipient(e.target.value)}
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              />
            </div>

            {/* Recorded by */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Người lập phiếu (Nhân viên)
              </label>
              <input
                type="text"
                value={recordedBy}
                onChange={(e) => setRecordedBy(e.target.value)}
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              />
            </div>
          </div>

          {/* Note / Description */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Ghi chú thêm (Hóa đơn / Số chứng từ)
            </label>
            <textarea
              rows={2}
              placeholder="Ghi chú chi tiết về số lượng, nguồn hàng hoặc hóa đơn kèm theo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-xs"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-300 font-bold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2.5 rounded-xl text-white font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer ${
                type === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang lưu...' : type === 'income' ? 'Lưu Phiếu Thu' : 'Lưu Phiếu Chi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
