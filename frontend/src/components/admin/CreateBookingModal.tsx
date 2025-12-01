import { useState, useEffect } from "react";
import { XCircle } from "lucide-react";
import { format } from "date-fns";
import moment from "moment-timezone";
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

interface CreateBookingModalProps {
  courts: Court[];
  slots: Slot[];
  onClose: () => void;
  onSubmit: (booking: Booking) => void;
}

const VAT = 0.08;
type BookingType = "CASUAL" | "WEEKLY" | "TOURNAMENT";

export default function CreateBookingModal({ courts, slots, onClose, onSubmit }: CreateBookingModalProps) {
  const [formData, setFormData] = useState({
    booking_date: format(new Date(), "yyyy-MM-dd"),
    court_type: "" as CourtType | "",
    slot_ids: [] as string[],
    phone_user: "",
    note: "",
    is_recurring: false,
    recurring_day: null as number | null,
    num_weeks: 1,
  });
  const [bookingType, setBookingType] = useState<BookingType>("CASUAL");
  const [availableCourts, setAvailableCourts] = useState<Court[]>([]);
  const [selectedCourtId, setSelectedCourtId] = useState("");
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [courtMultiplier, setCourtMultiplier] = useState(1);

  useEffect(() => {
    const fetchMultiplier = async () => {
      if (!formData.court_type) return;
      try {
        const res = await fetch(`${API_URL}/api/courts/getAllTheMultiplierOfTheCourtType`);
        if (res.ok) {
          const data = await res.json();
          const found = data.find((c: { type: CourtType; multiplier: number }) => c.type === formData.court_type);
          setCourtMultiplier(found?.multiplier || 1);
        }
      } catch (error) {
        console.error("Error fetching multiplier:", error);
      }
    };
    fetchMultiplier();
  }, [formData.court_type]);

  useEffect(() => {
    const checkAvailableCourts = async () => {
      if (!formData.court_type || formData.slot_ids.length === 0 || !formData.booking_date) {
        setAvailableCourts([]);
        setSelectedCourtId("");
        return;
      }

      setCheckingAvailability(true);
      try {
        const courtsOfType = courts.filter(c => c.type === formData.court_type);
        
        const availabilityChecks = await Promise.all(
          courtsOfType.map(async (court) => {
            try {
              const response = await fetch(`${API_URL}/api/bookings`);
              if (!response.ok) return { court, available: false };
              
              const allBookings = await response.json();
              
              const courtBookings = allBookings.filter((b: Booking) => 
                b.court.courtID === court.courtID && 
                b.booking_date.startsWith(formData.booking_date) &&
                b.status !== "CANCELLED"
              );

              const isAvailable = formData.slot_ids.every(slotId => {
                return !courtBookings.some((booking: Booking) => 
                  booking.bookingSlots.some(bs => bs.slot.slotID === slotId)
                );
              });

              return { court, available: isAvailable };
            } catch {
              return { court, available: false };
            }
          })
        );

        const available = availabilityChecks
          .filter(result => result.available)
          .map(result => result.court);
        
        setAvailableCourts(available);
        
        if (available.length > 0 && !selectedCourtId) {
          setSelectedCourtId(available[0].courtID);
        } else if (available.length === 0) {
          setSelectedCourtId("");
        }
      } catch (error) {
        console.error("Error checking availability:", error);
        setAvailableCourts([]);
      } finally {
        setCheckingAvailability(false);
      }
    };

    checkAvailableCourts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.booking_date, formData.court_type, formData.slot_ids.length, courts]);

  const selectedSlots = slots.filter(s => formData.slot_ids.includes(s.slotID));
  const basePrice = selectedSlots.reduce((sum, slot) => sum + slot.price, 0);
  const priceWithMultiplier = basePrice * courtMultiplier;
  const priceWithWeeks = formData.is_recurring ? priceWithMultiplier * formData.num_weeks : priceWithMultiplier;
  const vatAmount = priceWithWeeks * VAT;
  const total = Math.round(priceWithWeeks + vatAmount);
  const depositPercent = bookingType === "TOURNAMENT" ? 0.5 : bookingType === "WEEKLY" ? 0.5 : 0.2;
  const deposit = Math.round(total * depositPercent);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCourtId) {
      alert("Không có sân trống cho các slot đã chọn");
      return;
    }
    
    const selectedCourt = courts.find(c => c.courtID === selectedCourtId);
    const selectedSlots = slots.filter(s => formData.slot_ids.includes(s.slotID));
    
    if (!selectedCourt || selectedSlots.length === 0) {
      alert("Vui lòng chọn loại sân và ít nhất 1 slot");
      return;
    }

    try {
      const bookingDate = new Date(formData.booking_date);
      
      let slotsToCreate: Array<{
        slot_id: string;
        date: string;
        is_recurring: boolean;
        recurring_day: number;
        num_weeks: number;
      }> = [];

      if (formData.is_recurring) {
        const recurringDay = bookingDate.getDay();
        
        formData.slot_ids.forEach((slotId) => {
          for (let i = 0; i < formData.num_weeks; i++) {
            const bookingDateVN = moment.tz(formData.booking_date, "Asia/Ho_Chi_Minh");
            const nextDate = bookingDateVN
              .clone()
              .add(i * 7, "days")
              .startOf("day")
              .tz("Asia/Ho_Chi_Minh")
              .format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");

            slotsToCreate.push({
              slot_id: slotId,
              date: nextDate,
              is_recurring: true,
              recurring_day: recurringDay,
              num_weeks: formData.num_weeks,
            });
          }
        });
      } else {
        slotsToCreate = formData.slot_ids.map(slot_id => ({
          slot_id: slot_id,
          date: formData.booking_date,
          is_recurring: false,
          recurring_day: 0,
          num_weeks: 1
        }));
      }

      const bookingData = {
        phone_user: formData.phone_user,
        booking_date: bookingDate.toISOString(),
        status: "PENDING",
        total_price: total,
        deposit_amount: deposit,
        booking_type: bookingType,
        court_id: selectedCourtId,
        note: formData.note,
        slots: slotsToCreate
      };

      const response = await fetch(`${API_URL}/api/bookings/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData)
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const newBooking = await response.json();
        console.log('New booking created:', newBooking);
        
        const detailResponse = await fetch(`${API_URL}/api/bookings/getBookingById/${newBooking.bookingID}`);
        if (detailResponse.ok) {
          const fullBooking = await detailResponse.json();
          console.log('Full booking details:', fullBooking);
          alert("Đã tạo booking thành công!");
          onSubmit(fullBooking);
        } else {
          console.error('Failed to fetch booking details');
          alert("Đã tạo booking nhưng không lấy được chi tiết");
        }
      } else {
        const error = await response.json();
        console.error('Error response:', error);
        alert(`Lỗi: ${error.message || "Không thể tạo booking"}`);
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Lỗi khi tạo booking");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-black text-gray-800">Tạo Booking Mới</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <XCircle className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Ngày đặt sân *
            </label>
            <input
              type="date"
              required
              value={formData.booking_date}
              onChange={(e) => setFormData({ ...formData, booking_date: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Loại booking *
            </label>
            <select
              required
              value={bookingType}
              onChange={(e) => setBookingType(e.target.value as BookingType)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="CASUAL">🎾 Thường (Cọc 20%)</option>
              <option value="WEEKLY">📅 Đặt theo tuần (Cọc 50%)</option>
              <option value="TOURNAMENT">🏆 Giải đấu (Cọc 50%)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {bookingType === "CASUAL" && "📌 Đặt sân thường - Cọc 20% tổng tiền"}
              {bookingType === "WEEKLY" && "🔄 Đặt sân theo tuần - Cọc 50% tổng tiền"}
              {bookingType === "TOURNAMENT" && "🏅 Đặt sân cho giải đấu - Cọc 50% tổng tiền"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Loại sân *
            </label>
            <select
              required
              value={formData.court_type}
              onChange={(e) => setFormData({ ...formData, court_type: e.target.value as CourtType })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="">-- Chọn loại sân --</option>
              <option value="INDOOR">Sân trong nhà</option>
              <option value="OUTDOOR">Sân ngoài trời</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Khung giờ * (Chọn nhiều slots)
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border-2 border-gray-200 rounded-xl p-3">
              {slots.map(slot => (
                <label
                  key={slot.slotID}
                  className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={formData.slot_ids.includes(slot.slotID)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, slot_ids: [...formData.slot_ids, slot.slotID] });
                      } else {
                        setFormData({ ...formData, slot_ids: formData.slot_ids.filter(id => id !== slot.slotID) });
                      }
                    }}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-gray-800">{slot.slot_name}</span>
                      <span className="text-sm text-gray-600 ml-2">
                        ({slot.start_time} - {slot.end_time})
                      </span>
                    </div>
                    <span className="font-bold text-emerald-600">
                      {slot.price.toLocaleString()}đ
                    </span>
                  </div>
                </label>
              ))}
            </div>
            {formData.slot_ids.length > 0 && (
              <div className="mt-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-emerald-700">
                    Đã chọn {formData.slot_ids.length} slot(s)
                  </span>
                  <span className="font-bold text-emerald-600">
                    Tổng: {slots.filter(s => formData.slot_ids.includes(s.slotID))
                      .reduce((sum, s) => sum + s.price, 0).toLocaleString()}đ
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={formData.is_recurring}
                onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <div>
                <span className="font-bold text-gray-800">Đặt sân hằng tuần</span>
                <p className="text-xs text-gray-600 mt-1">
                  Tự động đặt sân cùng giờ, cùng ngày trong tuần cho nhiều tuần
                </p>
              </div>
            </label>

            {formData.is_recurring && (
              <div className="mt-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Số tuần muốn đặt *
                </label>
                <input
                  type="number"
                  min="1"
                  max="52"
                  required={formData.is_recurring}
                  value={formData.num_weeks}
                  onChange={(e) => setFormData({ ...formData, num_weeks: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <p className="text-xs text-gray-600 mt-2">
                  📅 Sẽ đặt sân vào {new Date(formData.booking_date).toLocaleDateString('vi-VN', { weekday: 'long' })} hằng tuần
                </p>
                {formData.slot_ids.length > 0 && (
                  <div className="mt-3 p-3 bg-white rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-blue-700">
                        Tổng cộng {formData.num_weeks} tuần:
                      </span>
                      <span className="font-bold text-blue-600">
                        {(slots.filter(s => formData.slot_ids.includes(s.slotID))
                          .reduce((sum, s) => sum + s.price, 0) * formData.num_weeks).toLocaleString()}đ
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {formData.court_type && formData.slot_ids.length > 0 && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Sân trống
              </label>
              {checkingAvailability ? (
                <div className="p-4 bg-gray-50 rounded-xl text-center">
                  <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Đang kiểm tra sân trống...</p>
                </div>
              ) : availableCourts.length > 0 ? (
                <div className="space-y-2">
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
                    ⚠️ Không có sân trống cho các slot đã chọn
                  </p>
                  <p className="text-xs text-red-600 text-center mt-1">
                    Vui lòng chọn slot khác hoặc ngày khác
                  </p>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Số điện thoại khách *
            </label>
            <input
              type="tel"
              required
              placeholder="0912345678"
              pattern="[0-9]{10}"
              value={formData.phone_user}
              onChange={(e) => setFormData({ ...formData, phone_user: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">10 chữ số</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Ghi chú
            </label>
            <textarea
              rows={3}
              placeholder="Ghi chú về booking..."
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          {formData.slot_ids.length > 0 && (
            <div className="p-5 bg-linear-to-br from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200">
              <h3 className="font-black text-gray-800 mb-3 text-lg">📊 Chi tiết thanh toán</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Giá cơ bản ({formData.slot_ids.length} slot):</span>
                  <span className="font-semibold text-gray-800">{basePrice.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Hệ số sân (x{courtMultiplier}):</span>
                  <span className="font-semibold text-gray-800">{priceWithMultiplier.toLocaleString()}đ</span>
                </div>
                {formData.is_recurring && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Số tuần (x{formData.num_weeks}):</span>
                    <span className="font-semibold text-gray-800">{priceWithWeeks.toLocaleString()}đ</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">VAT ({(VAT * 100).toFixed(0)}%):</span>
                  <span className="font-semibold text-gray-800">+{vatAmount.toLocaleString()}đ</span>
                </div>
                <div className="h-px bg-emerald-300 my-2"></div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800">💵 Tổng cộng:</span>
                  <span className="font-black text-emerald-600 text-xl">{total.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-orange-700">💳 Tiền cọc ({(depositPercent * 100).toFixed(0)}%):</span>
                  <span className="font-black text-orange-600 text-xl">{deposit.toLocaleString()}đ</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg"
            >
              Tạo Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
