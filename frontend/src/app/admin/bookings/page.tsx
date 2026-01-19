"use client";

import { useState, useEffect } from "react";
import { Calendar, Plus, Search } from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import BookingCard from "@/components/admin/BookingCard";
import CreateBookingModal from "@/components/admin/CreateBookingModal";
import EditBookingModal from "@/components/admin/EditBookingModal";
import { API_URL } from '@/lib/config';
import {toast} from "sonner";

type BookingStatus = "PENDING" | "CONFIRMED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED" | "CANCEL_REQUESTED";
type CourtType = "INDOOR" | "OUTDOOR";

interface Booking {
  bookingID: string;
  parent_booking_id?: string | null;
  booking_date: string;
  status: BookingStatus;
  total_price: number;
  deposit_amount: number;
  court_type?: CourtType;
  court?: {
    courtID: string;
    name: string;
    type: CourtType;
  } | null;
  user?: {
    userID: string;
    full_name: string;
    phone: string;
  };
  phone_user?: string;
  bookingSlots: {
    slot: {
      slotID: string;
      slot_name: string;
      start_time: string;
      end_time: string;
    };
    date: string;
    is_recurring: boolean;
    recurring_day: number | null;
    num_weeks: number | null;
  }[];
  note?: string;
}

interface Court {
  courtID: string;
  name: string;
  type: CourtType;
}

interface Slot {
  slotID: string;
  slot_name: string;
  start_time: string;
  end_time: string;
  price: number;
}

