"use client";

import { useState, useEffect } from "react";
import { Calendar, Plus, Search } from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import BookingCard from "@/components/admin/BookingCard";
import CreateBookingModal from "@/components/admin/CreateBookingModal";
import EditBookingModal from "@/components/admin/EditBookingModal";
import { API_URL } from '@/lib/config';

type BookingStatus = "PENDING" | "CONFIRMED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED";
type CourtType = "INDOOR" | "OUTDOOR";

interface Booking {
  bookingID: string;
  booking_date: string;
  status: BookingStatus;
  total_price: number;
  deposit_amount: number;
  court: {
    courtID: string;
    name: string;
    type: CourtType;
  };
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [searchPhone, setSearchPhone] = useState("");
  const [loading, setLoading] = useState(true);

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

  const updateBookingStatus = async (bookingID: string, newStatus: BookingStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/bookings/updateBookingStatus/${bookingID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const updatedBooking = await response.json();
        setBookings(prev => 
          prev.map(b => b.bookingID === bookingID ? updatedBooking : b)
        );
      } else {
        const error = await response.json();
        alert(`Không thể cập nhật trạng thái: ${error.message || 'Lỗi không xác định'}`);
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
      alert("Lỗi khi cập nhật trạng thái");
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

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                Tạo Booking
              </button>
            </div>
          </div>

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
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
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
        </div>
      </div>

      {showCreateModal && (
        <CreateBookingModal
          courts={courts}
          slots={slots}
          onClose={() => setShowCreateModal(false)}
          onSubmit={async (newBooking) => {
            setBookings(prev => [...prev, newBooking]);
            setShowCreateModal(false);
            await fetchBookings();
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
    </div>
  );
}
