import React, { useRef } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Trash2, 
  Calendar, 
  User, 
  FileText, 
  CreditCard,
  Building,
  CheckCircle2,
  Tag
} from 'lucide-react';
import { CashTransaction } from '../../types';
import { formatVND, formatDate } from '../../utils/format';
import { useRestaurant } from '../../context/RestaurantContext';

interface ReceiptDetailModalProps {
  transaction: CashTransaction | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export const ReceiptDetailModal: React.FC<ReceiptDetailModalProps> = ({
  transaction,
  onClose,
  onDelete
}) => {
  const { restaurantInfo } = useRestaurant();
  const printRef = useRef<HTMLDivElement>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  if (!transaction) return null;

  const isIncome = transaction.type === 'income';

  const handlePrint = () => {
    window.print();
  };

  const getPaymentMethodLabel = (pm: string) => {
    switch (pm) {
      case 'vietqr': return 'Quét mã VietQR Chuyển khoản';
      case 'momo': return 'Ví điện tử MoMo';
      case 'card': return 'Thẻ tín dụng / Ghi nợ POS';
      case 'transfer': return 'Chuyển khoản Ngân hàng';
      case 'cash':
      default: return 'Tiền mặt tại két';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isIncome ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            <h3 className="font-bold text-sm sm:text-base">
              {isIncome ? 'PHIẾU THU TIỀN' : 'PHIẾU CHI TIỀN'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="p-5 overflow-y-auto bg-stone-50/50 flex-1">
          <div 
            ref={printRef}
            className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-4 print:shadow-none print:border-none print:p-0"
          >
            {/* Restaurant header */}
            <div className="text-center border-b border-dashed border-stone-300 pb-3">
              <h4 className="font-black text-stone-900 uppercase text-xs tracking-wider">
                {restaurantInfo.name}
              </h4>
              <p className="text-2xs text-stone-500 mt-0.5">{restaurantInfo.address}</p>
              <p className="text-2xs text-stone-500">Hotline: {restaurantInfo.hotline}</p>
            </div>

            {/* Voucher title */}
            <div className="text-center py-1">
              <h2 className={`text-lg font-black uppercase tracking-wide ${
                isIncome ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {isIncome ? 'PHIẾU THU' : 'PHIẾU CHI'}
              </h2>
              <p className="text-xs font-mono font-bold text-stone-700 mt-0.5">
                Số: {transaction.receiptNumber}
              </p>
              <p className="text-2xs text-stone-500">
                {formatDate(transaction.createdAt)}
              </p>
            </div>

            {/* Transaction Key Info */}
            <div className="space-y-2 text-xs border-y border-stone-200 py-3">
              <div className="flex justify-between items-start gap-2">
                <span className="text-stone-500">Nội dung / Tiêu đề:</span>
                <span className="font-bold text-stone-900 text-right">{transaction.title}</span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-stone-500">Phân loại danh mục:</span>
                <span className="font-semibold text-stone-800 bg-stone-100 px-2 py-0.5 rounded text-2xs">
                  {transaction.categoryName || transaction.category}
                </span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-stone-500">{isIncome ? 'Người nộp tiền:' : 'Người nhận tiền:'}</span>
                <span className="font-semibold text-stone-900">
                  {transaction.payerOrRecipient || 'Khách vãng lai / Trực tiếp'}
                </span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-stone-500">Hình thức thanh toán:</span>
                <span className="font-semibold text-stone-900">
                  {getPaymentMethodLabel(transaction.paymentMethod)}
                </span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-stone-500">Người lập phiếu:</span>
                <span className="font-semibold text-stone-900">{transaction.recordedBy}</span>
              </div>

              {transaction.tableNumber && (
                <div className="flex justify-between items-center gap-2">
                  <span className="text-stone-500">Bàn phục vụ:</span>
                  <span className="font-bold text-amber-700">Bàn {transaction.tableNumber}</span>
                </div>
              )}

              {transaction.description && (
                <div className="pt-1 text-2xs text-stone-600 bg-stone-50 p-2 rounded-lg border border-stone-200">
                  <p className="font-semibold text-stone-700 mb-0.5">Ghi chú chi tiết:</p>
                  <p className="whitespace-pre-line">{transaction.description}</p>
                </div>
              )}
            </div>

            {/* Total Amount Box */}
            <div className={`p-3 rounded-xl border text-center ${
              isIncome 
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' 
                : 'bg-rose-50/80 border-rose-200 text-rose-950'
            }`}>
              <span className="text-2xs font-bold uppercase tracking-wider block opacity-75">
                {isIncome ? 'Tổng Số Tiền Thu Về' : 'Tổng Số Tiền Chi Ra'}
              </span>
              <span className="text-2xl font-black block mt-0.5">
                {formatVND(transaction.amount)}
              </span>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-4 text-center pt-3 text-2xs">
              <div>
                <p className="font-bold text-stone-800">
                  {isIncome ? 'Người nộp tiền' : 'Người nhận tiền'}
                </p>
                <p className="text-stone-400 italic mt-0.5">(Ký, họ tên)</p>
                <div className="h-10"></div>
              </div>
              <div>
                <p className="font-bold text-stone-800">Người lập phiếu</p>
                <p className="text-stone-400 italic mt-0.5">(Ký, họ tên)</p>
                <div className="h-10"></div>
                <p className="font-semibold text-stone-700">{transaction.recordedBy}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer controls */}
        <div className="p-3.5 bg-white border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-2">
          {onDelete && (
            showDeleteConfirm ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-2xs font-bold text-rose-700">Xác nhận xóa?</span>
                <button
                  onClick={() => {
                    onDelete(transaction.id);
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-2xs transition-colors cursor-pointer"
                >
                  Xác nhận
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2.5 py-1.5 border border-stone-200 hover:bg-stone-100 text-stone-600 rounded-lg text-2xs transition-colors cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa Phiếu</span>
              </button>
            )
          )}

          <div className="flex items-center gap-2 ml-auto w-full sm:w-auto justify-end">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-stone-900 hover:bg-black text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In Phiếu</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-stone-300 hover:bg-stone-100 text-stone-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
