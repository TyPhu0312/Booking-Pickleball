// app/dat-san/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation"; // LẤY PARAM TỪ URL
import { format, differenceInWeeks, addDays } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface SlotAvailability {
  slot_id: number;
  start_time: string;
  end_time: string;
  available_courts: number;
  total_courts: number;
}

const SLOTS: SlotAvailability[] = [
  { slot_id: 1, start_time: "06:00", end_time: "07:00", available_courts: 3, total_courts: 4 },
  { slot_id: 2, start_time: "07:00", end_time: "08:00", available_courts: 4, total_courts: 4 },
  { slot_id: 3, start_time: "08:00", end_time: "09:00", available_courts: 2, total_courts: 4 },
  { slot_id: 4, start_time: "15:00", end_time: "16:00", available_courts: 4, total_courts: 4 },
  { slot_id: 5, start_time: "16:00", end_time: "17:00", available_courts: 1, total_courts: 4 },
  { slot_id: 6, start_time: "17:00", end_time: "18:00", available_courts: 3, total_courts: 4 },
  { slot_id: 7, start_time: "19:00", end_time: "20:00", available_courts: 0, total_courts: 4 },
  { slot_id: 8, start_time: "20:00", end_time: "21:00", available_courts: 0, total_courts: 4 },
  { slot_id: 9, start_time: "21:00", end_time: "22:00", available_courts: 0, total_courts: 4 },
];

const PRICE_PER_HOUR = 100000;
const MAX_CONSECUTIVE_SLOTS = 5;
const MAX_WEEKS = 12;

type BookingType = "once" | "weekly" | "tournament";

