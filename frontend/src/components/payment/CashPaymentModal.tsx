"use client";

import { useState } from "react";
import { X, DollarSign, CheckCircle2 } from "lucide-react";
import { API_URL } from "@/lib/config";

interface CashPaymentModalProps {
  bookingId: string;
  totalPrice: number;
  depositAmount: number;
  totalPaid: number;
  remainingAmount: number;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

export default function CashPaymentModal({ 
  bookingId, 
  totalPrice,
  depositAmount,
  totalPaid,
  remainingAmount,
  onClose, 
  onPaymentSuccess 
}: CashPaymentModalProps) {
  const [paidAmount, setPaidAmount] = useState<number>(remainingAmount);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (paidAmount <= 0) {
      alert("Vui lòng nhập số tiền hợp lệ");
      return;
    }

    if (paidAmount > totalPrice) {
      const confirm = window.confirm(
        `Số tiền nhập (${paidAmount.toLocaleString()}đ) lớn hơn tổng tiền booking (${totalPrice.toLocaleString()}đ).\n\nBạn có chắc chắn?`
      );
      if (!confirm) return;
    }

    setLoading(true);
    try {
      const cashPaymentResponse = await fetch(`${API_URL}/api/cash/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: bookingId,
          amount: paidAmount,
          paidAmount: paidAmount,
        })
      });

      if (!cashPaymentResponse.ok) {
        const error = await cashPaymentResponse.json();
        throw new Error(error.error || "Lỗi khi tạo thanh toán tiền mặt");
      }

      const paymentData = await cashPaymentResponse.json();

      const confirmResponse = await fetch(`${API_URL}/api/cash/${paymentData.payment.paymentID}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (!confirmResponse.ok) {
        throw new Error("Lỗi khi xác nhận thanh toán");
      }

      alert(`✅ Đã thu tiền mặt thành công!\n\n💰 Số tiền: ${paidAmount.toLocaleString()}đ`);
      onPaymentSuccess();
    } catch (error) {
      console.error("Error creating cash payment:", error);
      alert(`❌ Lỗi: ${error instanceof Error ? error.message : "Không thể tạo thanh toán"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAmount = (amount: number) => {
    setPaidAmount(amount);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold">Thu Tiền Mặt</h2>
          <p className="text-gray-600 text-sm mt-1">Xác nhận thanh toán tiền mặt cho booking</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Tổng tiền:</span>
            <span className="font-bold">{totalPrice.toLocaleString()}đ</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Đã thanh toán:</span>
            <span className="font-bold text-green-600">{totalPaid.toLocaleString()}đ</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-gray-600 font-medium">Còn lại:</span>
            <span className="font-bold text-orange-600 text-lg">{remainingAmount.toLocaleString()}đ</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Số tiền thu (VNĐ) *
            </label>
            <input
              type="number"
              required
              min="0"
              value={paidAmount}
              onChange={(e) => setPaidAmount(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors text-lg font-semibold text-right"
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Nhập số tiền khách hàng đã trả
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <button
              type="button"
              onClick={() => handleQuickAmount(depositAmount)}
              className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
            >
              Tiền cọc<br/>
              <span className="text-xs">{depositAmount.toLocaleString()}đ</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickAmount(remainingAmount)}
              className="px-3 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium"
            >
              Còn lại<br/>
              <span className="text-xs">{remainingAmount.toLocaleString()}đ</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickAmount(totalPrice)}
              className="px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
            >
              Tổng tiền<br/>
              <span className="text-xs">{totalPrice.toLocaleString()}đ</span>
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Ghi chú (tùy chọn)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú về thanh toán..."
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Xác Nhận Thu Tiền
                </>
              )}
            </button>
          </div>
        </form>

        <p className="text-xs text-gray-500 text-center mt-4">
          💡 Sau khi xác nhận, thanh toán sẽ được ghi nhận ngay lập tức
        </p>
      </div>
    </div>
  );
}
