import { useState, useEffect } from "react";
import { XCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { API_URL } from '@/lib/config';
import { toast } from "sonner";

type BookingStatus = "PENDING" | "CONFIRMED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED" | "CANCEL_REQUESTED";
type CourtType = "INDOOR" | "OUTDOOR";

interface Booking {
  bookingID: string;
  booking_date: string;
  status: BookingStatus;
  total_price: number;
  deposit_amount: number;
  court_type?: CourtType;
  booking_type?: "CASUAL" | "TOURNAMENT" | "WEEKLY";
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

interface EditBookingModalProps {
  booking: Booking;
  onClose: () => void;
  onUpdate: (booking: Booking) => void;
}

export default function EditBookingModal({ booking, onClose, onUpdate }: EditBookingModalProps) {
  const [note, setNote] = useState(booking.note || "");
  const [selectedCourtId, setSelectedCourtId] = useState(booking.court?.courtID || "");
  const [availableCourts, setAvailableCourts] = useState<Court[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  useEffect(() => {
    const fetchAvailableCourts = async () => {
      setCheckingAvailability(true);
      try {
     
        const courtsResponse = await fetch(`${API_URL}/api/courts`);
        if (!courtsResponse.ok) return;
        const allCourts: Court[] = await courtsResponse.json();

      
        const bookingsResponse = await fetch(`${API_URL}/api/bookings`);
        if (!bookingsResponse.ok) return;
        const allBookings: Booking[] = await bookingsResponse.json();

       
        const courtType = booking.court?.type || booking.court_type;
        const courtsOfSameType = allCourts.filter(c => c.type === courtType);
        
        const uniqueDates = [...new Set(booking.bookingSlots.map(bs => {
          const slotDate = new Date(bs.date);
          return slotDate.toISOString().split('T')[0];
        }))];

        const totalCourtsOfType = courtsOfSameType.length;

        const availabilityChecks = courtsOfSameType.map(court => {
          if (booking.court && court.courtID === booking.court.courtID) {
            return { court, available: true };
          }

          const isAvailableForAllDates = uniqueDates.every(dateStr => {
            const slotsForDate = booking.bookingSlots
              .filter(bs => new Date(bs.date).toISOString().split('T')[0] === dateStr)
              .map(bs => bs.slot.slotID);

            const courtBookingsForDate = allBookings.filter((b: Booking) => {
              if (b.bookingID === booking.bookingID) return false;
              if (b.status === "CANCELLED") return false;
              if (b.court?.courtID !== court.courtID) return false;
              
              return b.bookingSlots.some(bs => {
                const bsDate = new Date(bs.date).toISOString().split('T')[0];
                return bsDate === dateStr && slotsForDate.includes(bs.slot.slotID);
              });
            });

            if (courtBookingsForDate.length > 0) {
              return false; 
            }

            return slotsForDate.every(slotId => {
              const assignedCourts = allBookings.filter((b: Booking) => {
                if (b.bookingID === booking.bookingID) return false;
                if (b.status === "CANCELLED") return false;
                if (!b.court) return false;
                
                const bookingCourtType = b.court.type;
                if (bookingCourtType !== courtType) return false;
                
                return b.bookingSlots.some(bs => {
                  const bsDate = new Date(bs.date).toISOString().split('T')[0];
                  return bsDate === dateStr && bs.slot.slotID === slotId;
                });
              }).length;
              
              const pendingCount = allBookings.filter((b: Booking) => {
                if (b.bookingID === booking.bookingID) return false;
                if (b.status === "CANCELLED") return false;
                if (b.court) return false;
                
                const bookingCourtType = b.court_type;
                if (bookingCourtType !== courtType) return false;
                
                return b.bookingSlots.some(bs => {
                  const bsDate = new Date(bs.date).toISOString().split('T')[0];
                  return bsDate === dateStr && bs.slot.slotID === slotId;
                });
              }).length;
              
              const totalBooked = assignedCourts + pendingCount;
              return totalBooked < totalCourtsOfType;
            });
          });

          return { court, available: isAvailableForAllDates };
        });

        const available = availabilityChecks
          .filter(result => result.available)
          .map(result => result.court);
        
        setAvailableCourts(available);
      } catch (error) {
        console.error("Error fetching courts:", error);
      } finally {
        setCheckingAvailability(false);
      }
    };

    fetchAvailableCourts();
  }, [booking]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const hasRecurring = booking.bookingSlots.some(bs => bs.is_recurring);
      const bookingType = hasRecurring ? "WEEKLY" : "CASUAL";
      
      const response = await fetch(`${API_URL}/api/bookings/update/${booking.bookingID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: booking.user?.userID,
          booking_date: booking.booking_date,
          status: booking.status,
          total_price: booking.total_price,
          deposit_amount: booking.deposit_amount,
          booking_type: bookingType,
          court_id: selectedCourtId || null,
          court_type: booking.court?.type || booking.court_type,
          note: note,
          slots: booking.bookingSlots.map(bs => ({
            slot_id: bs.slot.slotID,
            date: bs.date, 
            is_recurring: bs.is_recurring, 
            recurring_day: bs.recurring_day, 
            num_weeks: bs.num_weeks 
          }))
        })
      });

      if (response.ok) {
        const detailResponse = await fetch(`${API_URL}/api/bookings/getBookingById/${booking.bookingID}`);
        if (detailResponse.ok) {
          const fullBooking = await detailResponse.json();
          const wasAssigning = !booking.court && selectedCourtId;
          toast.success(wasAssigning ? "✅ Đã phân bổ sân thành công!" : "✅ Cập nhật booking thành công!");
          onUpdate(fullBooking);
        }
      } else {
        const error = await response.json();
        toast.error(`Không thể cập nhật booking: ${error.message || ""}`);
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("Lỗi khi cập nhật booking");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full my-8">
        <div className="bg-emerald-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-xl font-black">Chỉnh Sửa Booking</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Ngày:</span>
              <span className="font-bold">
                {format(parseISO(booking.booking_date), "dd/MM/yyyy")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Giờ:</span>
              <span className="font-bold">
                {booking.bookingSlots[0]?.slot.start_time} - {booking.bookingSlots[0]?.slot.end_time}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Khách hàng:</span>
              <span className="font-bold">
                {booking.user?.full_name || booking.phone_user}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Loại sân:</span>
              <span className="font-bold">
                {(booking.court?.type || booking.court_type) === "INDOOR" ? "🏠 Trong nhà" : "🌤️ Ngoài trời"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Loại đặt sân:</span>
              <span className="font-bold">
                {booking.booking_type === "CASUAL" ? "Khách thường" : 
                 booking.booking_type === "TOURNAMENT" ? "Giải đấu" : "Đặt sân theo tuần"}
              </span>
            </div>
            {booking.court && (
              <div className="flex justify-between">
                <span className="text-gray-600">Sân hiện tại:</span>
                <span className="font-bold text-green-600">
                  {booking.court.name}
                </span>
              </div>
            )}
            {!booking.court && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-3 mt-2">
                <p className="text-sm font-bold text-amber-800 text-center">
                  ⚠️ Booking này chưa được phân bổ sân
                </p>
              </div>
            )}
          </div>


          {(booking.status === "PENDING" || booking.status === "CONFIRMED") && (
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Chọn sân *
            </label>
            {checkingAvailability ? (
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Đang kiểm tra sân trống...</p>
              </div>
            ) : availableCourts.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableCourts.map(court => (
                  <label
                    key={court.courtID}
                    className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all border-2 ${
                      selectedCourtId === court.courtID
                        ? 'bg-emerald-50 border-emerald-500'
                        : 'bg-gray-50 border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="court"
                      checked={selectedCourtId === court.courtID}
                      onChange={() => setSelectedCourtId(court.courtID)}
                      className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <span className="font-bold text-gray-800">{court.name}</span>
                      <span className="text-sm text-gray-600 ml-2">
                        ({court.type === "INDOOR" ? "Trong nhà" : "Ngoài trời"})
                      </span>
                      {booking.court && court.courtID === booking.court.courtID && (
                        <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded ml-2">
                          Sân hiện tại
                        </span>
                      )}
                    </div>
                    {selectedCourtId === court.courtID && (
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-1 rounded">
                        Đã chọn
                      </span>
                    )}
                  </label>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                <p className="text-sm font-semibold text-red-700 text-center">
                  ⚠️ Không có sân trống
                </p>
              </div>
            )}
          </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Ghi chú
            </label>
            <textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors resize-none"
              placeholder="Thêm ghi chú..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={!selectedCourtId && (booking.status === "PENDING" || booking.status === "CONFIRMED")}
              className={`flex-1 px-6 py-3 rounded-xl font-bold transition-colors ${
                !selectedCourtId && (booking.status === "PENDING" || booking.status === "CONFIRMED")
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {!booking.court ? '🎯 Phân bổ sân' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
