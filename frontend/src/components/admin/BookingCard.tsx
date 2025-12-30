import { useState } from "react";
import { Clock, Phone, User, MapPin, Edit, CheckCircle, XCircle, Calendar, Link2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

type BookingStatus = "PENDING" | "CONFIRMED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED";
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

interface BookingCardProps {
  booking: Booking;
  onStatusChange: (id: string, status: BookingStatus) => void;
  onEdit: (booking: Booking) => void;
}

export default function BookingCard({ booking, onStatusChange, onEdit }: BookingCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [allowCheckIn, setAllowCheckIn] = useState(false);

  const getSlotsByDate = () => {
    const grouped: { [date: string]: typeof booking.bookingSlots } = {};

    booking.bookingSlots.forEach(bs => {
      const dateKey = bs.date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(bs);
    });

    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) =>
        a.slot.start_time.localeCompare(b.slot.start_time)
      );
    });


    return grouped;
  };
  const currentDate = new Date();
  if (!allowCheckIn && booking.status === "CONFIRMED") {
    const firstBookingDateStr = booking.bookingSlots[0].date;
    const firstBookingDate = parseISO(firstBookingDateStr);
    const hasStarted = booking.bookingSlots.some(bs => {
      const [startHour, startMinute] = bs.slot.start_time.split(":").map(Number);
      const slotDateTime = new Date(firstBookingDate);
      slotDateTime.setHours(startHour, startMinute - 10, 0, 0);
      return currentDate >= slotDateTime;
    })
    const isFalseCheckInTime = booking.bookingSlots.some(bs => {
      const [startHour, startMinute] = bs.slot.start_time.split(":").map(Number);
      const slotDateTime = new Date(firstBookingDate);
      slotDateTime.setHours(startHour, startMinute, 0, 0);
      return currentDate < slotDateTime;
    }
    );
    if (
      firstBookingDate.getFullYear() === currentDate.getFullYear() &&
      firstBookingDate.getMonth() === currentDate.getMonth() &&
      firstBookingDate.getDate() === currentDate.getDate()
    ) {
      if (hasStarted && isFalseCheckInTime) {
        setAllowCheckIn(true);
      }
    }

  }

  const slotsByDate = getSlotsByDate();
  const uniqueDates = Object.keys(slotsByDate).sort();

  const isRecurring = booking.bookingSlots.some(bs => bs.is_recurring);
  const recurringInfo = isRecurring ? booking.bookingSlots.find(bs => bs.is_recurring) : null;



  const getDayName = (day: number | null) => {
    if (day === null) return '';
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return days[day];
  };

  const getStatusBadge = (status: BookingStatus) => {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
      CONFIRMED: "bg-blue-100 text-blue-800 border-blue-300",
      CHECKED_IN: "bg-purple-100 text-purple-800 border-purple-300",
      COMPLETED: "bg-green-100 text-green-800 border-green-300",
      CANCELLED: "bg-red-100 text-red-800 border-red-300",
    };

    const labels = {
      PENDING: "Chờ",
      CONFIRMED: "Đã cọc",
      CHECKED_IN: "Đã check-in",
      COMPLETED: "Hoàn thành",
      CANCELLED: "Hủy",
    };

    return (
      <span className={`px-3 py-1.5 rounded-lg text-sm font-bold border-2 ${styles[status]} shadow-sm`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div
      className="bg-linear-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl p-3 hover:shadow-lg transition-all cursor-pointer group"
      onClick={() => setShowActions(!showActions)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span className={`font-bold text-gray-800 ${booking.court?.name ? 'underline' : ''}`}>{booking.court?.name || "Chưa phân bổ"}</span>
            {getStatusBadge(booking.status)}
          </div>

          <div className="space-y-1.5 mt-2">
            {uniqueDates.map(dateKey => {
              const slots = slotsByDate[dateKey];
              const dateObj = parseISO(dateKey);
              const timeRanges = slots.map(bs => `${bs.slot.start_time}-${bs.slot.end_time}`);

              return (
                <div key={dateKey} className="text-xs">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Calendar className="w-3 h-3" />
                    <span className="font-semibold">{format(dateObj, "dd/MM", { locale: vi })}</span>
                    <span>•</span>
                    <Clock className="w-3 h-3" />
                    <span>{timeRanges.join(", ")}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {isRecurring && recurringInfo && (
            <div className="flex items-center gap-1 text-xs mt-2">
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                🔄 {getDayName(recurringInfo.recurring_day)} × {recurringInfo.num_weeks} tuần
              </span>
            </div>
          )}
        </div>
      </div>

      {booking.parent_booking_id && (
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          <Link2 className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-blue-600 font-semibold">Nhóm đặt nhiều ngày</span>
        </div>
      )}

      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2 text-gray-700">
          {booking.user ? (
            <>
              <User className="w-3.5 h-3.5" />
              <span className="font-semibold">{booking.user.full_name}</span>
            </>
          ) : (
            <>
              <Phone className="w-3.5 h-3.5" />
              <span className="font-semibold">{booking.phone_user}</span>
            </>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-600">Tổng:</span>
          <span className="font-bold text-emerald-600">
            {booking.total_price.toLocaleString()}đ
          </span>
        </div>
      </div>

      {showActions && (
        <div className="mt-3 pt-3 border-t space-y-2 animate-slideDown">
          <div className="grid grid-cols-2 gap-2">
            {booking.status === "PENDING" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(booking.bookingID, "CONFIRMED");
                }}
                className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-xs font-semibold hover:bg-blue-600 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Xác nhận
              </button>
            )}

            {booking.status === "CONFIRMED" && allowCheckIn && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(booking.bookingID, "CHECKED_IN");
                }}
                className="flex items-center justify-center gap-1 px-3 py-2 bg-purple-500 text-white rounded-lg text-xs font-semibold hover:bg-purple-600 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Check-in
              </button>
            )}

            {booking.status === "CHECKED_IN" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(booking.bookingID, "COMPLETED");
                }}
                className="flex items-center justify-center gap-1 px-3 py-2 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Hoàn thành
              </button>
            )}

            {!["COMPLETED", "CANCELLED", "CHECKED_IN"].includes(booking.status) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(booking.bookingID, "CANCELLED");
                }}
                className="flex items-center justify-center gap-1 px-3 py-2 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Hủy
              </button>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(booking);
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Chỉnh sửa
          </button>
        </div>
      )}
    </div>
  );
}
