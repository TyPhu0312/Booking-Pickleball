"use client";

import { format } from "date-fns";
import DatePicker from "react-datepicker";
import { useState, useEffect } from "react";

type CourtType = "INDOOR" | "OUTDOOR";

interface Courts {
  courtID?: string;
  name?: string;
  image: string;
  status?: string;
  type: CourtType;
  multiplier: number;
}

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
  selectedCourt: Courts | null;
  selectedTournament: number | null;
  courtsMultiplier: CourtsMultiplier[];
  courts: Courts[] | null;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onCourtTypeChange: (type: string) => void;
  onCourtChange: (court: Courts | null) => void;
  onTournamentChange: (tournament: number | null) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function TournamentBooking({
  StartDate,
  EndDate,
  selectedCourtType,
  selectedCourt,
  selectedTournament,
  courtsMultiplier,
  courts,
  onStartDateChange,
  onEndDateChange,
  onCourtTypeChange,
  onCourtChange,
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

          <div className="bg-linear-to-r from-pink-50 to-pink-100 p-4 rounded-xl shadow-sm border border-pink-200 flex flex-col">
            <label className="text-md font-medium mb-2 text-pink-800 flex items-center gap-1">
              🎾 Chọn sân
            </label>
            <select
              value={selectedCourt?.courtID || ""}
              onChange={(e) => {
                const court = courts?.find((c) => c.courtID === e.target.value) || null;
                onCourtChange(court);
              }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-pink-400 text-sm shadow-sm"
            >
              <option value="">-- Chọn sân --</option>
              {courts && courts.length > 0 ? (
                courts.map((court) => (
                  <option key={court.courtID} value={court.courtID}>
                    {court.name}
                  </option>
                ))
              ) : (
                <option disabled>Đã hết sân</option>
              )}
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="mb-8 max-w-lg w-full">
          <div className="bg-linear-to-r from-yellow-50 to-orange-100 p-4 rounded-xl shadow-sm border border-yellow-200">
            <label className="block text-md font-medium mb-2 text-yellow-800 flex items-center gap-1">
              🏆 Chọn Giải Đấu
            </label>
            <select
              value={selectedTournament || ""}
              onChange={(e) => onTournamentChange(Number(e.target.value) || null)}
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
              <p className="text-xs text-gray-600 mt-2">
                Bạn chưa tạo giải đấu nào. Hãy tạo giải đấu trong trang Admin.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
