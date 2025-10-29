// app/dang-ky-giai-dau/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";

const TOURNAMENTS = [
  {
    id: 1,
    name: "Giải Pickleball Mùa Thu 2025",
    date: "15/11 → 16/11/2025",
    teams: "12/16",
    fee: 500000,
    members: "2 người",
  },
  {
    id: 2,
    name: "Giải Doanh Nghiệp 2025",
    date: "01/12 → 03/12/2025",
    teams: "28/32",
    fee: 1000000,
    members: "2-4 người",
  },
];

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const tournamentId = searchParams.get("tournament");

  const [selectedId, setSelectedId] = useState(tournamentId || "");
  const [teamName, setTeamName] = useState("");
  const [player1, setPlayer1] = useState({ name: "", phone: "", email: "" });
  const [player2, setPlayer2] = useState({ name: "", phone: "", email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tournament = TOURNAMENTS.find(t => t.id === Number(selectedId));

  // Tự động chọn nếu có URL
  useEffect(() => {
    if (tournamentId && !selectedId) {
      setSelectedId(tournamentId);
    }
  }, [tournamentId, selectedId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournament || !teamName || !player1.name || !player2.name) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      alert(
        `ĐĂNG KÝ THÀNH CÔNG!\n` +
        `Đội: ${teamName}\n` +
        `Giải: ${tournament.name}\n` +
        `Phí: ${tournament.fee.toLocaleString()} VNĐ`
      );
      // Reset form
      setTeamName("");
      setPlayer1({ name: "", phone: "", email: "" });
      setPlayer2({ name: "", phone: "", email: "" });
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Đăng Ký Giải Đấu</h1>
          <p className="text-gray-600">Chỉ 2 phút để tham gia!</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-8 space-y-6">

          {/* Chọn giải đấu - Ẩn nếu có URL */}
          {!tournamentId && (
            <div>
              <label className="block text-lg font-semibold mb-3 text-gray-700">Chọn Giải Đấu</label>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full px-5 py-3 border-2 border-gray-300 rounded-xl text-lg focus:border-blue-500 focus:outline-none"
                required
              >
                <option value="">-- Chọn giải --</option>
                {TOURNAMENTS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.teams} đội)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Thông tin giải */}
          {tournament && (
            <div className="bg-gradient-to-r from-blue-100 to-cyan-100 p-5 rounded-2xl border">
              <h3 className="font-bold text-xl text-blue-900">{tournament.name}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                <p><strong>Ngày:</strong> {tournament.date}</p>
                <p><strong>Đội:</strong> {tournament.teams}</p>
                <p><strong>Phí:</strong> <span className="text-green-600 font-bold">{tournament.fee.toLocaleString()} VNĐ</span></p>
                <p><strong>Thành viên:</strong> {tournament.members}</p>
              </div>
            </div>
          )}

          {/* Tên đội */}
          <div>
            <label className="block text-lg font-semibold mb-3 text-gray-700">Tên Đội</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="VD: Sao Mai Pro"
              className="w-full px-5 py-3 border-2 border-gray-300 rounded-xl text-lg focus:border-green-500 focus:outline-none"
              required
              maxLength={20}
            />
          </div>

          {/* Thành viên 1 */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-700">Thành viên 1</h4>
            <input
              type="text"
              value={player1.name}
              onChange={(e) => setPlayer1({ ...player1, name: e.target.value })}
              placeholder="Họ và tên"
              className="w-full px-4 py-2 border rounded-lg focus:border-blue-500 focus:outline-none"
              required
            />
            <input
              type="tel"
              value={player1.phone}
              onChange={(e) => setPlayer1({ ...player1, phone: e.target.value })}
              placeholder="Số điện thoại"
              className="w-full px-4 py-2 border rounded-lg focus:border-blue-500 focus:outline-none"
              required
            />
            <input
              type="email"
              value={player1.email}
              onChange={(e) => setPlayer1({ ...player1, email: e.target.value })}
              placeholder="Email"
              className="w-full px-4 py-2 border rounded-lg focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Thành viên 2 */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-700">Thành viên 2</h4>
            <input
              type="text"
              value={player2.name}
              onChange={(e) => setPlayer2({ ...player2, name: e.target.value })}
              placeholder="Họ và tên"
              className="w-full px-4 py-2 border rounded-lg focus:border-blue-500 focus:outline-none"
              required
            />
            <input
              type="tel"
              value={player2.phone}
              onChange={(e) => setPlayer2({ ...player2, phone: e.target.value })}
              placeholder="Số điện thoại"
              className="w-full px-4 py-2 border rounded-lg focus:border-blue-500 focus:outline-none"
              required
            />
            <input
              type="email"
              value={player2.email}
              onChange={(e) => setPlayer2({ ...player2, email: e.target.value })}
              placeholder="Email"
              className="w-full px-4 py-2 border rounded-lg focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Nút gửi */}
          <div className="text-center pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !tournament}
              className={`px-12 py-4 rounded-full font-bold text-xl transition-all transform ${
                !isSubmitting && tournament
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:scale-105 shadow-xl"
                  : "bg-gray-400 text-gray-700 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? "Đang gửi..." : "Đăng Ký Ngay"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}