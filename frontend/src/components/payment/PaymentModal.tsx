/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Clock, QrCode, CreditCard } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { API_URL } from "@/lib/config";

interface PaymentModalProps {
  bookingId: string;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

interface PaymentData {
  success: boolean;
  paymentId: string;
  orderCode: number;
  checkoutUrl: string;
  qrCode: string;
  deadline: string;
  amount: number;
  paymentType: string;
  totalPaid: number;
  totalPrice: number;
  remainingAmount: number;
}

export default function PaymentModal({ bookingId, onClose, onPaymentSuccess }: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [polling, setPolling] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      createPayment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized]);

  const handleTimeExpired = useCallback(async () => {
    try {
      console.log("⏰ Hết thời gian thanh toán, đang kiểm tra...");
      
      if (!paymentData?.paymentId) {
        console.warn("⚠️ Không có paymentId");
        return;
      }

      const statusRes = await fetch(`${API_URL}/api/payos/${paymentData.paymentId}/status`);
      
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        console.log("📊 Status check:", statusData.status);
        
        if (statusData.status === "PARTIALLY_PAID" || statusData.status === "PAID") {
          console.log("✅ Đã thanh toán, không hủy");
          onPaymentSuccess();
          return;
        }
      }

      console.log("❌ Chưa thanh toán, đang hủy booking...");
      
      try {
        const cancelPaymentRes = await fetch(`${API_URL}/api/payos/${paymentData.paymentId}/cancel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
        
        if (cancelPaymentRes.ok) {
          console.log("✅ Đã hủy payment link trên PayOS");
        } else {
          console.warn("⚠️ Không thể hủy payment link, tiếp tục hủy booking");
        }
      } catch (error) {
        console.error("❌ Lỗi khi hủy payment link:", error);
      }
      
      const cancelRes = await fetch(`${API_URL}/api/bookings/updateBookingStatus/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" })
      });

      if (cancelRes.ok) {
        console.log("✅ Đã hủy booking thành công");
        alert("Hết thời gian thanh toán. Booking và mã QR đã bị hủy.");
        onClose();
      } else {
        console.error("❌ Lỗi khi hủy booking:", await cancelRes.text());
      }
    } catch (error) {
      console.error("❌ Error handling time expired:", error);
    }
  }, [paymentData, bookingId, onPaymentSuccess, onClose]);

  useEffect(() => {
    if (!paymentData) return;

    const deadline = new Date(paymentData.deadline).getTime();
    const now = Date.now();
    const diff = Math.floor((deadline - now) / 1000);
    setTimeLeft(diff > 0 ? diff : 0);

    const timer = setInterval(() => {
      const newDiff = Math.floor((deadline - Date.now()) / 1000);
      if (newDiff <= 0) {
        clearInterval(timer);
        setTimeLeft(0);
        handleTimeExpired();
      } else {
        setTimeLeft(newDiff);
      }
    }, 1000);

    return () => {
      console.log("🧹 Cleanup timer");
      clearInterval(timer);
    };
  }, [paymentData, handleTimeExpired]);

  const createPayment = async () => {
    setLoading(true);
    try {    
      const res = await fetch(`${API_URL}/api/payos/create-payos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          paymentType: "DEPOSIT"
        })
      });

      if (!res.ok) {
        const error = await res.json();
        if (error.existingPaymentId) {
          const existingRes = await fetch(`${API_URL}/api/payos/${error.existingPaymentId}/status`);
          
          if (existingRes.ok) {
            const existingData = await existingRes.json();
            const depositAmount = existingData.booking?.depositAmount || 0;
            
            const paymentData: PaymentData = {
              success: true,
              paymentId: existingData.paymentId,
              orderCode: existingData.orderCode,
              checkoutUrl: existingData.paymentUrl,
              qrCode: existingData.qrCodeUrl,
              deadline: existingData.deadLine,
              amount: depositAmount,
              paymentType: "DEPOSIT",
              totalPaid: existingData.totalPaid || 0,
              totalPrice: existingData.booking?.totalPrice || 0,
              remainingAmount: existingData.remainingAmount || 0
            };
            
            setPaymentData(paymentData);
            startPolling(existingData.paymentId);
            setLoading(false);
            return;
          }
        }
        
        throw new Error(error.message || "Lỗi tạo thanh toán");
      }

      const data = await res.json();
      setPaymentData(data);
      startPolling(data.paymentId);
    } catch (error: any) {
      console.error("❌ Create payment error:", error);
      alert("Không thể tạo thanh toán: " + error.message);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (paymentId: string) => {
    setPolling(true);
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/api/payos/${paymentId}/status`);
                
        if (!res.ok) {
          console.warn("⚠️ Polling failed with status:", res.status);
          return;
        }

        const data = await res.json();
    
        if (data.status === "PARTIALLY_PAID" || data.status === "PAID") {
          clearInterval(interval);
          setPolling(false);
          onPaymentSuccess();
        }
      } catch (error) {
        console.error("❌ Polling error:", error);
      }
    }, 3000);

    setTimeout(() => {
      clearInterval(interval);
      setPolling(false);
      console.log("⏱️ Polling timeout after 2 minutes");
    }, 120000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tạo thanh toán...</p>
        </div>
      </div>
    );
  }

  if (!paymentData) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-center mb-6">Thanh toán đặt cọc</h2>

        {timeLeft > 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-800 font-medium">
              Thời gian còn lại: {formatTime(timeLeft)}
            </span>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <span className="text-red-800 font-medium">Đã hết thời gian thanh toán</span>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4 mb-2">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Mã đơn hàng:</span>
            <span className="font-mono font-bold">{paymentData.orderCode}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Số tiền cọc:</span>
            <span className="font-bold text-green-600">{paymentData.amount.toLocaleString()} VNĐ</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Tổng tiền:</span>
            <span className="font-bold">{paymentData.totalPrice.toLocaleString()} VNĐ</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Còn lại:</span>
            <span className="font-bold text-orange-600">{paymentData.remainingAmount.toLocaleString()} VNĐ</span>
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-lg p-4 mb-2">
          <div className="flex items-center gap-2 mb-2">
            <QrCode className="w-5 h-5 text-blue-600" />
            <span className="font-medium">Quét mã QR để thanh toán</span>
          </div>
          <div className="flex justify-center">
            {paymentData.qrCode ? (
              <div className="p-2 bg-white rounded-lg">
                <QRCodeSVG 
                  value={paymentData.qrCode} 
                  size={256}
                  level="H"
                  includeMargin={true}
                />
              </div>
            ) : (
              <div className="w-64 h-64 flex flex-col items-center justify-center bg-gray-100 rounded">
                <p className="text-gray-500 text-sm mb-2">QR Code không khả dụng</p>
                <p className="text-xs text-gray-400">Vui lòng dùng link bên dưới</p>
              </div>
            )}
          </div>
        </div>

        <a
          href={paymentData.checkoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors mb-3"
        >
          <CreditCard className="w-5 h-5" />
          Thanh toán qua trình duyệt
        </a>

        {polling && (
          <div className="text-center text-sm text-gray-500">
            <div className="inline-flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Đang kiểm tra thanh toán...
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 text-center mt-4">
          Sau khi thanh toán, hệ thống sẽ tự động cập nhật trong vòng 3 giây
        </p>
      </div>
    </div>
  );
}