export default function BookingPage() {
  const searchParams = useSearchParams();
  const urlDate = searchParams.get("date");
  const urlSlot = searchParams.get("slot");

  const [bookingType, setBookingType] = useState<BookingType>("once");
  const [selectedDate, setSelectedDate] = useState("");
  const [weeklyStartDate, setWeeklyStartDate] = useState("");
  const [weeklyEndDate, setWeeklyEndDate] = useState("");
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [slotData, setSlotData] = useState<SlotAvailability[]>(SLOTS);

  // Tính số tuần
  const getTotalWeeks = () => {
    if (!weeklyStartDate || !weeklyEndDate) return 0;
    const start = new Date(weeklyStartDate);
    const end = new Date(weeklyEndDate);
    if (end < start) return 0;
    return Math.floor(differenceInWeeks(end, start)) + 1;
  };

  const totalWeeks = getTotalWeeks();
  const isValidWeekly = totalWeeks > 0 && totalWeeks <= MAX_WEEKS;

  // TỰ ĐỘNG CHỌN NGÀY + SLOT TỪ URL
  useEffect(() => {
    if (urlDate && urlSlot) {
      const slotId = Number(urlSlot);
      const slotExists = SLOTS.find(s => s.slot_id === slotId);
      
      if (slotExists && slotExists.available_courts > 0) {
        setBookingType("once");
        setSelectedDate(urlDate);
        setSelectedSlots([slotId]);
      }
    }
  }, [urlDate, urlSlot]);

  // Cập nhật slot theo ngày
  useEffect(() => {
    const date = bookingType === "weekly" ? weeklyStartDate : selectedDate;
    if (!date) return;

    const fetchSlots = () => {
      setSlotData(SLOTS);
    };
    fetchSlots();
    const interval = setInterval(fetchSlots, 30000);
    return () => clearInterval(interval);
  }, [selectedDate, weeklyStartDate, bookingType]);

  // Kiểm tra slot liên tiếp
  const isConsecutive = (slots: number[]) => {
    if (slots.length <= 1) return true;
    const sorted = [...slots].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] !== sorted[i - 1] + 1) return false;
    }
    return true;
  };

  const handleSlotToggle = (slotId: number) => {
    const slot = slotData.find((s) => s.slot_id === slotId);
    if (!slot || slot.available_courts === 0) return;

    const newSlots = selectedSlots.includes(slotId)
      ? selectedSlots.filter((s) => s !== slotId)
      : [...selectedSlots, slotId];

    if (newSlots.length > MAX_CONSECUTIVE_SLOTS) {
      alert(`Tối đa ${MAX_CONSECUTIVE_SLOTS} slot liên tiếp!`);
      return;
    }
    if (!isConsecutive(newSlots)) {
      alert("Chỉ được chọn các slot liên tiếp!");
      return;
    }

    setSelectedSlots(newSlots.sort((a, b) => a - b));
  };

  const getPricePerWeek = () => selectedSlots.length * PRICE_PER_HOUR;
  const getTotalPrice = () => getPricePerWeek() * (bookingType === "weekly" ? totalWeeks : 1);

  const handleSubmit = () => {
    if (selectedSlots.length === 0) return alert("Vui lòng chọn slot!");

    if (bookingType === "weekly") {
      if (selectedWeekdays.length === 0) return alert("Chọn ít nhất 1 thứ!");
      if (!isValidWeekly) return alert(`Chọn ngày kết thúc (tối đa ${MAX_WEEKS} tuần)!`);
    }

    const pricePerWeek = getPricePerWeek();
    const total = getTotalPrice();
    const slotsText = selectedSlots
      .map((id) => {
        const s = slotData.find((slot) => slot.slot_id === id);
        return s ? `${s.start_time}-${s.end_time}` : "";
      })
      .join(" → ");

    let message = `Đặt slot thành công!\n`;
    message += `Loại: ${bookingType === "once" ? "1 lần" : bookingType === "weekly" ? "Hàng tuần" : "Giải đấu"}\n`;

    if (bookingType === "once" || bookingType === "tournament") {
      message += `Ngày: ${format(new Date(selectedDate),"dd 'tháng' MM 'năm' yyyy")}\n`;
    } else {
      message += `Từ: ${format(new Date(weeklyStartDate), "dd 'tháng' MM 'năm' yyyy")}\n`;
      message += `Đến: ${format(new Date(weeklyEndDate), "dd 'tháng' MM 'năm' yyyy")}\n`;
      message += `Số tuần: ${totalWeeks}\n`;
      const days = selectedWeekdays.map((d) => ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][d]).join(", ");
      message += `Lặp lại: ${days}\n`;
    }

    message += `Slot: ${slotsText}\n`;
    message += `Giá mỗi tuần: ${pricePerWeek.toLocaleString()} VNĐ\n`;
    message += `Tổng cộng: ${total.toLocaleString()} VNĐ\n`;
    message += `Đến sân sẽ được giao sân trống.`;

    if (bookingType === "tournament") {
      message += `\nGhi chú: ${note || "Không có"}`;
    }

    alert(message);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Đặt Slot Sân Pickleball</h1>

        {/* THÔNG BÁO TỰ ĐỘNG CHỌN */}
        {urlDate && urlSlot && selectedSlots.length > 0 && (
          <div className="bg-green-50 border border-green-300 text-green-800 p-4 rounded-xl mb-6 text-sm">
            Đã tự động chọn: <strong>{format(new Date(urlDate), "dd 'tháng' MM 'năm' yyyy")}</strong> - Slot <strong>
              {SLOTS.find(s => s.slot_id === Number(urlSlot))?.start_time}
            </strong>
          </div>
        )}

        {/* Thông báo */}
        <div className="bg-amber-50 border border-amber-300 text-amber-800 p-4 rounded-xl mb-8 text-sm">
          <strong>Lưu ý:</strong> Bạn chỉ đặt slot thời gian. 
          Đến sân sẽ được giao sân trống (không chọn sân trước).
        </div>

        {/* Chọn loại đặt */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { type: "once" as const, label: "Đặt 1 lần", icon: "Single" },
            { type: "weekly" as const, label: "Đặt hàng tuần", icon: "Repeat" },
            { type: "tournament" as const, label: "Đặt cho giải đấu", icon: "Trophy" },
          ].map((item) => (
            <button
              key={item.type}
              onClick={() => {
                setBookingType(item.type);
                setSelectedSlots([]);
                setSelectedWeekdays([]);
                setWeeklyStartDate("");
                setWeeklyEndDate("");
                // Nếu chuyển sang weekly/tournament → bỏ chọn từ URL
                if (item.type !== "once") {
                  setSelectedDate("");
                }
              }}
              className={`p-6 rounded-xl border-2 transition-all ${
                bookingType === item.type
                  ? "border-blue-600 bg-blue-50 shadow-lg"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="font-semibold">{item.label}</div>
            </button>
          ))}
        </div>

        {/* Chọn ngày (1 lần / giải đấu) */}
        {(bookingType === "once" || bookingType === "tournament") && (
          <div className="mb-8">
            <label className="block text-lg font-medium mb-3">Chọn Ngày</label>
            <DatePicker
            selected={selectedDate ? new Date(selectedDate) : null}
            onChange={(date) => {
              if (date instanceof Date && !isNaN(date.getTime())) {
                const formatted = date.toISOString().split("T")[0]; // => "2025-11-03"
                setSelectedDate(formatted);
              } else {
                setSelectedDate("");
              }
            }}
            dateFormat="dd/MM/yyyy" 
            className="w-full max-w-xs px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Đặt hàng tuần */}
        {bookingType === "weekly" && (
          <>
            <div className="mb-6 grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-lg font-medium mb-3">Ngày Bắt Đầu</label>
                <DatePicker 
                  selected={weeklyStartDate ? new Date(weeklyStartDate) : null}
                  onChange={(date) => {
                    if (date instanceof Date && !isNaN(date.getTime())) {
                      const formatted = date.toISOString().split("T")[0];
                      setWeeklyStartDate(formatted);
                      setSelectedSlots([]);
                    } else {
                      setWeeklyStartDate("");
                    }
                  }}
                  dateFormat="dd/MM/yyyy" 
                  minDate={new Date()}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-lg font-medium mb-3">Ngày Kết Thúc</label>
                <DatePicker
                  selected={weeklyEndDate ? new Date(weeklyEndDate) : null}
                  onChange={(date) => {
                    if (date instanceof Date && !isNaN(date.getTime())) {
                      const formatted = date.toISOString().split("T")[0];
                      setWeeklyEndDate(formatted);
                      setSelectedSlots([]);
                    } else {
                      setWeeklyEndDate("");
                    }
                  }}
                  dateFormat="dd/MM/yyyy" 
                  minDate={weeklyStartDate ? new Date(weeklyStartDate) : new Date()}
                  maxDate={weeklyStartDate ? addDays(new Date(weeklyStartDate), MAX_WEEKS * 7) : undefined}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {weeklyStartDate && weeklyEndDate && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="font-medium">
                  Đặt trong <span className="text-blue-600 font-bold">{totalWeeks}</span> tuần
                  {totalWeeks > MAX_WEEKS && " (vượt giới hạn)"}
                </p>
              </div>
            )}

            <div className="mb-8">
              <label className="block text-lg font-medium mb-3">Chọn Thứ Trong Tuần</label>
              <div className="flex flex-wrap gap-3">
                {[1, 2, 3, 4, 5, 6, 0].map((day) => (
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
                    <span className="font-medium">{["CN", "T2", "T3", "T4", "T5", "T6", "T7"][day]}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Chọn giải đấu */}
        {bookingType === "tournament" && (
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
        )}

        {/* Hiển thị slot */}
        {(selectedDate || (bookingType === "weekly" && weeklyStartDate && selectedWeekdays.length > 0)) && (
          <>
            <h2 className="text-xl font-semibold mb-4">
              Chọn Slot Liên Tiếp (Tối đa {MAX_CONSECUTIVE_SLOTS})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
              {slotData.map((slot) => {
                const isSelected = selectedSlots.includes(slot.slot_id);
                const isBooked = slot.available_courts === 0;

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
                      {isBooked ? "Hết" : `Còn ${slot.available_courts} sân`}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Ghi chú giải đấu */}
        {bookingType === "tournament" && (
          <div className="mb-6">
            <label className="block text-lg font-medium mb-3">Ghi Chú Giải Đấu</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Số đội, yêu cầu sân, v.v."
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
        )}

        {/* Tổng kết */}
        {selectedSlots.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-xl mb-6 border">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Giá mỗi tuần:</span>
                <span className="font-bold">{getPricePerWeek().toLocaleString()} VNĐ</span>
              </div>
              {bookingType === "weekly" && (
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Tổng cộng ({totalWeeks} tuần):</span>
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
        )}

        {/* Nút xác nhận */}
        <div className="text-center">
          <button
            onClick={handleSubmit}
            disabled={
              selectedSlots.length === 0 ||
              (bookingType === "weekly" && (!isValidWeekly || selectedWeekdays.length === 0))
            }
            className={`
              px-12 py-4 rounded-xl font-bold text-lg transition-all transform
              ${selectedSlots.length > 0 && (bookingType !== "weekly" || (isValidWeekly && selectedWeekdays.length > 0))
                ? "bg-gradient-to-r from-green-500 to-green-600 text-white hover:scale-105 shadow-lg"
                : "bg-gray-400 text-gray-700 cursor-not-allowed"
              }
            `}
          >
            Xác Nhận Đặt Slot
          </button>
        </div>
      </div>
    </div>
  );
}