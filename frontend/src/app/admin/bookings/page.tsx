"use client";

import { useState, useEffect } from "react";
import { format, addDays, addWeeks } from "date-fns";
import { vi } from "date-fns/locale";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment-timezone";


interface Slot {
  slot_id: string;
  slot_name: string;
  start_time: string;
  end_time: string;
  price: number;
  totalCourts: number;
  bookedCourts: number;
  availableCourts: number;
}

interface CalendarDay {
  date: string;
  slots: Slot[];
}

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
    slot: {
      start_time: string;
      end_time: string
    };
    is_recurring: boolean;
    recurring_day: number | null;
    num_weeks: number | null;
  }[];
}

interface SlotInput {
  booking_id: string
  slot_id: string;
  date: string;
  is_recurring: boolean;
  recurring_day: number | null;
  num_weeks: number | null;
}

interface Courts {
  type: CourtType;
  multiplier: number;
}

const MAX_CONSECUTIVE_SLOTS = 5;
const MAX_WEEKS = 12

type BookingType = "casual" | "weekly" | "tournament";
type CourtType = "indoor" | "outdoor";
type ViewMode = "week" | "month" | "date";

export default function BookingCalendarDemo() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [calendar, setCalendar] = useState<CalendarDay[]>([]);
  const [numWeeks, setNumWeeks] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [phone, setPhone] = useState("");
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [courts, setCourts] = useState<Courts[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<string>("");
  const [bookingType, setBookingType] = useState<BookingType>("casual");
  const [error, setError] = useState<string | null>(null);
  const [slotData, setselectedSlots] = useState<Slot[]>([]);
  const [selectedSlotsID, setselectedSlotsID] = useState<string[]>([]);
  const [weeklyStartDate, setWeeklyStartDate] = useState("");
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("week");

  const isValidWeekly = numWeeks > 0 && numWeeks <= MAX_WEEKS;

  useEffect(() => {
    if (!selectedDate) return;
    setLoading(true);

    const fetchCalendar = async () => {
      try {
        const startDate = new Date(selectedDate);
        const dates: Date[] = [];

        if (viewMode === "week") {
          for (let i = 0; i < 7; i++) {
            dates.push(addDays(startDate, i));
          }
        } else if (viewMode === "date") {
          for (let i = 0; i < numWeeks; i++) {
            dates.push(addDays(startDate, i * 7));
          }
        }
        else if (viewMode === "month") {
          const year = startDate.getFullYear();
          const month = startDate.getMonth();
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          for (let d = 1; d <= daysInMonth; d++) {
            dates.push(new Date(year, month, d));
          }
        }

        const promises = dates.map((date) => {
          const dateStr = format(date, "yyyy-MM-dd");
          return fetch(`http://localhost:5000/api/slots/getSlotStatusByDate/${dateStr}`).then(res => res.json());
        });

        const results = await Promise.all(promises);

        const calendarData: CalendarDay[] = results.map((data, index) => {
          const date = dates[index];
          const dateStr = format(date, "yyyy-MM-dd");
          return {
            date: dateStr,
            slots: data.slots.map((slot: any) => ({
              slot_id: slot.slot_id,
              slot_name: slot.slot_name,
              start_time: slot.start_time,
              end_time: slot.end_time,
              price: slot.price,
              totalCourts: slot.totalCourts,
              bookedCourts: slot.bookedCourts,
              availableCourts: slot.availableCourts,
            })),
          };
        });

        setCalendar(calendarData);
        setselectedSlots([]);
      } catch (error) {
        console.error("Lỗi khi fetch calendar:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
    fetchCalendar();
  }, [selectedDate, numWeeks, viewMode]);


  useEffect(() => {
    fetchCourtMultiplier();

  }, []);

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

  const toggleSlotSelection = (date: string, slot_id: string) => {
    const slot = calendar
      .find(day => day.date === date)
      ?.slots.find(s => s.slot_id === slot_id);

    if (!slot || slot.availableCourts === 0) return;

    const isSelected = selectedSlotsID.includes(slot_id);

    if (isSelected) {
      setselectedSlots(prev => prev.filter(s => s.slot_id !== slot_id));
      setselectedSlotsID(prev => prev.filter(id => id !== slot_id));
    } else {
      setselectedSlots(prev => [...prev, slot]);
      setselectedSlotsID(prev => [...prev, slot_id]);
    }
  };

  useEffect(() => {
    setselectedSlotsID(slotData.map(s => s.slot_id));
  }, [slotData]);


  const getPricePerWeek = () => {
    return selectedSlotsID.reduce((sum, id) => {
      const slot = slotData.find((s) => s.slot_id === id);
      return sum + (slot ? slot.price : 0) * (selectedCourt ? parseFloat(selectedCourt) : 1);
    }, 0);
  };

  const discount = (bookingType === "tournament" ? 10 : bookingType === "weekly" ? 5 : 0);

  const getTotalPrice = () => {
    const pricePerWeek = getPricePerWeek();
    const totalprice = pricePerWeek * (bookingType === "weekly" ? numWeeks : 1) * (1.0 - discount / 100);
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

  const total = getTotalPrice();
  const deposit = total * (bookingType === "tournament" ? 1 : bookingType === "weekly" ? 1 : 0.5);

  console.log("tong tien:", total);

  const handleCreateBooking = async () => {
    if (selectedSlotsID.length === 0) return alert("Vui lòng chọn slot!");

    if (bookingType === "weekly") {
      if (selectedWeekdays.length === 0) return alert("Chọn ít nhất 1 thứ!");
      if (!isValidWeekly) return alert(`Chọn ngày kết thúc (tối đa ${MAX_WEEKS} tuần)!`);
    }
    if (selectedCourt === "") {
      return alert("Vui lòng chọn loại sân!");
    }

    if (!phone) {
      alert("Vui lòng nhập số điện thoại khách!");
      return;
    }


    const bookingDate = new Date(selectedDate ? selectedDate : weeklyStartDate).toISOString();

    const slots = selectedSlotsID.flatMap((id) => {
      const slot = slotData.find((s) => s.slot_id === id);
      if (!slot) return null;

      if (bookingType === "weekly") {
        const recurringSlots: any[] | null = [];
        selectedWeekdays.forEach((weekday) => {
          for (let i = 0; i < numWeeks; i++) {
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
              slot_id: slot.slot_id,
              date: nextDate,
              is_recurring: true,
              recurring_day: weekday,
              num_weeks: numWeeks,
            });
          }
        });
        return recurringSlots;
      }

      return [
        {
          slot_id: slot.slot_id,
          date: bookingDate,
          is_recurring: false,
          recurring_day: null,
          num_weeks: null,
        },
      ];
    }).filter((slot) => slot !== null);



    const bookingData = {
      phone_user: phone,
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
      setShowBookingForm(false);
    } catch (error) {
      console.error(error);
      alert("Không thể lưu booking. Vui lòng thử lại!");
    }

  };



  // if (loading) return <p className="text-center mt-10 text-gray-500">Đang tải dữ liệu...</p>;

  return (
    <div className="p-6">
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold">Quản Lý Đặt Sân</h1>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <button
              onClick={() => {
                if (slotData.length === 0) return alert("Chưa chọn slot nào!");
                setShowBookingForm(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Tạo đặt sân
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block font-semibold mb-1">Ngày bắt đầu</label>
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
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Số tuần (nếu đặt hằng tuần)</label>
            <input
              type="number"
              min={1}
              max={12}
              value={numWeeks}
              onChange={(e) => setNumWeeks(parseInt(e.target.value))}
              className="w-16 border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Chế độ hiển thị</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as ViewMode)}
              className="w-xs border rounded px-3 py-2"
            >
              <option value="date">Theo ngày</option>
              <option value="week">Theo tuần</option>
              <option value="month">Theo tháng</option>
            </select>
          </div>
        </div>

        <div className="space-y-6">
          {calendar.map(day => (
            <div key={day.date}>
              <div className="font-semibold mb-2 text-lg">
                {format(new Date(day.date), "dd/MM/yyyy")}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {day.slots.map(slot => {
                  const isSelected = selectedSlotsID.includes(slot.slot_id);
                  const isBooked = slot.availableCourts === 0;

                  return (
                    <button
                      key={slot.slot_id + day.date}
                      onClick={() => toggleSlotSelection(day.date, slot.slot_id)}
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
            </div>
          ))}
        </div>




        {/* <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {calendar.map((day, dayIndex) => (
            <div key={day.date} className="border rounded p-2">
              <div className="font-semibold mb-2">{format(new Date(day.date), "dd/MM/yyyy")}</div>
              {day.slots.map((slot, slotIndex) => {
                const isSelected = slotData.find(s => s.slot_id === slot.slot_id);
                return (
                  <div
                    key={slot.slot_id}
                    className={`p-2 rounded mb-1 text-center text-sm cursor-pointer ${slot.availableCourts === 0
                      ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                      : slotData.find(s => s.slot_id === slot.slot_id)
                        ? "bg-blue-500 text-white"
                        : "bg-green-100 text-green-800 hover:bg-green-200"
                      }`}
                    onClick={() => slot.availableCourts > 0 && toggleSlotSelection(dayIndex, slotIndex)}
                  >

                    {slot.start_time} - {slot.end_time} ({slot.availableCourts}/{slot.totalCourts} trống)
                  </div>
                );
              })}
            </div>
          ))}
        </div> */}

      </div>

      {showBookingForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Xác nhận đặt sân</h2>

            <div className="mb-3">
              <label className="font-medium block mb-1">Số điện thoại khách</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="VD: 0901234567"
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div className="mb-4">
              <label className="font-medium block mb-1">Loại đặt sân</label>
              <select
                value={bookingType}
                onChange={(e) => setBookingType(e.target.value as BookingType)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="casual">Đặt 1 lần</option>
                <option value="weekly">Đặt hằng tuần</option>
                <option value="tournament">Giải đấu</option>
              </select>
            </div>
            {bookingType === "weekly" && (
              <>
                <div className="mb-4">
                  <label className="block text-lg font-medium mb-2">Chọn Thứ Trong Tuần</label>
                  <div className="flex flex-wrap gap-3">
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                      <label key={day} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedWeekdays.includes(day)}
                          onChange={(e) =>
                            setSelectedWeekdays((prev) =>
                              e.target.checked
                                ? [...prev, day]
                                : prev.filter((d) => d !== day)
                            )
                          }
                          className="w-5 h-5 text-blue-600 rounded"
                        />
                        <span className="font-medium">
                          {["T2", "T3", "T4", "T5", "T6", "T7", "CN"][day - 1]}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

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
                    <option key={court.type} value={court.multiplier}>
                      {court.type}
                    </option>
                  ))
                ) : (
                  <option disabled>Không có loại sân nào</option>
                )}
              </select>
            </div>

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
                        <span className="font-semibold">Tổng cộng ({numWeeks} tuần):</span>
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

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowBookingForm(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateBooking}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
