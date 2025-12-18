"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!bookingId) {
      router.push("/");
      return;
    }

    setTimeout(() => {
      setChecking(false);
      setTimeout(() => {
        router.push("/history");
        toast.success("Thanh toán thành công!");
      }, 2000);
    }, 2000);
  }, [bookingId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-green-50 to-blue-50">
      <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full text-center">
        {checking ? (
          <>
            <Loader2 className="w-20 h-20 text-blue-600 mx-auto mb-6 animate-spin" />
            <h1 className="text-2xl font-bold text-gray-800 mb-3">
              Đang xác nhận thanh toán...
            </h1>
            <p className="text-gray-600">
              Vui lòng đợi trong giây lát
            </p>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-20 h-20 text-green-600 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-800 mb-3">
              Thanh toán thành công!
            </h1>
            <p className="text-gray-600 mb-6">
              Booking của bạn đã được xác nhận
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                Đang chuyển đến trang lịch sử booking...
              </p>
            </div>
            <button
              onClick={() => router.push("/history")}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Xem ngay
            </button>
          </>
        )}
      </div>
    </div>
  );
}
