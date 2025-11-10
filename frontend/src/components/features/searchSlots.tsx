"use client";

import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
interface Slot {
  slot_id: number;
  start_time: string;
  end_time: string;
  available_courts: number;
  total_courts: number;
}

const SLOTS: Slot[] = [
  { slot_id: 1, start_time: "06:00", end_time: "07:00", available_courts: 3, total_courts: 4 },
  { slot_id: 2, start_time: "07:00", end_time: "08:00", available_courts: 0, total_courts: 4 },
  { slot_id: 3, start_time: "08:00", end_time: "09:00", available_courts: 2, total_courts: 4 },
  { slot_id: 4, start_time: "15:00", end_time: "16:00", available_courts: 4, total_courts: 4 },
  { slot_id: 5, start_time: "16:00", end_time: "17:00", available_courts: 1, total_courts: 4 },
  { slot_id: 6, start_time: "17:00", end_time: "18:00", available_courts: 3, total_courts: 4 },
  { slot_id: 7, start_time: "19:00", end_time: "20:00", available_courts: 0, total_courts: 4 },
  { slot_id: 8, start_time: "20:00", end_time: "21:00", available_courts: 2, total_courts: 4 },
  { slot_id: 9, start_time: "21:00", end_time: "22:00", available_courts: 1, total_courts: 4 },
];

export default function SearchSlotPage() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [courtType, setCourtType] = useState<"all" | "indoor" | "outdoor">("all");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSlots = () => {
    setLoading(true);
    setTimeout(() => {
      const baseSlots = [...SLOTS];
      const filtered = baseSlots.map(slot => ({
        ...slot,
        available_courts: Math.floor(Math.random() * 5), 
      }));
      setSlots(filtered);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    fetchSlots();
    const interval = setInterval(fetchSlots, 10000); 
    return () => clearInterval(interval);
  }, [selectedDate, courtType]);

  const getCourtLabel = (slot: Slot) => {
    if (slot.available_courts === 0) return "Hết sân";
    if (slot.available_courts === slot.total_courts) return "Còn trống tất cả";
    return `Còn ${slot.available_courts}/${slot.total_courts} sân`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">Tìm Slot Trống</h1>
          <p className="text-gray-600">Chọn ngày để xem sân còn trống</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-lg font-semibold mb-3 text-gray-700">Chọn Ngày</label>
              <DatePicker
                selected={selectedDate ? new Date(selectedDate) : null}
                onChange={(date) => {
                  if (date instanceof Date && !isNaN(date.getTime())) {
                    const formatted = date.toISOString().split("T")[0]; 
                    setSelectedDate(formatted);
                  } else {
                    setSelectedDate("");
                  }
                }}
                minDate={new Date()}
                maxDate={addDays(new Date(), 30)}
                dateFormat="dd/MM/yyyy" 
                className="w-full px-5 py-3 border-2 border-gray-300 rounded-xl text-lg focus:border-blue-500 focus:outline-none"
                placeholderText="Chọn ngày"
              />
              
            </div>
            <div>
              <label className="block text-lg font-semibold mb-3 text-gray-700">Loại Sân</label>
              <select
                value={courtType}
                onChange={(e) => setCourtType(e.target.value as any)}
                className="w-full px-5 py-3 border-2 border-gray-300 rounded-xl text-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="all">Tất cả sân</option>
                <option value="indoor">Sân trong nhà</option>
                <option value="outdoor">Sân ngoài trời</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Slot Trống – {format(new Date(selectedDate), "dd/MM/yyyy (EEEE)")}
            </h2>
            <span className="text-sm text-gray-500">Cập nhật mỗi 10s</span>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              <p className="mt-3 text-gray-600">Đang tải...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {slots.map((slot) => {
                const isAvailable = slot.available_courts > 0;
                return (
                  <div
                    key={slot.slot_id}
                    className={`rounded-xl p-4 text-center transition-all ${
                      isAvailable
                        ? "bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300 hover:shadow-lg hover:scale-105"
                        : "bg-gray-100 border-2 border-gray-300 opacity-60"
                    }`}
                  >
                    <div className="font-bold text-lg text-gray-800">
                      {slot.start_time} - {slot.end_time}
                    </div>
                    <div className={`text-sm mt-1 font-medium ${
                      isAvailable ? "text-green-600" : "text-red-600"
                    }`}>
                      {getCourtLabel(slot)}
                    </div>
                    {isAvailable && (
                      <a
                        href={`/bookings?date=${selectedDate}&slot=${slot.slot_id}`}
                        className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
                      >
                        Đặt Ngay
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            <strong>Lưu ý:</strong> Sân sẽ được giao khi bạn đến. 
            Vui lòng đến trước 5 phút để nhận sân.
          </p>
        </div>
      </div>
    </div>
  );
}