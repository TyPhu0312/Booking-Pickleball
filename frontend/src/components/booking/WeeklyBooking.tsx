"use client";

import { useEffect } from "react";
import { format, differenceInWeeks } from "date-fns";
import DatePicker from "react-datepicker";

type CourtType = "INDOOR" | "OUTDOOR";

interface CourtsMultiplier {
  type: CourtType;
  multiplier: number;
}

interface WeeklyBookingProps {
  StartDate: string;
  EndDate: string;
  numberWeeks: number;
  selectedWeekdays: number[];
  selectedCourtType: string;
  courtsMultiplier: CourtsMultiplier[];
  maxWeeks: number;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onNumberWeeksChange: (weeks: number) => void;
  onWeekdaysChange: (weekdays: number[]) => void;
  onCourtTypeChange: (type: string) => void;
}

export default function WeeklyBooking({
  StartDate,
  EndDate,
  numberWeeks,
  selectedWeekdays,
  selectedCourtType,
  courtsMultiplier,
  maxWeeks,
  onStartDateChange,
  onEndDateChange,
  onNumberWeeksChange,
  onWeekdaysChange,
  onCourtTypeChange,
}: WeeklyBookingProps) {
  useEffect(() => {
    if (StartDate && EndDate) {
      const start = new Date(StartDate);
      const end = new Date(EndDate);
      
      if (end > start) {
        const weeks = differenceInWeeks(end, start) + 1; 
        const calculatedWeeks = Math.min(weeks, maxWeeks);
        
        if (calculatedWeeks !== numberWeeks) {
          onNumberWeeksChange(calculatedWeeks);
        }
      }
    }
  }, [StartDate, EndDate, maxWeeks, numberWeeks, onNumberWeeksChange]);

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-lg p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="bg-linear-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border-2 border-blue-200 mb-3 ">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">ℹ️</span>
            <h3 className="font-bold text-blue-900">Lưu ý về sân</h3>
          </div>
          <p className="text-sm text-blue-700 leading-relaxed">
            Bạn chỉ cần chọn <strong>loại sân</strong> (Trong nhà/Ngoài trời). 
            <br />
            🎯 <strong>Sân cụ thể</strong> sẽ được <strong>Admin phân bổ</strong> sau khi xác nhận booking.
            <br />
            📞 Bạn sẽ nhận được thông báo khi Admin chọn sân cho bạn.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="flex flex-col">
            <label className="text-sm font-semibold mb-2 text-blue-700 flex items-center gap-1">
              📅 Ngày Bắt Đầu
            </label>
            <DatePicker
              selected={StartDate ? new Date(StartDate) : null}
              onChange={(date) => {
                if (date instanceof Date && !isNaN(date.getTime())) {
                  const formatted = format(date, 'yyyy-MM-dd');
                  onStartDateChange(formatted);
                } else {
                  onStartDateChange("");
                }
              }}
              dateFormat="dd/MM/yyyy"
              minDate={new Date()}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm text-sm"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold mb-2 text-green-700 flex items-center gap-1">
              📅 Ngày Kết Thúc
            </label>
            <DatePicker
              selected={EndDate ? new Date(EndDate) : null}
              onChange={(date) => {
                if (date instanceof Date && !isNaN(date.getTime())) {
                  const formatted = format(date, 'yyyy-MM-dd');
                  onEndDateChange(formatted);
                } else {
                  onEndDateChange("");
                }
              }}
              dateFormat="dd/MM/yyyy"
              minDate={new Date()}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 shadow-sm text-sm"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2 text-gray-700">📅 Chọn Thứ Trong Tuần</label>
          <div className="flex flex-wrap gap-3">
            {[0, 1, 2, 3, 4, 5, 6].map((day) => (
              <label key={day} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedWeekdays.includes(day)}
                  onChange={(e) =>
                    onWeekdaysChange(
                      e.target.checked
                        ? [...selectedWeekdays, day]
                        : selectedWeekdays.filter((d) => d !== day)
                    )
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium">
                  {["CN", "T2", "T3", "T4", "T5", "T6", "T7"][day]}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2 text-gray-700">🔁 Số Tuần Lặp Lại</label>
          <div className="bg-gray-50 px-4 py-3 border border-gray-300 rounded-lg text-sm max-w-xs">
            <span className="font-bold text-lg text-blue-600">{numberWeeks}</span>
            <span className="text-gray-600 ml-2">tuần</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">Tự động tính dựa trên ngày bắt đầu và kết thúc</p>
        </div>

        <div className="bg-linear-to-r from-purple-50 to-purple-100 p-4 rounded-xl shadow-sm border border-purple-200 flex flex-col">
          <label className="text-md font-medium mb-2 text-purple-800 flex items-center gap-1">
            🏟️ Loại sân
          </label>
          <select
            value={selectedCourtType}
            onChange={(e) => onCourtTypeChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-sm shadow-sm"
          >
            <option value="">-- Chọn loại sân --</option>
            {courtsMultiplier.length > 0 ? (
              courtsMultiplier.map((courtMultiplier) => (
                <option key={courtMultiplier.type} value={courtMultiplier.type}>
                  {courtMultiplier.type === "INDOOR" ? "Sân trong nhà" : "Sân ngoài trời"}
                </option>
              ))
            ) : (
              <option disabled>Không có loại sân nào</option>
            )}
          </select>
        </div>

        
      </div>
    </div>
  );
}
