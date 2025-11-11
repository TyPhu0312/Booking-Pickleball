"use client";
import { mockBookings } from "@/lib/data";
import { format, set } from "date-fns";
import { el, se } from "date-fns/locale";
import { Edit, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface Booking {
  bookingID: string;
  user?: { full_name: string } | null;
  phone_user?: string | null;
  booking_date: string;
  slot: string;
  status: "PENDING" | "CONFIRMED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED";
  total_price: number;
  deposit_amount: number;
  booking_type: string;
  discount: number;
  court?: { name: string, courtID: string } | null;
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

export default function HistoryPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<"group" | "detail">("group");


  useEffect(() => {
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/bookings/getBookingByUserIdOrPhone/${user?.userID}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error("Lỗi khi lấy lịch sử đặt slot:", error);
    }
  };

  useEffect(() => {
    if (user?.userID) {
      fetchBookings();
      setLoading(false);
    }
  }, [user?.userID]);


  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedBooking(null);
  };

  const handleCancelBooking = async (bookingID: string) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/bookings/delete/${bookingID}`,
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
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {(() => {
                    if (!booking.bookingSlots || booking.bookingSlots.length === 0) return "—";

                    const startTimes = booking.bookingSlots.map(bs => bs.slot.start_time);
                    const endTimes = booking.bookingSlots.map(bs => bs.slot.end_time);

                    const earliest = startTimes.sort()[0];
                    const latest = endTimes.sort().reverse()[0];

                    return `${earliest.slice(0, 5)} - ${latest.slice(0, 5)}`;
                  })()}
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
                          "bg-yellow-100 text-yellow-800"
                    }`}>
                    {booking.status === "CONFIRMED" ? "Đã xác nhận" :
                      booking.status === "COMPLETED" ? "Hoàn thành" :
                        booking.status === "CHECKED_IN" ? "Đã check-in" :
                          booking.status === "CANCELLED" ? "Đã hủy" : "Chờ xác nhận"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <button
                    className="text-blue-600 hover:text-blue-900 m-2 "
                    onClick={() => handleViewDetails(booking)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                  </button>

                  {booking.status === "PENDING" && (
                    <button
                      onClick={() => handleCancelBooking(booking.bookingID)}
                      className="text-red-600 hover:text-red-800 m-2"
                    >
                      Hủy
                    </button>
                  )}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
              onClick={handleCloseModal}
            >
              ✕
            </button>

            <h2 className="text-2xl font-semibold mb-4">Chi tiết đặt sân</h2>

            <p><strong>Loại đặt:</strong> {selectedBooking.booking_type === "WEEKLY" ? "Đặt theo tuần" :
              selectedBooking.booking_type === "CASUAL" ? "Đặt lẻ" : "Giải đấu"}</p>

            <p><strong>Trạng thái:</strong> {selectedBooking.status}</p>
            <p><strong>Ngày đặt:</strong> {format(selectedBooking.booking_date, "dd-MM-yyyy")}</p>



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
                          <div key={i} className="border p-2 rounded mb-2 bg-gray-50">
                            <p><strong>Đặt hằng tuần:</strong> {dayLabel}</p>
                            <p><strong>Giờ:</strong> {earliest.slice(0, 5)} - {latest.slice(0, 5)}</p>
                            <p><strong>Số tuần:</strong> {firstSlot.num_weeks}</p>
                            <p className="text-sm text-gray-600 mt-1">Các ngày dự kiến:</p>
                            <ul className="list-disc ml-5 text-sm">
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
                        <div key={idx} className="border p-2 rounded mb-2 bg-gray-50">
                          <p><strong>Ngày:</strong> {format(selectedBooking.booking_date, "dd-MM-yyyy")}</p>
                          <p><strong>Giờ:</strong> {`${bs.slot.start_time.slice(0, 5)} - ${bs.slot.end_time.slice(0, 5)}`}</p>
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
                          <div key={i} className="border p-2 rounded mb-2 bg-gray-50">
                            <p><strong>{dayLabel}</strong></p>
                            <ul className="list-disc ml-5 text-sm">
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
                        <div className="border p-2 rounded mb-2 bg-gray-50">
                          <p><strong>Ngày: </strong> {format(selectedBooking.booking_date, "dd-MM-yyyy")}</p>
                          <p><strong>Giờ: </strong>
                            {(() => {
                              const startTimes = selectedBooking.bookingSlots.map(bs => bs.slot.start_time).sort();
                              const endTimes = selectedBooking.bookingSlots.map(bs => bs.slot.end_time).sort().reverse();
                              return `${startTimes[0].slice(0, 5)} - ${endTimes[0].slice(0, 5)}`;
                            })()}
                          </p>
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

    </div>


  );
}