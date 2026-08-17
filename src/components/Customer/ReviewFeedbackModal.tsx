import React, { useState } from 'react';
import { X, Star, Heart, CheckCircle2, MessageSquare } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';

interface ReviewFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReviewFeedbackModal: React.FC<ReviewFeedbackModalProps> = ({ isOpen, onClose }) => {
  const { activeTableNumber, currentTable, restaurantInfo } = useRestaurant();
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        id="modal-review-feedback"
        className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-200"
      >
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center">
              <Heart className="w-5 h-5 fill-pink-600" />
            </div>
            <div>
              <h2 className="font-bold text-stone-900 text-base">Đánh Giá Trải Nghiệm</h2>
              <p className="text-xs text-stone-500">{restaurantInfo.name} • Bàn {activeTableNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-200 text-stone-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {isSubmitted ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-stone-900 text-lg">Cảm Ơn Quý Khách!</h3>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                Ý kiến đóng góp quý báu của quý khách giúp nhà hàng không ngừng nâng cao chất lượng phục vụ và món ăn.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-xs text-stone-600 font-medium">
                  Quý khách cảm thấy món ăn và phục vụ tại Bàn {activeTableNumber} hôm nay thế nào?
                </p>
                {/* Star rating */}
                <div className="flex items-center justify-center gap-1.5 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= (hoverRating || rating)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-stone-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-amber-700 block">
                  {rating === 5 && 'Tuyệt vời, rất hài lòng! ⭐⭐⭐⭐⭐'}
                  {rating === 4 && 'Món ngon, phục vụ tốt! ⭐⭐⭐⭐'}
                  {rating === 3 && 'Tạm ổn, có thể cải thiện ⭐⭐⭐'}
                  {rating === 2 && 'Chưa thực sự vừa ý ⭐⭐'}
                  {rating === 1 && 'Cần cải thiện nhiều ⭐'}
                </span>
              </div>

              {/* Feedback text */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-stone-400" />
                  <span>Lời nhắn / Góp ý thêm</span>
                </label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Chia sẻ về hương vị món, độ phục vụ nhanh chóng hoặc không gian quán..."
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md transition-all active:scale-98 cursor-pointer"
              >
                Gửi Đánh Giá
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
