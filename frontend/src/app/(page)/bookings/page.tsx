/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
import { useRouter } from "next/navigation";
import moment from "moment-timezone";
import CasualBooking from "@/components/booking/CasualBooking";
import WeeklyBooking from "@/components/booking/WeeklyBooking";
import TournamentBooking from "@/components/booking/TournamentBooking";
import PaymentModal from "@/components/payment/PaymentModal";
import { API_URL } from '@/lib/config';

interface SlotData {
  slot_id: string;
  slot_name: string;
  start_time?: string | null;
  end_time?: string | null;
  price: number;
  totalCourts: number;
  bookedCourts: number;
  availableCourts: Record<string, number>;
}

interface Slots {
  slotID: string;
  date: string;
  is_recurring: boolean;
  recurring_day: number | null;
  num_weeks: number | null;
}


interface Users {
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
interface CourtsMultiplier {
  type: CourtType;
  multiplier: number;
}

interface Courts {
  courtID?: string;
  name?: string;
  image: string;
  status?: string;
  type: CourtType;
  multiplier: number;
}


const MAX_WEEKS = 12;
const VAT = 0.08;
const depositCasual = 0.2;
const depositWeekly = 0.5;
const depositTournament = 0.5;

type BookingType = "casual" | "weekly" | "tournament";
type CourtType = "INDOOR" | "OUTDOOR";

export default function BookingPage() {
  const router = useRouter();

  const [bookingType, setBookingType] = useState<BookingType>("casual");
  const [StartDate, setStartDate] = useState("");
  const [EndDate, setEndDate] = useState("");
  const [selectedSlotsByDate, setSelectedSlotsByDate] = useState<Record<string, string[]>>({}); 
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  const [selectedSlots, setselectedSlots] = useState<Slots[]>([]);
  const [slotData, setSlotData] = useState<SlotData[]>([]);
  const [slotDataByDate, setSlotDataByDate] = useState<Record<string, SlotData[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<Users | null>(null);
  const [courtsMultiplier, setCourtsMultiplier] = useState<CourtsMultiplier[]>([]);
  const [courts, setCourts] = useState<Courts[] | null>(null);
  const [numberWeeks, setNumberWeeks] = useState(1);
  const [selectedCourtType, setSelectedCourtType] = useState<string>("");
  const [selectedCourt, setSelectedCourt] = useState<Courts | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null); 



  useEffect(() => {
    const token = document.cookie.split("; ").some((c) => c.startsWith("token="));
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const isValidWeekly = numberWeeks > 0 && numberWeeks <= MAX_WEEKS;


  useEffect(() => {
    if (!StartDate || !EndDate) return;

    const fetchSlotsByDate = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/slots/getSlotStatusByDate/${StartDate}/${EndDate}`);
        if (!res.ok) throw new Error("Lỗi khi tải dữ liệu slot");
        const data = await res.json();

        setSlotDataByDate(data);
        const firstDateSlots = Object.values(data)[0] as SlotData[];
        setSlotData(firstDateSlots || []);
        console.log("Dữ liệu slot theo ngày:", data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
      } finally {
        setLoading(false);
      }
    };

    fetchSlotsByDate();
    fetchSlots();
    fetchCourtMultiplier();

    const interval = setInterval(fetchSlotsByDate, 10000);
    return () => clearInterval(interval);
  }, [StartDate, EndDate]);



  const isConsecutive = (slots: string[], slotData: SlotData[]) => {
    if (slots.length <= 1) return true;

    const slotNumbers = slots
      .map(id => {
        const slot = slotData.find(s => s.slot_id === id);
        if (!slot) return null;
        const match = slot.slot_name.match(/\d+/);
        return match ? parseInt(match[0], 10) : null;
      })
      .filter((n): n is number => n !== null)
      .sort((a, b) => a - b);

    for (let i = 1; i < slotNumbers.length; i++) {
      if (slotNumbers[i] !== slotNumbers[i - 1] + 1) return false;
    }
    return true;
  };


  const handleSlotToggle = (slotId: string, date: string, dateSlots: SlotData[]) => {
    const slot = dateSlots.find((s) => s.slot_id === slotId);
    if (!slot) return;

    const availableCourts = selectedCourtType
      ? slot.availableCourts[selectedCourtType] ?? 0
      : Math.max(...Object.values(slot.availableCourts));

    if (availableCourts === 0) return;

    const currentDateSlots = selectedSlotsByDate[date] || [];
    const newSlots = currentDateSlots.includes(slotId)
      ? currentDateSlots.filter((s) => s !== slotId)
      : [...currentDateSlots, slotId];

    if (!isConsecutive(newSlots, dateSlots)) {
      alert("Chỉ được chọn các slot liên tiếp trong cùng 1 ngày!");
      return;
    }

    const sortedSlots = [...newSlots].sort((a, b) => {
      const slotA = dateSlots.find((s) => s.slot_id === a);
      const slotB = dateSlots.find((s) => s.slot_id === b);

      const numA = slotA?.slot_name.match(/\d+/);
      const numB = slotB?.slot_name.match(/\d+/);

      return (numA ? parseInt(numA[0], 10) : 0) - (numB ? parseInt(numB[0], 10) : 0);
    });

    if (bookingType === "weekly") {
      const clickedDayOfWeek = new Date(date).getDay();
      const updatedSlots: Record<string, string[]> = { ...selectedSlotsByDate };

      Object.keys(slotDataByDate).forEach((d) => {
        const dayOfWeek = new Date(d).getDay();
        if (dayOfWeek === clickedDayOfWeek) {
          if (sortedSlots.length > 0) {
            updatedSlots[d] = sortedSlots;
          } else {
            delete updatedSlots[d];
          }
        }
      });

      setSelectedSlotsByDate(updatedSlots);
    } else {
      const updatedSlots = { ...selectedSlotsByDate };
      if (sortedSlots.length > 0) {
        updatedSlots[date] = sortedSlots;
      } else {
        delete updatedSlots[date];
      }
      setSelectedSlotsByDate(updatedSlots);
    }
  };


  const multiplier = courtsMultiplier.find(c => c.type === selectedCourtType)?.multiplier || 1;

  const getPricePerWeek = () => {
    let total = 0;
    
    if (bookingType === "weekly") {
      const uniqueWeekdays = new Set<number>();
      Object.keys(selectedSlotsByDate).forEach(date => {
        uniqueWeekdays.add(new Date(date).getDay());
      });
      
      uniqueWeekdays.forEach(weekday => {
        const dateWithWeekday = Object.keys(selectedSlotsByDate).find(
          date => new Date(date).getDay() === weekday
        );
        
        if (dateWithWeekday) {
          const slotIds = selectedSlotsByDate[dateWithWeekday];
          const dateSlots = slotDataByDate[dateWithWeekday] || [];
          
          slotIds.forEach(id => {
            const slot = dateSlots.find((s) => s.slot_id === id);
            total += (slot ? slot.price : 0) * multiplier;
          });
        }
      });
    } else {
      Object.entries(selectedSlotsByDate).forEach(([date, slotIds]) => {
        const dateSlots = slotDataByDate[date] || [];
        slotIds.forEach(id => {
          const slot = dateSlots.find((s) => s.slot_id === id);
          total += (slot ? slot.price : 0) * multiplier;
        });
      });
    }
    
    return total;
  };

  const discount = (bookingType === "tournament" ? 10 : bookingType === "weekly" ? 5 : 0);

  const getTotalPrice = () => {
    const pricePerWeek = getPricePerWeek();
    const totalBeforeDiscount = pricePerWeek * (bookingType === "weekly" ? numberWeeks : 1);
    const discountAmount = totalBeforeDiscount * (discount / 100);
    const priceAfterDiscount = totalBeforeDiscount - discountAmount;
    const vatAmount = priceAfterDiscount * VAT;
    const totalprice = Math.round(priceAfterDiscount + vatAmount);
    return totalprice;
  };
  
  const getVATAmount = () => {
    const pricePerWeek = getPricePerWeek();
    const totalBeforeDiscount = pricePerWeek * (bookingType === "weekly" ? numberWeeks : 1);
    const discountAmount = totalBeforeDiscount * (discount / 100);
    const priceAfterDiscount = totalBeforeDiscount - discountAmount;
    return Math.round(priceAfterDiscount * VAT);
  };
  
  const getPriceBeforeVAT = () => {
    const pricePerWeek = getPricePerWeek();
    const totalBeforeDiscount = pricePerWeek * (bookingType === "weekly" ? numberWeeks : 1);
    const discountAmount = totalBeforeDiscount * (discount / 100);
    return Math.round(totalBeforeDiscount - discountAmount);
  };
  const fetchSlots = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/slots/`);
      if (!res.ok) throw new Error("Lỗi khi tải dữ liệu slot");
      const data = await res.json();
      setselectedSlots(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourtMultiplier = async () => {
    try {
      const res = await fetch(`${API_URL}/api/courts/getAllTheMultiplierOfTheCourtType`);
      if (!res.ok) throw new Error("Lỗi khi tải dữ liệu court");
      const data = await res.json();
      setCourtsMultiplier(data || null);
    } catch (err: unknown) {
      console.error(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
    }
  }

  const fetchCourts = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/courts/getAvailableCourtsByType/${selectedCourtType}`);
      if (!res.ok) throw new Error("Lỗi khi tải dữ liệu court");
      const data = await res.json();
      setCourts(data || null);
    } catch (err: unknown) {
      console.error(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
    }
  }, [selectedCourtType]);

  useEffect(() => {
    if (selectedCourtType) {
      fetchCourts();
    }
  }, [selectedCourtType, fetchCourts]);

  const total = getTotalPrice();
  const deposit = total * (bookingType === "tournament" ? depositTournament : bookingType === "weekly" ? depositWeekly : depositCasual);

  const handleSubmit = async () => {
    const totalSelectedSlots = Object.values(selectedSlotsByDate).flat().length;
    if (totalSelectedSlots === 0) return alert("Vui lòng chọn slot!");

    if (bookingType === "weekly") {
      if (selectedWeekdays.length === 0) return alert("Chọn ít nhất 1 thứ!");
      if (!isValidWeekly) return alert(`Chọn ngày kết thúc (tối đa ${MAX_WEEKS} tuần)!`);
    }

    const bookingDate = new Date(StartDate ? StartDate : StartDate).toISOString();

    let slots: Array<{
      slot_id: string;
      date: string;
      is_recurring: boolean;
      recurring_day: number;
      num_weeks: number;
    }> = [];

    if (bookingType === "weekly") {
      const slotsByWeekday: Record<number, string[]> = {};
      
      Object.entries(selectedSlotsByDate).forEach(([date, slotIds]) => {
        const dayOfWeek = new Date(date).getDay();
        if (!slotsByWeekday[dayOfWeek]) {
          slotsByWeekday[dayOfWeek] = slotIds;
        }
      });

      Object.entries(slotsByWeekday).forEach(([weekdayStr, slotIds]) => {
        const weekday = parseInt(weekdayStr);
        slotIds.forEach((id) => {
          const slot = selectedSlots.find((s) => s.slotID === id);
          if (!slot) return;

          for (let i = 0; i < numberWeeks; i++) {
            const bookingDateVN = moment.tz(bookingDate, "Asia/Ho_Chi_Minh");
            const currentDay = bookingDateVN.day();

            let diff = weekday - currentDay;
            if (diff < 0) diff += 7;

            const nextDate = bookingDateVN
              .clone()
              .add(diff + i * 7, "days")
              .startOf("day")
              .tz("Asia/Ho_Chi_Minh")
              .format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");

            console.log("Ngày thêm slot lặp:", nextDate, "Thứ:", weekday, "Slot:", slot.slotID);
            slots.push({
              slot_id: slot.slotID,
              date: nextDate,
              is_recurring: true,
              recurring_day: weekday,
              num_weeks: numberWeeks,
            });
          }
        });
      });
    } else {
      slots = Object.entries(selectedSlotsByDate).flatMap(([date, slotIds]) => {
        return slotIds.map((id) => {
          const slot = selectedSlots.find((s) => s.slotID === id);
          if (!slot) return null;

          return {
            slot_id: slot.slotID,
            date: date,
            is_recurring: false,
            recurring_day: 0,
            num_weeks: 1,
          };
        }).filter((s): s is NonNullable<typeof s> => s !== null);
      });
    }

    if (selectedCourtType === "") {
      return alert("Vui lòng chọn loại sân!");
    }

    if (!selectedCourt) {
      return alert("Vui lòng chọn sân!");
    }

    if (!user) {
      return alert("Vui lòng đăng nhập!");
    }

    console.log("Tổng số bookingSlots sẽ tạo:", slots.length);
    console.log("Chi tiết slots:", slots);

    const bookingData: any = {
      user_id: user.userID,
      booking_date: bookingDate,
      status: "PENDING",
      total_price: total,
      deposit_amount: deposit,
      booking_type: bookingType.toUpperCase(),
      discount: discount,
      court_id: selectedCourt.courtID,
      slots,
    };

    if (bookingType === "tournament" && selectedTournament) {
      bookingData.tournament_id = selectedTournament;
    }

    try {
      const res = await fetch(`${API_URL}/api/bookings/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("❌ Lỗi từ server:", errorData);
        throw new Error(errorData.message || "Lỗi khi lưu booking");
      }

      const result = await res.json();
      console.log("✅ Booking response:", result);
      
      const bookingId = result.booking?.bookingID || result.bookingID || result.booking?.id;
      if (!bookingId) {
        console.error("❌ Không tìm thấy bookingID trong response:", result);
        throw new Error("Không nhận được booking ID từ server");
      }
      
      setCreatedBookingId(bookingId);
      setShowPaymentModal(true);
    } catch (error: any) {
      console.error("❌ Error:", error);
      alert("Không thể lưu booking: " + (error.message || "Vui lòng thử lại!"));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-10 text-blue-700">
          Đặt Slot Sân Pickleball
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { type: "casual" as const, label: "Vãng lai", icon: "🏓" },
            { type: "weekly" as const, label: "Cố định", icon: "🔁" },
            { type: "tournament" as const, label: "Đặt cho giải đấu", icon: "🏆" },
          ].map((item) => (
            <button
              key={item.type}
              onClick={() => {
                setBookingType(item.type);
                setSelectedSlotsByDate({});
                setSelectedWeekdays([]);
                setStartDate("");
                setSelectedCourtType("");
                setEndDate("");
              }}
              className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-200 
          ${bookingType === item.type
                  ? "border-blue-600 bg-blue-50 shadow-lg scale-105"
                  : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                }`}
            >
              <div className="text-4xl mb-3">{item.icon}</div>
              <div className="font-semibold text-lg text-center">{item.label}</div>
            </button>
          ))}
        </div>
      </div>

      {(bookingType === "casual" ) && (
        <CasualBooking
          StartDate={StartDate}
          EndDate={EndDate}
          selectedCourtType={selectedCourtType}
          selectedCourt={selectedCourt}
          courtsMultiplier={courtsMultiplier}
          courts={courts}
          onStartDateChange={(date) => setStartDate(date)}
          onEndDateChange={(date) => setEndDate(date)}
          onCourtTypeChange={(type) => setSelectedCourtType(type)}
          onCourtChange={(court) => setSelectedCourt(court)}
        />
      )}

      {bookingType === "weekly" && (
        <WeeklyBooking
          StartDate={StartDate}
          EndDate={EndDate}
          numberWeeks={numberWeeks}
          selectedWeekdays={selectedWeekdays}
          selectedCourtType={selectedCourtType}
          selectedCourt={selectedCourt}
          courtsMultiplier={courtsMultiplier}
          courts={courts}
          maxWeeks={MAX_WEEKS}
          onStartDateChange={(date) => {
            setStartDate(date);
            setSelectedSlotsByDate({});
          }}
          onEndDateChange={(date) => {
            setEndDate(date);
            setSelectedSlotsByDate({});
          }}
          onNumberWeeksChange={(weeks) => {
            setNumberWeeks(weeks);
            setSelectedSlotsByDate({});
          }}
          onWeekdaysChange={(weekdays) => setSelectedWeekdays(weekdays)}
          onCourtTypeChange={(type) => setSelectedCourtType(type)}
          onCourtChange={(court) => setSelectedCourt(court)}
        />
      )}

      {bookingType === "tournament" && (
        <TournamentBooking
          StartDate={StartDate}
          EndDate={EndDate}
          selectedCourtType={selectedCourtType}
          selectedCourt={selectedCourt}
          selectedTournament={selectedTournament}
          courtsMultiplier={courtsMultiplier}
          courts={courts}
          onStartDateChange={(date) => setStartDate(date)}
          onEndDateChange={(date) => setEndDate(date)}
          onCourtTypeChange={(type) => setSelectedCourtType(type)}
          onCourtChange={(court) => setSelectedCourt(court)}
          onTournamentChange={(tournament) => setSelectedTournament(tournament)}
        />
      )}

      {StartDate && EndDate && Object.keys(slotDataByDate).length > 0 && (
        bookingType === "casual" ||
        bookingType === "tournament" ||
        selectedWeekdays.length > 0
      ) && (
          <>
            <h2 className="text-xl font-semibold mb-4">
              Chọn Slot Sân
              {bookingType === "weekly" && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  - Slot sẽ được đồng bộ cho tất cả các ngày cùng thứ
                </span>
              )}
            </h2>

            {Object.entries(slotDataByDate)
              .filter(([date]) => {
                if (bookingType === "weekly") {
                  const dayOfWeek = new Date(date).getDay();
                  return selectedWeekdays.includes(dayOfWeek);
                }
                return true;
              })
              .map(([date, slots]) => (
                <div key={date} className="mb-8">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">
                    📅 {format(new Date(date), 'dd/MM/yyyy')} - {['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][new Date(date).getDay()]}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
                    {slots.map((slot) => {
                      const currentDateSlots = selectedSlotsByDate[date] || [];
                      const isSelected = currentDateSlots.includes(slot.slot_id);

                      const availableCourts = selectedCourtType
                        ? slot.availableCourts?.[selectedCourtType] ?? 0
                        : Math.max(...Object.values(slot.availableCourts ?? {}));

                      const isBooked = availableCourts <= 0;

                      return (
                        <button
                          key={slot.slot_id}
                          onClick={() => !isBooked && handleSlotToggle(slot.slot_id, date, slots)}
                          disabled={isBooked}
                          className={`
                    py-3 px-4 rounded-lg font-medium text-sm transition-all relative
                    ${isBooked
                              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                              : isSelected
                                ? "bg-yellow-400 text-blue-900 ring-2 ring-yellow-500 shadow-lg"
                                : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md"
                            }
                  `}
                        >
                          <div>{slot.start_time} - {slot.end_time}</div>
                          <div className="text-xs mt-1 font-medium">
                            {isBooked ? "Hết" : `Còn ${availableCourts} sân`}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
          </>
        )}




      {
        Object.values(selectedSlotsByDate).flat().length > 0 && (
          <div className="bg-linear-to-r from-blue-50 to-green-50 p-6 rounded-xl mb-6 border">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Giá mỗi tuần:</span>
                <span className="font-bold">{getPricePerWeek().toLocaleString()} VNĐ</span>
              </div>
              <div>
                <div className="flex justify-between">
                  <span className="font-medium">Giảm giá:</span>
                  <span className="font-bold text-red-600">-{discount}%</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between">
                  <span className="font-medium">Tiền cọc ({bookingType === "weekly" ? depositWeekly*100 : bookingType === "tournament" ? depositTournament*100 : depositCasual*100}%):</span>
                  <span className="font-bold ">{deposit.toLocaleString()} VNĐ</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between">
                  <span className="font-medium">Giá sau giảm (chưa VAT):</span>
                  <span className="font-bold">{getPriceBeforeVAT().toLocaleString()} VNĐ</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between">
                  <span className="font-medium">VAT ({(VAT * 100)}%):</span>
                  <span className="font-bold text-amber-600">+{getVATAmount().toLocaleString()} VNĐ</span>
                </div>
              </div>
              {bookingType === "weekly" && (
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Tổng cộng ({numberWeeks} tuần):</span>
                  <span className="font-bold text-green-600">{getTotalPrice().toLocaleString()} VNĐ</span>
                </div>
              )}
              {bookingType !== "weekly" && (
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Tổng tiền:</span>
                  <span className="font-bold text-green-600">{getTotalPrice().toLocaleString()} VNĐ</span>
                </div>
              )}
            </div>
          </div>
        )
      }

      <div className="text-center">
        <button
          onClick={handleSubmit}
          disabled={
            Object.values(selectedSlotsByDate).flat().length === 0 ||
            (bookingType === "weekly" && (!isValidWeekly || selectedWeekdays.length === 0))
          }
          className={`
              px-12 py-4 rounded-xl font-bold text-lg transition-all transform
              ${Object.values(selectedSlotsByDate).flat().length > 0 && (bookingType !== "weekly" || (isValidWeekly && selectedWeekdays.length > 0))
              ? "bg-linear-to-r from-green-500 to-green-600 text-white hover:scale-105 shadow-lg"
              : "bg-gray-400 text-gray-700 cursor-not-allowed"
            }
            `}
        >
          Xác Nhận Đặt Slot
        </button>
      </div>

      {showPaymentModal && createdBookingId && (
        <PaymentModal
          bookingId={createdBookingId}
          onClose={() => {
            setShowPaymentModal(false);
            setCreatedBookingId(null);
          }}
          onPaymentSuccess={() => {
            setShowPaymentModal(false);
            router.push("/history");
          }}
        />
      )}
    </div >
  );
}