"use client";

import { useState, useEffect } from "react";
import { format, addDays, addWeeks } from "date-fns";
import { vi } from "date-fns/locale";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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

export default function BookingCalendarDemo() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [calendar, setCalendar] = useState<CalendarDay[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<Slot[]>([]);
  const [numWeeks, setNumWeeks] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedDate, setSelectedDate] = useState("");


  useEffect(() => {
    if (!selectedDate) return;
    setLoading(true);
    const fetchCalendar = async () => {
      try {
        
        const startDate = new Date(selectedDate);
        const promises = [];
        for(let i = 0; i < numWeeks; i++) {
          const date = addDays(startDate, i * 7);
          const dateStr = format(date, "yyyy-MM-dd");
          promises.push(fetch(`http://localhost:5000/api/slots/getSlotStatusByDate/${dateStr}`).then(res => res.json()));
        }
        const results = await Promise.all(promises);

        const calendarData: CalendarDay[] = results.map((data, index) => {
          const date = addDays(startDate, index * 7);
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
        setSelectedSlots([]);
      } catch (error) {
        console.error("Lỗi khi fetch calendar:", error);
      }
    };

    fetchCalendar();
  }, [selectedDate]);


  const toggleSlotSelection = (dayIndex: number, slotIndex: number) => {
    const slot = calendar[dayIndex].slots[slotIndex];

    if (slot.availableCourts === 0) return;

    setSelectedSlots(prev => {
      const exists = prev.find(s => s.slot_id === slot.slot_id);
      if (exists) {
        return prev.filter(s => s.slot_id !== slot.slot_id);
      } else {
        return [...prev, slot];
      }
    });
  };

  const handleCreateBooking = () => {
    if (selectedSlots.length === 0) {
      alert("Chưa chọn slot nào!");
      return;
    }

    const isWeekly = numWeeks > 1;
    const newBookingSlots: SlotInput[] = [];

    selectedSlots.forEach(slot => {
      if (isWeekly) {
        for (let i = 0; i < numWeeks; i++) {
          const newDate = format(addDays(new Date(), i * 7), "yyyy-MM-dd");
          newBookingSlots.push({
            booking_id: "new",
            slot_id: slot.slot_id,
            date: newDate,
            is_recurring: true,
            recurring_day: new Date(slot.start_time).getDay(),
            num_weeks: numWeeks,
          });
        }
      } else {
        newBookingSlots.push({
          booking_id: "new",
          slot_id: slot.slot_id,
          date: format(new Date(), "yyyy-MM-dd"),
          is_recurring: false,
          recurring_day: null,
          num_weeks: null,
        });
      }
    });


    console.log("Booking data:", newBookingSlots);
    alert(`Tạo booking cho ${newBookingSlots.length} slot!`);


    setSelectedSlots([]);
  };


  const filteredBookings = bookings.filter((booking) => {


    const matchesStatus = !statusFilter || booking.status === statusFilter;

    return matchesStatus;
  });

  // if (loading) return <p className="text-center mt-10 text-gray-500">Đang tải dữ liệu...</p>;

  return (
    <div className="p-6">
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold">Quản Lý Đặt Sân</h1>
          <div className="flex items-center gap-4">

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xác nhận</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="CANCELLED">Đã hủy</option>
              <option value="COMPLETED">Hoàn thành</option>
            </select>

            <button
              onClick={handleCreateBooking}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Tạo booking cho các slot đã chọn
            </button>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="mb-4 flex items-center gap-2">
            <label className="font-semibold">Chọn ngày:</label>
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
              className="w-full max-w-xs px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="font-semibold">Booking hằng tuần:</label>
            <input
              type="number"
              min={1}
              max={12}
              value={numWeeks}
              onChange={(e) => setNumWeeks(parseInt(e.target.value))}
              className="w-16 border px-2 py-1 rounded"
            />
            <span>tuần</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {calendar.map((day, dayIndex) => (
            <div key={day.date} className="border rounded p-2">
              <div className="font-semibold mb-2">{format(new Date(day.date), "dd/MM/yyyy")}</div>
              {day.slots.map((slot, slotIndex) => {
                const isSelected = selectedSlots.find(s => s.slot_id === slot.slot_id);
                return (
                  <div
                    key={slot.slot_id}
                    className={`p-2 rounded mb-1 text-center text-sm cursor-pointer ${slot.availableCourts === 0
                      ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                      : selectedSlots.find(s => s.slot_id === slot.slot_id)
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
        </div>
      </div>
    </div>
  );
}
