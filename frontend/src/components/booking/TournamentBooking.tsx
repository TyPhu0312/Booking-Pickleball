"use client";

import { format } from "date-fns";
import DatePicker from "react-datepicker";
import { useState, useEffect } from "react";
import { API_URL } from "@/lib/config";

type CourtType = "INDOOR" | "OUTDOOR";

interface CourtsMultiplier {
  type: CourtType;
  multiplier: number;
}

interface Tournament {
  tournamentID: string;
  name: string;
  start_day: string;
  description?: string;
  status: string;
  max_teams: number;
}

interface TournamentBookingProps {
  StartDate: string;
  EndDate: string;
  selectedCourtType: string;
  selectedTournament: string | null;
  courtsMultiplier: CourtsMultiplier[];
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onCourtTypeChange: (type: string) => void;
  onTournamentChange: (tournament: string | null) => void;
}



export default function TournamentBooking({
  StartDate,
  EndDate,
  selectedCourtType,
  selectedTournament,
  courtsMultiplier,
  onStartDateChange,
  onEndDateChange,
  onCourtTypeChange,
  onTournamentChange,
}: TournamentBookingProps) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserTournaments = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) return;

        const user = JSON.parse(storedUser);
        setLoading(true);

        const res = await fetch(`${API_URL}/api/tournaments/upcoming/user/${user.userID}`);
        if (!res.ok) throw new Error("Không thể tải giải đấu");

        const data = await res.json();
        setTournaments(data);
      } catch (error) {
        console.error("Error fetching tournaments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserTournaments();
  }, []);

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
              disabled={!selectedTournament}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
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
              disabled={!selectedTournament}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 shadow-sm text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
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
              disabled={!selectedTournament}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-sm shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
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

      <div className="flex justify-center">
        <div className="mb-8 max-w-lg w-full">
          <div className="bg-linear-to-r from-yellow-50 to-orange-100 p-4 rounded-xl shadow-sm border border-yellow-200">
            <label className="text-md font-medium mb-2 text-yellow-800 flex items-center gap-1">
              🏆 Chọn Giải Đấu *
            </label>
            <select
              value={selectedTournament || ""}
              onChange={(e) => onTournamentChange(e.target.value || null)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-sm shadow-sm"
              disabled={loading}
            >
              <option value="">
                {loading ? "Đang tải..." : tournaments.length === 0 ? "Không có giải đấu sắp tới" : "-- Chọn giải đấu --"}
              </option>
              {tournaments.map((tournament) => (
                <option key={tournament.tournamentID} value={tournament.tournamentID}>
                  {tournament.name} - {format(new Date(tournament.start_day), "dd/MM/yyyy")}
                </option>
              ))}
            </select>
            {tournaments.length === 0 && !loading && (
              <p className="text-xs text-red-600 font-semibold mt-2">
                ⚠️ Bạn chưa tạo giải đấu nào. Vui lòng tạo giải đấu trước khi đặt sân.
              </p>
            )}
            {selectedTournament && (
              <p className="text-xs text-green-600 font-semibold mt-2">
                ✅ Đã chọn giải đấu. Bạn có thể chọn ngày và loại sân.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
