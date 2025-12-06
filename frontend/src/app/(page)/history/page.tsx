/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, set } from "date-fns";
import { Edit, Trash2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import PaymentModal from "@/components/payment/PaymentModal";
import { API_URL } from '@/lib/config';

interface Booking {
  bookingID: string;
  user?: { full_name: string } | null;
  phone_user?: string | null;
  booking_date: string;
  slot: string;
  status: "PENDING" | "CONFIRMED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED" | "CANCEL_REQUESTED";
  total_price: number;
  deposit_amount: number;
  booking_type: string;
  discount: number;
  court?: Courts| null;
  bookingSlots: {
    date: string;
    slot: {
      start_time: string;
      end_time: string
    };
    is_recurring: boolean;
    recurring_day: number | null;
    num_weeks: number | null;
  }[];
}
interface User {
  userID: string;
  full_name: string;
  email: string;
  role: {
    roleID: string;
    name: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
  };
  phone?: string | null;
  address?: string | null;
  bank_account_number?: string | null;
  bank_account_owner?: string | null;
  bank_name?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface Courts {
  courtID: string;
  name: string;
  type: string;
  status: string;
  multiplier: number;
  image?: string | null;
}

export default function HistoryPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<"group" | "detail">("group");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentBookingId, setPaymentBookingId] = useState<string | null>(null);
  const [bookingPayments, setBookingPayments] = useState<Record<string, any>>({});
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundBookingId, setRefundBookingId] = useState<string | null>(null);
  const [refundForm, setRefundForm] = useState({
    cancel_reason: "",
    bank_name: "",
    bank_account_number: "",
    bank_account_owner: ""
  });


  useEffect(() => {
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    if (!user?.userID) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/api/bookings/getBookingByUserIdOrPhone/${user.userID}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Bookings data:", data);
        setBookings(data);
      } else {
        console.error("API response not OK:", response.status);
      }
    } catch (error) {
      console.error("Lỗi khi lấy lịch sử đặt slot:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.userID]);

  useEffect(() => {
    if (user?.userID) {
      fetchBookings();
    }
  }, [user?.userID, fetchBookings]);

  useEffect(() => {
    const fetchAllPayments = async () => {
      if (bookings.length === 0) return;
      
      const paymentsData: Record<string, any> = {};
      for (const booking of bookings) {
        try {
          const res = await fetch(`${API_URL}/api/payos/booking/${booking.bookingID}`);
          if (res.ok) {
            const data = await res.json();
            paymentsData[booking.bookingID] = data;
          }
        } catch (error) {
          console.error(`Lỗi khi lấy payment cho booking ${booking.bookingID}:`, error);
        }
      }
      setBookingPayments(paymentsData);
    };

    fetchAllPayments();
  }, [bookings]);


  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedBooking(null);
  };

  const handleCancelBooking = async (bookingID: string) => {
     if (!confirm("Bạn có chắc muốn hủy đặt sân này không?")) return;
    try {
      const response = await fetch(
        `${API_URL}/api/bookings/delete/${bookingID}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        alert("Hủy đặt sân thành công.");
        fetchBookings();
      } else {
        alert("Hủy đặt sân thất bại.");
      }
    } catch (error) {
      console.error("Lỗi khi hủy đặt sân:", error);
    }
  };

  const handleRequestRefund = async () => {
    if (!refundBookingId) return;

    if (!refundForm.cancel_reason || !refundForm.bank_name || 
        !refundForm.bank_account_number || !refundForm.bank_account_owner) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    try {
      console.log("Gửi yêu cầu hoàn tiền với dữ liệu:", refundForm);
      const response = await fetch(
        `${API_URL}/api/refunds/request-cancel/${refundBookingId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(refundForm),
        }
      );

      const data = await response.json();

      if (response.ok) {
        const refundAmount = data.refundAmount || data.refund_amount || 0;
        const refundPercentage = data.refundPercentage || data.refund_percentage || 0;
        alert(`Yêu cầu hoàn tiền thành công!\nSố tiền hoàn: ${refundAmount.toLocaleString()}đ (${refundPercentage}%)`);
        setShowRefundModal(false);
        setRefundBookingId(null);
        setRefundForm({
          cancel_reason: "",
          bank_name: "",
          bank_account_number: "",
          bank_account_owner: ""
        });
        fetchBookings();
      } else {
        alert(data.message || "Yêu cầu hoàn tiền thất bại");
      }
    } catch (error) {
      console.error("Lỗi khi yêu cầu hoàn tiền:", error);
      alert("Có lỗi xảy ra khi gửi yêu cầu");
    }
  };


  if (loading) {
    return <div>Đang tải...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-center mb-8">Lịch Sử Đặt Slot</h1>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giờ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại đặt sân</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng Thái</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bookings.map((booking) => (
              <tr key={booking.bookingID}>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{format(booking.booking_date, "dd-MM-yyyy")}</td>
                <td className="px-6 py-6 text-sm">
                  {booking.bookingSlots && booking.bookingSlots.length > 0 ? (
                    <ul className="space-y-1">
                      {booking.bookingSlots.map((bs, idx) => (
                        <li key={idx}>
                          {format(new Date(bs.date), "dd/MM")} - {bs.slot.start_time.slice(0, 5)} ~ {bs.slot.end_time.slice(0, 5)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "—"
                  )}
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {booking.booking_type === "CASUAL" ? "Đặt lẻ" :
                    booking.booking_type === "WEEKLY" ? "Đặt theo tuần" :
                      "Đặt cho giải đấu"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${booking.status === "CONFIRMED" ? "bg-green-100 text-green-800" :
                    booking.status === "CANCELLED" ? "bg-red-100 text-red-800" :
                      booking.status === "COMPLETED" ? "bg-blue-100 text-blue-800" :
                        booking.status === "CHECKED_IN" ? "bg-purple-100 text-purple-800" :
                          booking.status === "CANCEL_REQUESTED" ? "bg-orange-100 text-orange-800" :
                          "bg-yellow-100 text-yellow-800"
                    }`}>
                    {booking.status === "CONFIRMED" ? "Đã xác nhận" :
                      booking.status === "COMPLETED" ? "Hoàn thành" :
                        booking.status === "CHECKED_IN" ? "Đã check-in" :
                          booking.status === "CANCELLED" ? "Đã hủy" : 
                          booking.status === "CANCEL_REQUESTED" ? "Yêu cầu hủy và hoàn tiền" :
                          "Chờ xác nhận"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center gap-2">
                    <button
                      className="text-blue-600 hover:text-blue-900"
                      onClick={() => handleViewDetails(booking)}
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {booking.status === "PENDING" && (
                      <>
                        {(() => {
                          const paymentInfo = bookingPayments[booking.bookingID];
                          if (!paymentInfo) return null;

                          const hasPending = paymentInfo.hasPendingPayment;
                          const pendingPayment = paymentInfo.pendingPayment;
                          
                          if (hasPending && pendingPayment) {
                            const deadline = new Date(pendingPayment.payment_deadline);
                            const isExpired = deadline < new Date();
                            
                            if (isExpired) {
                              return (
                                <button
                                  onClick={() => {
                                    setPaymentBookingId(booking.bookingID);
                                    setShowPaymentModal(true);
                                  }}
                                  className="text-orange-600 hover:text-orange-800 text-xs font-medium"
                                >
                                  Tạo lại thanh toán
                                </button>
                              );
                            } else {
                              return (
                                <button
                                  onClick={() => {
                                    setPaymentBookingId(booking.bookingID);
                                    setShowPaymentModal(true);
                                  }}
                                  className="text-green-600 hover:text-green-800 text-xs font-medium"
                                >
                                  Tiếp tục thanh toán
                                </button>
                              );
                            }
                          } else {
                            return (
                              <button
                                onClick={() => {
                                  setPaymentBookingId(booking.bookingID);
                                  setShowPaymentModal(true);
                                }}
                                className="text-green-600 hover:text-green-800 text-xs font-medium"
                              >
                                Thanh toán cọc
                              </button>
                            );
                          }
                        })()}
                        
                        <button
                          onClick={() => handleCancelBooking(booking.bookingID)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium"
                        >
                          Hủy
                        </button>
                      </>
                    )}

                    {booking.status === "CONFIRMED" && (
                      <button
                        onClick={() => {
                          setRefundBookingId(booking.bookingID);
                          setShowRefundModal(true);
                        }}
                        className="text-orange-600 hover:text-orange-800 text-xs font-medium"
                      >
                        Yêu cầu hoàn tiền
                      </button>
                    )}
                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPaymentModal && paymentBookingId && (
        <PaymentModal
          bookingId={paymentBookingId}
          onClose={() => {
            setShowPaymentModal(false);
            setPaymentBookingId(null);
          }}
          onPaymentSuccess={() => {
            setShowPaymentModal(false);
            setPaymentBookingId(null);
            fetchBookings();
          }}
        />
      )}

      {showModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
              onClick={handleCloseModal}
            >
              ✕
            </button>

            <div className="max-w-md mx-auto bg-white shadow-lg rounded-xl p-6 space-y-4 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Thông tin đặt sân</h2>

              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Loại đặt:</span>
                <span className="text-gray-800">
                  {selectedBooking.booking_type === "WEEKLY"
                    ? "Đặt theo tuần"
                    : selectedBooking.booking_type === "CASUAL"
                      ? "Đặt lẻ"
                      : "Giải đấu"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Trạng thái:</span>
                <span className="text-gray-800">{selectedBooking.status}</span>
              </div>

              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Ngày đặt:</span>
                <span className="text-gray-800">{format(selectedBooking.booking_date, "dd-MM-yyyy")}</span>
              </div>

              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Loại sân:</span>
                <span className="text-gray-800">
                  {selectedBooking.court?.type === "INDOOR" ? "Trong Nhà" : "Ngoài Trời"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Tên sân:</span>
                <span className="text-yellow-600 font-medium">
                  {selectedBooking.court?.name|| "không xác định"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Tiền cọc:</span>
                <span className="text-green-600 font-medium">
                  {selectedBooking.deposit_amount.toLocaleString()} VNĐ
                </span>
              </div>

              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Tổng tiền:</span>
                <span className="text-red-600 font-bold">
                  {selectedBooking.total_price.toLocaleString()} VNĐ
                </span>
              </div>
            </div>

            <div className="mt-4">
              {selectedBooking.booking_type === "WEEKLY" && (
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Danh sách slot:</h3>
                  <button
                    onClick={() => setViewMode(viewMode === "group" ? "detail" : "group")}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {viewMode === "group" ? "Xem chi tiết từng ngày" : "Xem gộp theo tuần"}
                  </button>
                </div>

              )}



              {(() => {
                const groupedSlots: Record<number, typeof selectedBooking.bookingSlots> = {};

                selectedBooking.bookingSlots.forEach((bs) => {
                  if (bs.is_recurring && bs.recurring_day) {
                    if (!groupedSlots[bs.recurring_day]) groupedSlots[bs.recurring_day] = [];
                    groupedSlots[bs.recurring_day].push(bs);
                  }
                });

                const weeklyGroups = Object.entries(groupedSlots);
                const singleSlots = selectedBooking.bookingSlots.filter((bs) => !bs.is_recurring);

                if (viewMode === "group" && selectedBooking.booking_type === "WEEKLY") {
                  return (
                    <>
                      {weeklyGroups.map(([day, slots], i) => {
                        const firstSlot = slots[0];
                        const earliest = slots.map(s => s.slot.start_time).sort()[0];
                        const latest = slots.map(s => s.slot.end_time).sort().reverse()[0];

                        const jsTargetDay = parseInt(day, 10);

                        const slotsForDay = selectedBooking.bookingSlots.filter(
                          (bs) => bs.is_recurring && bs.recurring_day === parseInt(day)
                        );

                        const startDate = slotsForDay.length
                          ? new Date(Math.min(...slotsForDay.map(bs => new Date(bs.date).getTime())))
                          : new Date(selectedBooking.booking_date);

                        console.log("selectedBooking", startDate);


                        const jsStartDay = startDate.getDay();
                        let offset = (jsTargetDay - jsStartDay + 7) % 7;
                        if (offset === 0) offset = 7;

                        const dayLabel = jsTargetDay === 0 ? "Chủ nhật" : `Thứ ${jsTargetDay + 1}`;

                        return (
                          <div
                            key={i}
                            className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="font-semibold text-gray-800 text-lg">Đặt hằng tuần: {dayLabel}</h3>
                              <span className="text-sm text-gray-500">Số tuần: {firstSlot.num_weeks}</span>
                            </div>

                            <div className="flex justify-between mb-2">
                              <span className="font-medium text-gray-600">Giờ:</span>
                              <span className="text-gray-800">{earliest.slice(0, 5)} - {latest.slice(0, 5)}</span>
                            </div>

                            <p className="text-sm text-gray-500 mb-1">Các ngày dự kiến:</p>
                            <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700">
                              {Array.from({ length: firstSlot.num_weeks || 0 }, (_, idx) => {
                                const date = new Date(startDate);
                                date.setDate(date.getDate() + idx * 7);
                                return <li key={idx}>{format(date, "dd-MM-yyyy")}</li>;
                              })}
                            </ul>
                          </div>

                        );
                      })}

                      {singleSlots.map((bs, idx) => (
                        <div
                          key={idx}
                          className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-3 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between mb-2">
                            <span className="font-medium text-gray-600">Ngày:</span>
                            <span className="text-gray-800">{format(selectedBooking.booking_date, "dd-MM-yyyy")}</span>
                          </div>

                          <div className="flex justify-between">
                            <span className="font-medium text-gray-600">Giờ:</span>
                            <span className="text-gray-800">
                              {`${bs.slot.start_time.slice(0, 5)} - ${bs.slot.end_time.slice(0, 5)}`}
                            </span>
                          </div>
                        </div>
                      ))}

                    </>
                  );
                }
                else if (viewMode === "detail" && selectedBooking.booking_type === "WEEKLY") {
                  return (
                    <>
                      {weeklyGroups.map(([day, slots], i) => {
                        const firstSlot = slots[0];
                        const earliest = slots.map(s => s.slot.start_time).sort()[0];
                        const latest = slots.map(s => s.slot.end_time).sort().reverse()[0];
                        const jsTargetDay = parseInt(day, 10);

                        const slotsForDay = selectedBooking.bookingSlots.filter(
                          (bs) => bs.is_recurring && bs.recurring_day === parseInt(day)
                        );

                        const startDate = slotsForDay.length
                          ? new Date(Math.min(...slotsForDay.map(bs => new Date(bs.date).getTime())))
                          : new Date(selectedBooking.booking_date);

                        console.log("selectedBooking", startDate);


                        const jsStartDay = startDate.getDay();
                        let offset = (jsTargetDay - jsStartDay + 7) % 7;
                        if (offset === 0) offset = 7;

                        const dayLabel = jsTargetDay === 0 ? "Chủ nhật" : `Thứ ${jsTargetDay + 1}`;

                        return (
                          <div
                            key={i}
                            className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-4 hover:shadow-md transition-shadow"
                          >
                            <h4 className="text-gray-800 font-semibold text-lg mb-2">{dayLabel}</h4>
                            <ScrollArea className="h-48 rounded-md border">
                            <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700">
                              {Array.from({ length: firstSlot.num_weeks || 0 }, (_, idx) => {
                                const date = new Date(startDate);
                                date.setDate(date.getDate() + idx * 7);
                                return (
                                  <li key={idx}>
                                    {format(date, "dd-MM-yyyy")} — {earliest.slice(0, 5)} - {latest.slice(0, 5)}
                                  </li>
                                );
                              })}
                            </ul>
                            </ScrollArea>
                          </div>

                        );
                      })}
                    </>
                  );
                }
                else if (selectedBooking.booking_type !== "WEEKLY") {
                  return (
                    <>
                      {selectedBooking.bookingSlots && selectedBooking.bookingSlots.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-3 hover:shadow-md transition-shadow">
                          <h4 className="font-semibold text-gray-800 mb-3">Danh sách slot:</h4>
                          <ScrollArea className="h-48 rounded-md border">
                          <ul className="space-y-2">
                            {selectedBooking.bookingSlots.map((bs, idx) => (
                              <li key={idx} className="flex justify-between items-center border-b pb-2 last:border-0">
                                <span className="text-gray-600">{format(new Date(bs.date), "dd-MM-yyyy")}</span>
                                <span className="font-medium text-gray-800">
                                  {bs.slot.start_time.slice(0, 5)} - {bs.slot.end_time.slice(0, 5)}
                                </span>
                              </li>
                            ))}
                          </ul>
                          </ScrollArea>
                        </div>
                      )}
                    </>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      )}

      {showRefundModal && refundBookingId && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
              onClick={() => {
                setShowRefundModal(false);
                setRefundBookingId(null);
                setRefundForm({
                  cancel_reason: "",
                  bank_name: "",
                  bank_account_number: "",
                  bank_account_owner: ""
                });
              }}
            >
              ✕
            </button>

            <h2 className="text-xl font-bold text-gray-800 mb-4">Yêu cầu hoàn tiền</h2>
            
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                <p className="font-semibold text-yellow-800">Lưu ý chính sách hoàn tiền:</p>
                <ul className="list-disc ml-5 mt-2 text-yellow-700">
                  <li>Trên 2 giờ: Hoàn 100%</li>
                  <li>Từ 1-2 giờ: Hoàn 80%</li>
                  <li>Từ 30 phút - 1 giờ: Hoàn 50%</li>
                  <li>Dưới 30 phút: Không hoàn tiền</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lý do hủy <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={refundForm.cancel_reason}
                  onChange={(e) => setRefundForm({ ...refundForm, cancel_reason: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Nhập lý do hủy đặt sân..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên ngân hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={refundForm.bank_name}
                  onChange={(e) => setRefundForm({ ...refundForm, bank_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: Vietcombank, Techcombank..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số tài khoản <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={refundForm.bank_account_number}
                  onChange={(e) => setRefundForm({ ...refundForm, bank_account_number: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập số tài khoản..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chủ tài khoản <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={refundForm.bank_account_owner}
                  onChange={(e) => setRefundForm({ ...refundForm, bank_account_owner: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tên chủ tài khoản..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleRequestRefund}
                  className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors font-medium"
                >
                  Gửi yêu cầu
                </button>
                <button
                  onClick={() => {
                    setShowRefundModal(false);
                    setRefundBookingId(null);
                    setRefundForm({
                      cancel_reason: "",
                      bank_name: "",
                      bank_account_number: "",
                      bank_account_owner: ""
                    });
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>


  );
}