"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { format, differenceInWeeks, addDays, set } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Route } from "lucide-react";
import { is, se } from "date-fns/locale";
import { useRouter } from "next/navigation";
import moment from "moment-timezone";

interface SlotData {
  slot_id: string;
  slot_name: string;
  start_time?: string | null;
  end_time?: string | null;
  price: number;
  totalCourts: number;
  bookedCourts: number;
  availableCourts: number;
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
interface Courts {
  type: CourtType;
  multiplier: number;
}

const MAX_CONSECUTIVE_SLOTS = 5;
const MAX_WEEKS = 12;

type BookingType = "casual" | "weekly" | "tournament";
type CourtType = "indoor" | "outdoor";

export default function BookingPage() {
  const searchParams = useSearchParams();
  const urlDate = searchParams.get("date");
  const urlSlot = searchParams.get("slot");
  const router = useRouter();

  const [bookingType, setBookingType] = useState<BookingType>("casual");
  const [selectedDate, setSelectedDate] = useState("");
  const [weeklyStartDate, setWeeklyStartDate] = useState("");
  const [selectedSlotsID, setselectedSlotsID] = useState<string[]>([]);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<number | null>(null);
  const [selectedSlots, setselectedSlots] = useState<Slots[]>([]);
  const [slotData, setSlotData] = useState<SlotData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<Users | null>(null);
  const [courts, setCourts] = useState<Courts[]>([]);
  const [numberWeeks, setNumberWeeks] = useState(1);
  const [selectedCourt, setSelectedCourt] = useState<string>("");

  useEffect(() => {
    const token = document.cookie.split("; ").some((c) => c.startsWith("token="));
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const isValidWeekly = numberWeeks > 0 && numberWeeks <= MAX_WEEKS;

  useEffect(() => {
    if (!urlDate || !urlSlot || slotData.length === 0) return;

    const slotId = urlSlot;
    const slotExists = slotData.find(s => s.slot_id === slotId);

    if (slotExists && slotExists.availableCourts > 0) {
      setBookingType("casual");
      setSelectedDate(urlDate);
      setselectedSlotsID([slotId]);
    }

  }, [urlDate, urlSlot]);

  useEffect(() => {
    const saved = localStorage.getItem("pendingBooking");
    if (saved) {
      const data = JSON.parse(saved);
      setSelectedDate(data.bookingDate);
      setselectedSlotsID(data.slots.map((s: Slots) => s.slotID));
      setBookingType(data.bookingType);
      localStorage.removeItem("pendingBooking");
    }
  }, []);

  useEffect(() => {
    if (!selectedDate) return;

    const fetchSlotsByDate = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:5000/api/slots/getSlotStatusByDate/${selectedDate}`);
        if (!res.ok) throw new Error("Lỗi khi tải dữ liệu slot");
        const data = await res.json();
        setSlotData(data.slots || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSlotsByDate();
    fetchSlots();
    const interval = setInterval(fetchSlotsByDate, 10000);
    return () => clearInterval(interval);
  }, [selectedDate]);
  useEffect(() => {
    fetchCourtMultiplier();
  }, []);
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


  const handleSlotToggle = (slotId: string) => {
    const slot = slotData.find((s) => s.slot_id === slotId);
    if (!slot || slot.availableCourts === 0) return;

    const newSlots = selectedSlotsID.includes(slotId)
      ? selectedSlotsID.filter((s) => s !== slotId)
      : [...selectedSlotsID, slotId];

    if (newSlots.length > MAX_CONSECUTIVE_SLOTS) {
      alert(`Tối đa ${MAX_CONSECUTIVE_SLOTS} slot liên tiếp!`);
      return;
    }
    if (!isConsecutive(newSlots, slotData)) {
      alert("Chỉ được chọn các slot liên tiếp!");
      return;
    }

    const sortedSlots = [...newSlots].sort((a, b) => {
      const slotA = slotData.find((s) => s.slot_id === a);
      const slotB = slotData.find((s) => s.slot_id === b);

      const numA = slotA?.slot_name.match(/\d+/);
      const numB = slotB?.slot_name.match(/\d+/);

      return (numA ? parseInt(numA[0], 10) : 0) - (numB ? parseInt(numB[0], 10) : 0);
    });

    setselectedSlotsID(sortedSlots);
  };

  const multiplier = courts.find(c=> c.type === selectedCourt)?.multiplier || 1;

  const getPricePerWeek = () => {
    return selectedSlotsID.reduce((sum, id) => {
      const slot = slotData.find((s) => s.slot_id === id);
      return sum + (slot ? slot.price : 0) * multiplier;
    }, 0);
  };

  const discount = (bookingType === "tournament" ? 10 : bookingType === "weekly" ? 5 : 0);

  const getTotalPrice = () => {
    const pricePerWeek = getPricePerWeek();
    const totalprice = pricePerWeek * (bookingType === "weekly" ? numberWeeks : 1) * (1.0 - discount / 100);
    return totalprice;
  };
  const fetchSlots = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:5000/api/slots/`);
      if (!res.ok) throw new Error("Lỗi khi tải dữ liệu slot");
      const data = await res.json();
      setselectedSlots(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourtMultiplier = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/courts/getAllTheMultiplierOfTheCourtType`);
      if (!res.ok) throw new Error("Lỗi khi tải dữ liệu court");
      const data = await res.json();
      setCourts(data || null);
    } catch (err: any) {
      console.error(err.message);
    }
  }
  const total = getTotalPrice();
  const deposit = total * (bookingType === "tournament" ? 1 : bookingType === "weekly" ? 1 : 0.5);
  const handleSubmit = async () => {
    if (selectedSlotsID.length === 0) return alert("Vui lòng chọn slot!");

    if (bookingType === "weekly") {
      if (selectedWeekdays.length === 0) return alert("Chọn ít nhất 1 thứ!");
      if (!isValidWeekly) return alert(`Chọn ngày kết thúc (tối đa ${MAX_WEEKS} tuần)!`);
    }

    
    const bookingDate = new Date(selectedDate ? selectedDate : weeklyStartDate).toISOString();

    const slots = selectedSlotsID.flatMap((id) => {
      const slot = selectedSlots.find((s) => s.slotID === id);
      if (!slot) return null;

      if (bookingType === "weekly") {
        const recurringSlots: any[] | null = [];
        selectedWeekdays.forEach((weekday) => {
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

            console.log("Ngày thêm slot lặp:", nextDate);
            recurringSlots.push({
              slot_id: slot.slotID,
              date: nextDate,
              is_recurring: true,
              recurring_day: weekday,
              num_weeks: numberWeeks,
            });
          }
        });
        return recurringSlots;
      }

      return [
        {
          slot_id: slot.slotID,
          date: bookingDate,
          is_recurring: false,
          recurring_day: null,
          num_weeks: null,
        },
      ];
    }).filter((slot) => slot !== null);

    if (selectedCourt === "") {
      return alert("Vui lòng chọn loại sân!");
    }

    if (!user) {
      const bookingData = {
        bookingDate,
        slots,
        bookingType,
        total,
      };
      localStorage.setItem("pendingBooking", JSON.stringify(bookingData));
      router.push("/login?redirect=/booking");
      return;
    }

    const bookingData = {
      user_id: user.userID,
      booking_date: bookingDate,
      status: "PENDING",
      total_price: total,
      deposit_amount: deposit,
      booking_type: bookingType.toUpperCase(),
      discount: discount,
      slots,
    };

    try {
      const res = await fetch("http://localhost:5000/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });

      if (!res.ok) throw new Error("Lỗi khi lưu booking");

      const data = await res.json();
      alert("Đặt sân thành công!");
      localStorage.removeItem("pendingBooking");
      router.push(`/history`);
    } catch (error) {
      console.error(error);
      alert("Không thể lưu booking. Vui lòng thử lại!");
    }

  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-10 text-blue-700">
          Đặt Slot Sân Pickleball
        </h1>

        {urlDate && urlSlot && selectedSlotsID.length > 0 && (
          <div className="bg-green-100 border border-green-400 text-green-900 p-4 rounded-xl mb-6 text-base flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M16.707 5.293a1 1 0 0 0-1.414 0L9 11.586 6.707 9.293a1 1 0 0 0-1.414 1.414l3 3a1 1 0 0 0 1.414 0l7-7a1 1 0 0 0 0-1.414z" />
            </svg>
            Đã tự động chọn: <strong>{format(new Date(urlDate), "dd 'tháng' MM 'năm' yyyy")}</strong> - Slot <strong>
              {slotData.find(s => s.slot_id === urlSlot)?.start_time}
            </strong>
          </div>
        )}

        <div className="bg-amber-100 border border-amber-400 text-amber-900 p-4 rounded-xl mb-8 text-base flex items-start gap-2">
          <svg className="w-5 h-5 mt-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12h2v2H9v-2zm0-8h2v6H9V4zm1-4C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
          </svg>
          <div>
            <strong>Lưu ý:</strong> Bạn chỉ đặt slot thời gian. <br />
            Đến sân sẽ được giao sân trống (không chọn sân trước).
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { type: "casual" as const, label: "Đặt 1 lần", icon: "🏓" },
            { type: "weekly" as const, label: "Đặt hàng tuần", icon: "🔁" },
            { type: "tournament" as const, label: "Đặt cho giải đấu", icon: "🏆" },
          ].map((item) => (
            <button
              key={item.type}
              onClick={() => {
                setBookingType(item.type);
                setselectedSlotsID([]);
                setSelectedWeekdays([]);
                setWeeklyStartDate("");
                setSelectedCourt("");
                if (item.type !== "casual") {
                  setSelectedDate("");
                }
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

      {(bookingType === "casual" || bookingType === "tournament") && (
        <><div className="mb-8">
          <label className="block text-lg font-medium mb-3">Chọn Ngày</label>
          <DatePicker
            selected={selectedDate ? new Date(selectedDate) : null}
            onChange={(date) => {
              if (date instanceof Date && !isNaN(date.getTime())) {
                const formatted = format(date, 'yyyy-MM-dd');
                setSelectedDate(formatted);
              } else {
                setSelectedDate("");
              }
            }}
            dateFormat="dd/MM/yyyy"
            minDate={new Date()}
            className="w-full max-w-xs px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
          <div className="mb-6">
            <label className="block text-lg font-medium mb-3">Chọn loại sân</label>
            <select
              value={selectedCourt}
              onChange={(e) => setSelectedCourt(e.target.value)}
              className="w-full max-w-xs px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Chọn loại sân --</option>
              {courts.length > 0 ? (
                courts.map((court) => (
                  <option key={court.type} value={court.type}>
                    {court.type}
                  </option>
                ))
              ) : (
                <option disabled>Không có loại sân nào</option>
              )}
            </select>
          </div></>
      )}

      {bookingType === "weekly" && (
        <>
          <div className="mb-6">
            <label className="block text-lg font-medium mb-3">Ngày Bắt Đầu</label>
            <DatePicker
              selected={weeklyStartDate ? new Date(weeklyStartDate) : null}
              onChange={(date) => {
                if (date instanceof Date && !isNaN(date.getTime())) {
                  const formatted = format(date, 'yyyy-MM-dd');
                  setWeeklyStartDate(formatted);
                  setselectedSlotsID([]);
                } else {
                  setWeeklyStartDate("");
                }
              }}
              dateFormat="dd/MM/yyyy"
              minDate={new Date()}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-6">
            <label className="block text-lg font-medium mb-3">Số Tuần Lặp Lại</label>
            <input
              type="number"
              min={1}
              max={MAX_WEEKS}
              value={numberWeeks}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value) && value > 0 && value <= MAX_WEEKS) {
                  setNumberWeeks(value);
                  setselectedSlotsID([]);
                }
              }}
              className="w-full max-w-xs px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-2 text-sm text-gray-500">
              Tối đa {MAX_WEEKS} tuần
            </p>
          </div>

          {weeklyStartDate && numberWeeks > 0 && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="font-medium">
                Bắt đầu từ ngày{" "}
                <span className="text-blue-600 font-bold">
                  {format(new Date(weeklyStartDate), "dd/MM/yyyy")}
                </span>{" "}
                và lặp lại trong{" "}
                <span className="text-blue-600 font-bold">{numberWeeks}</span> tuần
              </p>
            </div>
          )}

          <div className="mb-8">
            <label className="block text-lg font-medium mb-3">Chọn Thứ Trong Tuần</label>
            <div className="flex flex-wrap gap-3">
              {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                <label key={day} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedWeekdays.includes(day)}
                    onChange={(e) =>
                      setSelectedWeekdays((prev) =>
                        e.target.checked ? [...prev, day] : prev.filter((d) => d !== day)
                      )
                    }
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <span className="font-medium">
                    {["CN", "T2", "T3", "T4", "T5", "T6", "T7"][day]}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-lg font-medium mb-3">Chọn loại sân</label>
            <select
              value={selectedCourt}
              onChange={(e) => setSelectedCourt(e.target.value)}
              className="w-full max-w-xs px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Chọn loại sân --</option>
              {courts.length > 0 ? (
                courts.map((court) => (
                  <option key={court.type} value={court.type}>
                    {court.type}
                  </option>
                ))
              ) : (
                <option disabled>Không có loại sân nào</option>
              )}
            </select>
          </div>
        </>
      )
      }


      {
        bookingType === "tournament" && (
          <div className="mb-8">
            <label className="block text-lg font-medium mb-3">Chọn Giải Đấu</label>
            <select
              value={selectedTournament || ""}
              onChange={(e) => setSelectedTournament(Number(e.target.value))}
              className="w-full max-w-md px-4 py-3 border rounded-lg"
            >
              <option value="">-- Chọn giải đấu --</option>
              <option value="1">Giải Mùa Thu 2025</option>
            </select>
          </div>
        )
      }

      {
        (selectedDate || (bookingType === "weekly" && weeklyStartDate && selectedWeekdays.length > 0)) && (
          <>
            <h2 className="text-xl font-semibold mb-4">
              Chọn Slot Liên Tiếp (Tối đa {MAX_CONSECUTIVE_SLOTS})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
              {slotData.map((slot) => {
                const isSelected = selectedSlotsID.includes(slot.slot_id);
                const isBooked = slot.availableCourts === 0;

                return (
                  <button
                    key={slot.slot_id}
                    onClick={() => handleSlotToggle(slot.slot_id)}
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
                      {isBooked ? "Hết" : `Còn ${slot.availableCourts} sân`}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )
      }

      {
        selectedSlotsID.length > 0 && (
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
                <span className="font-medium">Tiền cọc:</span>
                  <span className="font-bold ">{deposit} VNĐ</span>
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
            selectedSlotsID.length === 0 ||
            (bookingType === "weekly" && (!isValidWeekly || selectedWeekdays.length === 0))
          }
          className={`
              px-12 py-4 rounded-xl font-bold text-lg transition-all transform
              ${selectedSlotsID.length > 0 && (bookingType !== "weekly" || (isValidWeekly && selectedWeekdays.length > 0))
              ? "bg-linear-to-r from-green-500 to-green-600 text-white hover:scale-105 shadow-lg"
              : "bg-gray-400 text-gray-700 cursor-not-allowed"
            }
            `}
        >
          Xác Nhận Đặt Slot
        </button>
      </div>
    </div >
  );
}