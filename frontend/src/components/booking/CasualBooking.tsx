"use client";

import { format } from "date-fns";
import DatePicker from "react-datepicker";

type CourtType = "INDOOR" | "OUTDOOR";

interface CourtsMultiplier {
  type: CourtType;
  multiplier: number;
}

interface CasualBookingProps {
  StartDate: string;
  EndDate: string;
  selectedCourtType: string;
  courtsMultiplier: CourtsMultiplier[];
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onCourtTypeChange: (type: string) => void;
}

export default function CasualBooking({
  StartDate,
  EndDate,
  selectedCourtType,
  courtsMultiplier,
  onStartDateChange,
  onEndDateChange,
  onCourtTypeChange,
}: CasualBookingProps) {
  return (
    <>
    <div className="flex justify-center">
        <div className="mb-6 max-w-lg w-full">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border-2 border-blue-200">
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
        </div>
      </div>
      <div className="flex justify-center">
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg w-full">
          <div className="bg-linear-to-r from-blue-50 to-blue-100 p-4 rounded-xl shadow-sm border border-blue-200 flex flex-col">
            <label className="text-md font-medium mb-2 text-blue-800 flex items-center gap-1">
              📅 Ngày Bắt đầu
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

          <div className="bg-linear-to-r from-green-50 to-green-100 p-4 rounded-xl shadow-sm border border-green-200 flex flex-col">
            <label className="text-md font-medium mb-2 text-green-800 flex items-center gap-1">
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
      </div>

      <div className="flex justify-center">
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg w-full">
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

      
    </>
  );
}
