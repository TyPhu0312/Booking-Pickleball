"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { XCircle } from "lucide-react";

export default function PaymentCancelledPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");

  useEffect(() => {
    if (!bookingId) {
      router.push("/");
    }
  }, [bookingId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-red-50 to-orange-50">
      <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full text-center">
        <XCircle className="w-20 h-20 text-red-600 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          Thanh toán đã bị hủy
        </h1>
        <p className="text-gray-600 mb-6">
          Bạn đã hủy thanh toán. Booking của bạn vẫn ở trạng thái chờ thanh toán.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            Bạn có thể thanh toán lại trong trang lịch sử booking
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/history")}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Xem booking
          </button>
          <button
            onClick={() => router.push("/bookings")}
            className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Đặt lại
          </button>
        </div>
      </div>
    </div>
  );
}
