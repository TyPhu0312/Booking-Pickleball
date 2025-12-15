/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { X, Calendar, Clock, DollarSign, CheckCircle2, XCircle, AlertCircle, User, Phone, MapPin } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/config";
import { toast } from "sonner";

interface ViewInforPaymentModalProps {
  bookingId: string;
  onClose: () => void;
}

interface Payment {
  paymentID: string;
  payment_method: string;
  status: string;
  paid_amount: number;
  order_code: number | null;
  payment_url: string | null;
  qr_code_url: string | null;
  payment_deadline: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BookingDetail {
  bookingID: string;
  booking_date: string;
  status: string;
  total_price: number;
  deposit_amount: number;
  booking_type: string;
  discount: number;
  note: string | null;
  user?: {
    full_name: string;
    phone: string;
    email: string;
  } | null;
  phone_user?: string | null;
  court: {
    courtID: string;
    name: string;
    type: string;
  };
  bookingSlots: {
    date: string;
    slot: {
      slotID: string;
      slot_name: string;
      start_time: string;
      end_time: string;
      price: number;
    };
    is_recurring: boolean;
    recurring_day: number | null;
    num_weeks: number | null;
  }[];
  payments: Payment[];
}

export default function ViewInforPaymentModal({ bookingId, onClose }: ViewInforPaymentModalProps) {
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalPaid, setTotalPaid] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(0);

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {  
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/bookings/getBookingById/${bookingId}`);
      if (!res.ok) throw new Error("Không thể lấy thông tin booking");
      
      const data = await res.json();
      setBooking(data);

      const paid = data.payments.reduce((sum: number, p: Payment) => {
        if (p.status === "PARTIALLY_PAID" || p.status === "PAID") {
          return sum + (p.paid_amount || 0);
        }
        return sum;
      }, 0);

      setTotalPaid(paid);
      setRemainingAmount(data.total_price - paid);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin booking:", error);
      toast.error("Không thể lấy thông tin booking");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3" />
            Đã thanh toán
          </span>
        );
      case "PARTIALLY_PAID":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <DollarSign className="w-3 h-3" />
            Thanh toán 1 phần
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3" />
            Chờ thanh toán
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            Thất bại
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
            <XCircle className="w-3 h-3" />
            Đã hủy
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
            <AlertCircle className="w-3 h-3" />
            Hết hạn
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      CASH: "💵 Tiền mặt",
      PAYOS: "💳 PayOS",
      BANK_TRANSFER: "🏦 Chuyển khoản",
      MOMO: "🟣 MoMo",
      ZALO_PAY: "💙 ZaloPay",
      VNPAY: "🔴 VNPay",
      CREDIT_CARD: "💳 Thẻ tín dụng",
    };
    return methods[method] || method;
  };

  const VAT_RATE = 0.08;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  const priceBeforeVAT = Math.round(booking.total_price / (1 + VAT_RATE));
  const vatAmount = booking.total_price - priceBeforeVAT;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-black text-gray-800">Chi Tiết Booking & Thanh Toán</h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Thông Tin Khách Hàng
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-600">Tên khách hàng</p>
                  <p className="font-semibold text-gray-900">
                    {booking.user?.full_name || "Khách vãng lai"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-600">Số điện thoại</p>
                  <p className="font-semibold text-gray-900">
                    {booking.user?.phone || booking.phone_user || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-600" />
              Thông Tin Đặt Sân
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Sân</p>
                <p className="font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  {booking.court?.name || "N/A"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  ({booking.court?.type === "INDOOR" ? "Trong nhà" : "Ngoài trời"})
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Loại booking</p>
                <p className="font-semibold text-gray-900">
                  {booking.booking_type === "CASUAL" ? "🎾 Thường" :
                    booking.booking_type === "WEEKLY" ? "📅 Theo tuần" :
                      "🏆 Giải đấu"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Ngày đặt</p>
                <p className="font-semibold text-gray-900">
                  {format(new Date(booking.booking_date), "dd/MM/yyyy HH:mm")}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs text-gray-600 mb-2">Danh sách khung giờ:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {booking.bookingSlots.map((bs, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-gray-900">
                          {bs.slot.slot_name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {format(new Date(bs.date), "dd/MM/yyyy", { locale: vi })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {bs.slot.start_time} - {bs.slot.end_time}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {bs.slot.price.toLocaleString()}đ
                        </p>
                        {bs.is_recurring && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded mt-1 inline-block">
                            Lặp {bs.num_weeks} tuần
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {booking.note && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Ghi chú:</p>
                <p className="text-sm text-gray-900">{booking.note}</p>
              </div>
            )}
          </div>

          <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200">
            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              Chi Tiết Giá
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Giá dịch vụ (chưa VAT):</span>
                <span className="font-semibold text-gray-900">{priceBeforeVAT.toLocaleString()}đ</span>
              </div>
              {booking.discount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Giảm giá ({booking.discount}%):</span>
                  <span className="font-semibold text-red-600">
                    -{Math.round((priceBeforeVAT * booking.discount) / 100).toLocaleString()}đ
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">VAT (8%):</span>
                <span className="font-semibold text-amber-600">+{vatAmount.toLocaleString()}đ</span>
              </div>
              <div className="h-px bg-purple-300"></div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">Tổng tiền:</span>
                <span className="font-black text-2xl text-purple-600">{booking.total_price.toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">Tiền cọc yêu cầu:</span>
                <span className="font-black text-xl text-pink-600">{booking.deposit_amount.toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">Đã thanh toán:</span>
                <span className="font-black text-xl text-green-600">{totalPaid.toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">Còn phải thu:</span>
                <span className="font-black text-xl text-orange-600">{remainingAmount.toLocaleString()}đ</span>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-600 text-white rounded-xl font-bold hover:bg-gray-700 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