export default function AdminBookingsPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week">("week");
  const [displayMode, setDisplayMode] = useState<"calendar" | "list" | "status">("calendar");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [searchPhone, setSearchPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "ALL">("ALL");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchBookings(),
          fetchCourts(),
          fetchSlots()
        ]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/bookings`);
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  const fetchCourts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/courts`);
      if (response.ok) {
        const data = await response.json();
        setCourts(data);
      }
    } catch (error) {
      console.error("Error fetching courts:", error);
    }
  };

  const fetchSlots = async () => {
    try {
      const response = await fetch(`${API_URL}/api/slots`);
      if (response.ok) {
        const data = await response.json();
        setSlots(data);
      }
    } catch (error) {
      console.error("Error fetching slots:", error);
    }
  };

  const getWeekDays = () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const weekDays = viewMode === "week" ? getWeekDays() : [selectedDate];

  const getBookingsForDate = (date: Date) => {
    let filtered = bookings.filter(booking => {
      return booking.bookingSlots.some(bs => {
        const slotDate = parseISO(bs.date.toString());
        return isSameDay(slotDate, date);
      });
    });

    if (searchPhone.trim()) {
      filtered = filtered.filter(booking => 
        booking.user?.phone?.includes(searchPhone) || 
        booking.phone_user?.includes(searchPhone)
      );
    }

    return filtered;
  };

  const getFilteredBookings = () => {
    let filtered = bookings;

    if (searchPhone.trim()) {
      filtered = filtered.filter(booking => 
        booking.user?.phone?.includes(searchPhone) || 
        booking.phone_user?.includes(searchPhone)
      );
    }

    if (statusFilter !== "ALL") {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    return filtered.sort((a, b) => 
      new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime()
    );
  };

  const groupBookingsByStatus = () => {
    const filtered = getFilteredBookings();
    const grouped: Record<BookingStatus, Booking[]> = {
      PENDING: [],
      CONFIRMED: [],
      CHECKED_IN: [],
      COMPLETED: [],
      CANCELLED: [],
      CANCEL_REQUESTED: []
    };

    filtered.forEach(booking => {
      if (grouped[booking.status]) {
        grouped[booking.status].push(booking);
      }
    });

    return grouped;
  };

  const getStatusColor = (status: BookingStatus) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
      CONFIRMED: "bg-green-100 text-green-800 border-green-300",
      CHECKED_IN: "bg-blue-100 text-blue-800 border-blue-300",
      COMPLETED: "bg-gray-100 text-gray-800 border-gray-300",
      CANCEL_REQUESTED: "bg-orange-100 text-orange-800 border-orange-300",
      CANCELLED: "bg-red-100 text-red-800 border-red-300"
    };
    return colors[status];
  };

  const getStatusLabel = (status: BookingStatus) => {
    const labels = {
      PENDING: "Chờ xác nhận",
      CONFIRMED: "Đã xác nhận",
      CHECKED_IN: "Đã check-in",
      COMPLETED: "Hoàn thành",
      CANCEL_REQUESTED: "Yêu cầu hủy",
      CANCELLED: "Đã hủy"
    };
    return labels[status];
  };

  const updateBookingStatus = async (bookingID: string, newStatus: BookingStatus) => {
    if (newStatus === "CANCELLED") {
      setCancelBookingId(bookingID);
      setShowCancelConfirm(true);
      return;
    }

    try {
      const booking = bookings.find(b => b.bookingID === bookingID);
      
      const requestBody: { status: BookingStatus; courtID?: string } = { 
        status: newStatus 
      };
      
      if ((newStatus === "CHECKED_IN" || newStatus === "CONFIRMED") && booking?.court?.courtID) {
        requestBody.courtID = booking.court.courtID;
      }
      
      const response = await fetch(`${API_URL}/api/bookings/updateBookingStatus/${bookingID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const updatedBooking = await response.json();
        setBookings(prev => 
          prev.map(b => b.bookingID === bookingID ? updatedBooking : b)
        );
        toast.success("Cập nhật trạng thái thành công!");
      } else {
        const error = await response.json();
        toast.error(error.message || "Chưa phân bổ sân!! Vui lòng phân bổ sân trước khi xác nhận hoặc check-in.");
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast.error("Lỗi khi cập nhật trạng thái");
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelBookingId) return;

    try {
      const booking = bookings.find(b => b.bookingID === cancelBookingId);
      
      const requestBody: { status: BookingStatus; courtID?: string } = { 
        status: "CANCELLED" 
      };
      
      if (booking?.court?.courtID) {
        requestBody.courtID = booking.court.courtID;
      }
      
      const response = await fetch(`${API_URL}/api/bookings/updateBookingStatus/${cancelBookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const updatedBooking = await response.json();
        setBookings(prev => 
          prev.map(b => b.bookingID === cancelBookingId ? updatedBooking : b)
        );
        toast.success("Đã hủy booking thành công!");
        setShowCancelConfirm(false);
        setCancelBookingId(null);
      } else {
        const error = await response.json();
        toast.error(error.message || "Không thể hủy booking");
        console.error("Error response:", error);
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error("Lỗi khi hủy booking");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-gray-800 flex items-center gap-3">
                <Calendar className="w-8 h-8 text-emerald-600" />
                Quản Lý Đặt Sân
              </h1>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm theo SĐT..."
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  className="pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setDisplayMode("calendar")}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    displayMode === "calendar" 
                      ? "bg-white text-emerald-600 shadow-md" 
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  📅 Lịch
                </button>
                <button
                  onClick={() => setDisplayMode("list")}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    displayMode === "list" 
                      ? "bg-white text-emerald-600 shadow-md" 
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  📋 Danh sách
                </button>
                <button
                  onClick={() => setDisplayMode("status")}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    displayMode === "status" 
                      ? "bg-white text-emerald-600 shadow-md" 
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  🏷️ Trạng thái
                </button>
              </div>

              {displayMode === "calendar" && (
                <div className="flex bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode("day")}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      viewMode === "day" 
                        ? "bg-white text-emerald-600 shadow-md" 
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Ngày
                  </button>
                  <button
                    onClick={() => setViewMode("week")}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      viewMode === "week" 
                        ? "bg-white text-emerald-600 shadow-md" 
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Tuần
                  </button>
                </div>
              )}

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                Tạo Booking
              </button>
            </div>
          </div>

          {displayMode === "calendar" && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <button
                onClick={() => setSelectedDate(prev => addDays(prev, viewMode === "week" ? -7 : -1))}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition-colors"
              >
                ← {viewMode === "week" ? "Tuần trước" : "Hôm trước"}
              </button>
              
              <div className="text-center">
                <h2 className="text-2xl font-black text-gray-800">
                  {viewMode === "week" 
                    ? `Tuần ${format(selectedDate, "w, yyyy", { locale: vi })}`
                    : format(selectedDate, "EEEE, dd MMMM yyyy", { locale: vi })
                  }
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {viewMode === "week" && 
                    `${format(weekDays[0], "dd/MM")} - ${format(weekDays[6], "dd/MM/yyyy")}`
                  }
                </p>
              </div>

              <button
                onClick={() => setSelectedDate(prev => addDays(prev, viewMode === "week" ? 7 : 1))}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition-colors"
              >
                {viewMode === "week" ? "Tuần sau" : "Hôm sau"} →
              </button>
            </div>
          )}

          {displayMode === "status" && (
            <div className="flex items-center justify-center mt-6 pt-6 border-t gap-2">
              <span className="text-sm font-semibold text-gray-600">Lọc theo trạng thái:</span>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setStatusFilter("ALL")}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    statusFilter === "ALL" 
                      ? "bg-emerald-600 text-white" 
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Tất cả
                </button>
                {(["PENDING", "CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED" , "CANCEL_REQUESTED"] as BookingStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      statusFilter === status 
                        ? "bg-emerald-600 text-white" 
                        : `${getStatusColor(status)} hover:opacity-80`
                    }`}
                  >
                    {getStatusLabel(status)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {displayMode === "calendar" && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {viewMode === "week" ? (
              <div className="grid grid-cols-1 lg:grid-cols-7 divide-x divide-gray-200">
                {weekDays.map((day, index) => (
                  <div key={index} className="min-h-[600px]">
                    <div className={`p-4 border-b ${isSameDay(day, new Date()) ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                      <div className="text-center">
                        <div className="text-sm font-semibold text-gray-600">
                          {format(day, "EEE", { locale: vi })}
                        </div>
                        <div className={`text-2xl font-black mt-1 ${
                          isSameDay(day, new Date()) ? 'text-emerald-600' : 'text-gray-800'
                        }`}>
                          {format(day, "dd")}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(day, "MMM", { locale: vi })}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 space-y-2 overflow-y-auto max-h-[530px]">
                      {getBookingsForDate(day).map((booking) => (
                        <BookingCard 
                          key={booking.bookingID} 
                          booking={booking}
                          onStatusChange={updateBookingStatus}
                          onEdit={setSelectedBooking}
                        />
                      ))}
                      
                      {getBookingsForDate(day).length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <Calendar className="w-12 h-12 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">Không có booking</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {getBookingsForDate(selectedDate).map((booking) => (
                    <div key={booking.bookingID} className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all hover:border-emerald-300">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">
                            {booking.court?.name || "Chưa phân bổ"}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {booking.user?.full_name || "Khách vãng lai"}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(booking.status)}`}>
                          {getStatusLabel(booking.status)}
                        </span>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <span className="text-2xl">📞</span>
                          <span className="font-semibold">{booking.user?.phone || booking.phone_user}</span>
                        </div>
                        
                        <div className="bg-emerald-50 rounded-lg p-3">
                          <div className="text-xs text-emerald-700 font-semibold mb-2">Thời gian:</div>
                          {booking.bookingSlots.map((bs, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                              <span>🕐</span>
                              <span className="font-semibold">
                                {bs.slot.start_time.slice(0, 5)} - {bs.slot.end_time.slice(0, 5)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between items-center bg-blue-50 rounded-lg p-3">
                          <span className="text-sm font-semibold text-blue-900">Tổng tiền:</span>
                          <span className="text-lg font-bold text-blue-600">
                            {booking.total_price.toLocaleString()}đ
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="flex-1 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg font-semibold hover:bg-emerald-200 transition-colors"
                        >
                          Chi tiết
                        </button>
                        {booking.status === "PENDING" && (
                          <button
                            onClick={() => updateBookingStatus(booking.bookingID, "CONFIRMED")}
                            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                          >
                            Xác nhận
                          </button>
                        )}
                        {booking.status === "CONFIRMED" && (
                          <button
                            onClick={() => updateBookingStatus(booking.bookingID, "CHECKED_IN")}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                          >
                            Check-in
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {getBookingsForDate(selectedDate).length === 0 && (
                    <div className="col-span-full text-center py-16 text-gray-400">
                      <Calendar className="w-20 h-20 mx-auto mb-4 opacity-30" />
                      <p className="text-lg font-semibold">Không có booking nào trong ngày này</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {displayMode === "list" && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-emerald-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold">Ngày</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Khách hàng</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">SĐT</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Sân</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Giờ</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Trạng thái</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Tổng tiền</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {getFilteredBookings().map((booking) => (
                    <tr key={booking.bookingID} className="hover:bg-emerald-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                        {format(parseISO(booking.booking_date), "dd/MM/yyyy")}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {booking.user?.full_name || "Khách vãng lai"}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono">
                        {booking.user?.phone || booking.phone_user}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold">
                        {booking.court?.name || "Chưa phân bổ"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {booking.bookingSlots.map((bs, idx) => (
                          <div key={idx}>
                            {bs.slot.start_time.slice(0, 5)} - {bs.slot.end_time.slice(0, 5)}
                          </div>
                        ))}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${getStatusColor(booking.status)}`}>
                          {getStatusLabel(booking.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-emerald-600">
                        {booking.total_price.toLocaleString()}đ
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-xs font-semibold hover:bg-emerald-200 transition-colors"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {getFilteredBookings().length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <Search className="w-20 h-20 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-semibold">Không tìm thấy booking nào</p>
                </div>
              )}
            </div>
          </div>
        )}

        {displayMode === "status" && (
          <div className="space-y-6">
            {Object.entries(groupBookingsByStatus()).map(([status, statusBookings]) => (
              statusBookings.length > 0 && (
                <div key={status} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div className={`px-6 py-4 border-b-4 ${getStatusColor(status as BookingStatus)}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold">
                        {getStatusLabel(status as BookingStatus)}
                      </h3>
                      <span className="text-2xl font-black">
                        {statusBookings.length}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {statusBookings.map((booking) => (
                      <BookingCard 
                        key={booking.bookingID} 
                        booking={booking}
                        onStatusChange={updateBookingStatus}
                        onEdit={setSelectedBooking}
                      />
                    ))}
                  </div>
                </div>
              )
            ))}
            
            {Object.values(groupBookingsByStatus()).every(arr => arr.length === 0) && (
              <div className="bg-white rounded-2xl shadow-lg p-16 text-center text-gray-400">
                <Calendar className="w-20 h-20 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-semibold">Không có booking nào</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateBookingModal
          courts={courts}
          slots={slots}
          onClose={() => setShowCreateModal(false)}
          onSubmit={async () => {
            await fetchBookings();
            setShowCreateModal(false);
          }}
        />
      )}

      {selectedBooking && (
        <EditBookingModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onUpdate={(updatedBooking) => {
            setBookings(prev => 
              prev.map(b => b.bookingID === updatedBooking.bookingID ? updatedBooking : b)
            );
            setSelectedBooking(null);
          }}
        />
      )}

      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Xác nhận hủy booking</h2>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn hủy booking này? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmCancel}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Xác nhận hủy
              </button>
              <button
                onClick={() => {
                  setShowCancelConfirm(false);
                  setCancelBookingId(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Không
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
