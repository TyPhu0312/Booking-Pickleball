/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { API_URL } from '@/lib/config';

interface RefundRequest {
  paymentID: string;
  booking_id: string;
  refund_amount: number;
  refund_percentage: number;
  refund_status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  refund_reason?: string;
  admin_note?: string;
  refund_date: string;
  processed_date?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_owner?: string;
  booking?: {
    bookingID: string;
    booking_date: string;
    status: string;
    deposit_amount: number;
    total_price: number;
    court?: {
      name: string;
      type: string;
    };
    user?: {
      full_name: string;
      phone: string;
    };
  };
}

interface User {
  userID: string;
  full_name: string;
  phone?: string | null;
}

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);

  useEffect(() => {
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    const fetchRefunds = async () => {
      if (!user?.userID) {
        console.log("❌ Không có user ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("🔍 Fetching refunds for user:", user.userID);
        
        const response = await fetch(
          `${API_URL}/api/refunds/requests?userId=${user.userID}`
        );
        
        if (!response.ok) {
          console.error("❌ Failed to fetch refunds:", response.status);
          setLoading(false);
          return;
        }

        const data = await response.json();
        console.log("✅ Refunds fetched:", data.length, "items");
        console.log("📋 Refunds data:", data);
        
        setRefunds(data);
      } catch (error) {
        console.error("❌ Error fetching refunds:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.userID) {
      fetchRefunds();
    }
  }, [user?.userID]);

  const filteredRefunds = refunds.filter(refund => {
    if (filter === "ALL") return true;
    return refund.refund_status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            🕐 Chờ duyệt
          </span>
        );
      case "APPROVED":
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            ✓ Đã duyệt
          </span>
        );
      case "REJECTED":
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            ✕ Từ chối
          </span>
        );
      case "COMPLETED":
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
            💰 Đã hoàn tiền
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-600">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          💸 Lịch Sử Hoàn Tiền
        </h1>
        <p className="text-gray-600 mb-8">
          Theo dõi các yêu cầu hoàn tiền của bạn
        </p>

        {refunds.length > 0 && (
          <div className="mt-8 bg-linear-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-lg font-semibold mb-4">📊 Tổng quan</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-sm opacity-90 mb-1">Tổng số yêu cầu</p>
                <p className="text-3xl font-bold">{refunds.length}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-sm opacity-90 mb-1">Đã nhận tiền</p>
                <p className="text-3xl font-bold">
                  {refunds.filter(r => r.refund_status === "COMPLETED").length}
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-sm opacity-90 mb-1">Tổng tiền đã hoàn</p>
                <p className="text-2xl font-bold">
                  {refunds
                    .filter(r => r.refund_status === "COMPLETED")
                    .reduce((sum, r) => sum + r.refund_amount, 0)
                    .toLocaleString()}đ
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "ALL"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Tất cả ({refunds.length})
            </button>
            <button
              onClick={() => setFilter("PENDING")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "PENDING"
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Chờ duyệt ({refunds.filter(r => r.refund_status === "PENDING").length})
            </button>
            <button
              onClick={() => setFilter("APPROVED")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "APPROVED"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Đã duyệt ({refunds.filter(r => r.refund_status === "APPROVED").length})
            </button>
            <button
              onClick={() => setFilter("COMPLETED")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "COMPLETED"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Đã hoàn tiền ({refunds.filter(r => r.refund_status === "COMPLETED").length})
            </button>
            <button
              onClick={() => setFilter("REJECTED")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "REJECTED"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Từ chối ({refunds.filter(r => r.refund_status === "REJECTED").length})
            </button>
          </div>
        </div>

        {filteredRefunds.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Chưa có yêu cầu hoàn tiền
            </h3>
            <p className="text-gray-600">
              {filter === "ALL" 
                ? "Bạn chưa có yêu cầu hoàn tiền nào"
                : `Không có yêu cầu hoàn tiền ở trạng thái này`
              }
            </p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden bg-white">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sân</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiền cọc</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">% Hoàn</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiền hoàn</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngân hàng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày YC</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRefunds.map((refund) => (
                  <tr key={refund.paymentID} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">
                      {refund.booking?.court?.name || "Chưa phân bố"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {refund.booking?.deposit_amount?.toLocaleString() || "0"}đ
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="font-bold text-green-600">
                        {refund.refund_percentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">
                      {refund.refund_amount.toLocaleString()}đ
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <div className="font-medium">{refund.bank_name}</div>
                        <div className="text-gray-500 text-xs">{refund.bank_account_number}</div>
                        <div className="text-gray-500 text-xs">{refund.bank_account_owner}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {getStatusBadge(refund.refund_status)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {format(new Date(refund.refund_date), "dd/MM/yyyy HH:mm")}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => setSelectedRefund(refund)}
                        className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
            ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedRefund && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-linear-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Chi Tiết Hoàn Tiền</h2>
                    <p className="text-blue-100 text-sm mt-1">
                      Mã booking: {selectedRefund.booking_id}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedRefund(null)}
                    className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex justify-center">
                  {getStatusBadge(selectedRefund.refund_status)}
                </div>

                <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="text-2xl">🏟️</span>
                    Thông tin đặt sân
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Tên sân</p>
                      <p className="font-semibold text-gray-800">
                        {selectedRefund.booking?.court?.name || "Chưa phân bố"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Loại sân</p>
                      <p className="font-semibold text-gray-800">
                        {selectedRefund.booking?.court?.type === "INDOOR" ? "Trong nhà" : "Ngoài trời"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Ngày đặt sân</p>
                      <p className="font-semibold text-gray-800">
                        {selectedRefund.booking?.booking_date 
                          ? format(new Date(selectedRefund.booking.booking_date), "dd/MM/yyyy")
                          : "N/A"
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Trạng thái booking</p>
                      <p className="font-semibold text-gray-800">
                        {selectedRefund.booking?.status || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="text-2xl">💰</span>
                    Thông tin thanh toán
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Tiền cọc</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedRefund.booking?.deposit_amount?.toLocaleString() || "0"}đ
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Tổng tiền</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {selectedRefund.booking?.total_price?.toLocaleString() || "0"}đ
                      </p>
                    </div>
                    <div className="bg-green-100 rounded-lg p-3 border-2 border-green-300">
                      <p className="text-xs text-green-700 mb-1">Phần trăm hoàn</p>
                      <p className="text-2xl font-bold text-green-700">
                        {selectedRefund.refund_percentage}%
                      </p>
                    </div>
                    <div className="bg-green-100 rounded-lg p-3 border-2 border-green-300">
                      <p className="text-xs text-green-700 mb-1">Số tiền hoàn</p>
                      <p className="text-2xl font-bold text-green-700">
                        {selectedRefund.refund_amount.toLocaleString()}đ
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="text-2xl">🏦</span>
                    Thông tin ngân hàng nhận tiền
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-white rounded-lg p-3">
                      <span className="text-sm text-gray-600">Ngân hàng</span>
                      <span className="font-semibold text-gray-800">{selectedRefund.bank_name}</span>
                    </div>
                    <div className="flex items-center justify-between bg-white rounded-lg p-3">
                      <span className="text-sm text-gray-600">Số tài khoản</span>
                      <span className="font-mono font-semibold text-gray-800">{selectedRefund.bank_account_number}</span>
                    </div>
                    <div className="flex items-center justify-between bg-white rounded-lg p-3">
                      <span className="text-sm text-gray-600">Chủ tài khoản</span>
                      <span className="font-semibold text-gray-800">{selectedRefund.bank_account_owner}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="text-2xl">📅</span>
                    Thời gian
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Ngày yêu cầu hoàn tiền</p>
                        <p className="font-semibold text-gray-800">
                          {format(new Date(selectedRefund.refund_date), "dd/MM/yyyy HH:mm")}
                        </p>
                      </div>
                    </div>
                    {selectedRefund.processed_date && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">Ngày xử lý</p>
                          <p className="font-semibold text-gray-800">
                            {format(new Date(selectedRefund.processed_date), "dd/MM/yyyy HH:mm")}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {selectedRefund.refund_reason && (
                  <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <span className="text-2xl">📝</span>
                      Lý do hủy sân
                    </h3>
                    <p className="text-gray-700 leading-relaxed bg-white p-4 rounded-lg">
                      {selectedRefund.refund_reason}
                    </p>
                  </div>
                )}

                {selectedRefund.refund_status === "REJECTED" && selectedRefund.admin_note && (
                  <div className="bg-red-50 rounded-xl p-5 border-2 border-red-300">
                    <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                      <span className="text-2xl">❌</span>
                      Lý do từ chối
                    </h3>
                    <p className="text-red-700 leading-relaxed bg-white p-4 rounded-lg">
                      {selectedRefund.admin_note}
                    </p>
                  </div>
                )}

                {(selectedRefund.refund_status === "APPROVED" || selectedRefund.refund_status === "COMPLETED") && selectedRefund.admin_note && (
                  <div className="bg-blue-50 rounded-xl p-5 border border-blue-300">
                    <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                      <span className="text-2xl">📌</span>
                      Ghi chú từ admin
                    </h3>
                    <p className="text-blue-700 leading-relaxed bg-white p-4 rounded-lg">
                      {selectedRefund.admin_note}
                    </p>
                  </div>
                )}
                {selectedRefund.refund_status === "PENDING" && (
                  <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-300 flex items-start gap-3">
                    <span className="text-2xl">⏳</span>
                    <div>
                      <p className="font-semibold text-yellow-800">Đang chờ xử lý</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Yêu cầu hoàn tiền của bạn đang được admin xem xét và sẽ được xử lý sớm nhất có thể.
                      </p>
                    </div>
                  </div>
                )}

                {selectedRefund.refund_status === "APPROVED" && (
                  <div className="bg-green-50 rounded-xl p-4 border border-green-300 flex items-start gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="font-semibold text-green-800">Đã được duyệt</p>
                      <p className="text-sm text-green-700 mt-1">
                        Yêu cầu hoàn tiền đã được chấp nhận. Tiền sẽ được chuyển vào tài khoản của bạn trong 1-3 ngày làm việc.
                      </p>
                    </div>
                  </div>
                )}

                {selectedRefund.refund_status === "COMPLETED" && (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-300 flex items-start gap-3">
                    <span className="text-2xl">💰</span>
                    <div>
                      <p className="font-semibold text-blue-800">Đã hoàn tiền thành công</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Tiền đã được chuyển vào tài khoản ngân hàng của bạn. Vui lòng kiểm tra tài khoản.
                      </p>
                    </div>
                  </div>
                )}

                {selectedRefund.refund_status === "REJECTED" && (
                  <div className="bg-red-50 rounded-xl p-4 border border-red-300 flex items-start gap-3">
                    <span className="text-2xl">❌</span>
                    <div>
                      <p className="font-semibold text-red-800">Yêu cầu bị từ chối</p>
                      <p className="text-sm text-red-700 mt-1">
                        Yêu cầu hoàn tiền của bạn đã bị từ chối. Vui lòng xem lý do bên trên.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl border-t">
                <button
                  onClick={() => setSelectedRefund(null)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
