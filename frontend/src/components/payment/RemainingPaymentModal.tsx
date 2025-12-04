/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { X, Clock, QrCode, CreditCard } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { API_URL } from "@/lib/config";

interface RemainingPaymentModalProps {
  bookingId: string;
  remainingAmount: number;
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

export default function RemainingPaymentModal({ 
  bookingId, 
  remainingAmount,
  onClose, 
  onPaymentSuccess 
}: RemainingPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    createPayment();
  }, []);

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
      } else {
        setTimeLeft(newDiff);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentData]);

  const createPayment = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/payos/create-payos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          paymentType: "REMAINING"
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Lỗi tạo thanh toán");
      }

      const data = await res.json();
      setPaymentData(data);
      startPolling(data.paymentId);
    } catch (error: any) {
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
        
        if (data.status === "PAID") {
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-center mb-6">Thanh toán phần còn lại</h2>

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

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Mã đơn hàng:</span>
            <span className="font-mono font-bold">{paymentData.orderCode}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Số tiền cần trả:</span>
            <span className="font-bold text-orange-600">{paymentData.amount.toLocaleString()} VNĐ</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Đã thanh toán:</span>
            <span className="font-bold text-green-600">{paymentData.totalPaid.toLocaleString()} VNĐ</span>
          </div>
          <div className="flex justify-between border-t pt-2 mt-2">
            <span className="text-gray-600 font-medium">Tổng tiền:</span>
            <span className="font-bold text-lg">{paymentData.totalPrice.toLocaleString()} VNĐ</span>
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <QrCode className="w-5 h-5 text-blue-600" />
            <span className="font-medium">Quét mã QR để thanh toán</span>
          </div>
          <div className="flex justify-center">
            {paymentData.qrCode ? (
              <div className="p-4 bg-white rounded-lg">
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
          Sau khi thanh toán đủ, trạng thái booking sẽ được cập nhật
        </p>
      </div>
    </div>
  );
}
