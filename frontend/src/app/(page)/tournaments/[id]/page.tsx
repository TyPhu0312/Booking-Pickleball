// app/giai-dau/[id]/page.tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";

// Dữ liệu giả theo DB
const TOURNAMENTS = [
  {
    tournament_id: 1,
    name: "Giải Pickleball Mùa Thu 2025",
    start_day: "2025-11-15",
    end_day: "2025-11-16",
    location: "Sao Mai Pickleball Center, TP.HCM",
    description: "Giải đấu thường niên dành cho mọi trình độ. Thể thức đấu đôi nam/nữ.",
    max_teams: 16,
    prize: "10.000.000 VNĐ",
    status: "upcoming", // upcoming, ongoing, finished
    image: "/tournament1.jpg",
  },
];

const TEAMS = [
  { team_id: 1, tournament_id: 1, team_name: "Sao Mai A", member_count: 2 },
  { team_id: 2, tournament_id: 1, team_name: "Bão Tố", member_count: 2 },
  { team_id: 3, tournament_id: 1, team_name: "Pickle Pro", member_count: 2 },
];

const MATCHES = [
  {
    match_id: 1,
    tournament_id: 1,
    team1_id: 1,
    team2_id: 2,
    court_id: 1,
    score_team1: null,
    score_team2: null,
    status: "scheduled",
    round: "Vòng 1",
    start_time: "09:00",
    end_time: "10:00",
  },
  {
    match_id: 2,
    tournament_id: 1,
    team1_id: 3,
    team2_id: 4,
    court_id: 2,
    score_team1: 11,
    score_team2: 8,
    status: "finished",
    round: "Vòng 1",
    start_time: "10:00",
    end_time: "11:00",
  },
];

export default function TournamentDetail({ params }: { params: { id: string } }) {
  const tournament = TOURNAMENTS.find((t) => t.tournament_id === Number(params.id));
  if (!tournament) notFound();

  const teams = TEAMS.filter((t) => t.tournament_id === tournament.tournament_id);
  const matches = MATCHES.filter((m) => m.tournament_id === tournament.tournament_id);
  const isFull = teams.length >= tournament.max_teams;
  const statusColor = {
    upcoming: "bg-blue-100 text-blue-800",
    ongoing: "bg-yellow-100 text-yellow-800",
    finished: "bg-green-100 text-green-800",
  }[tournament.status];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="md:flex">
            <div className="md:w-1/3">
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-64 md:h-full" />
            </div>
            <div className="md:w-2/3 p-8">
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{tournament.name}</h1>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusColor}`}>
                  {tournament.status === "upcoming" ? "Sắp diễn ra" :
                   tournament.status === "ongoing" ? "Đang diễn ra" : "Đã kết thúc"}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-6 text-gray-700">
                <div>
                  <p className="flex items-center gap-2 mb-2">
                    <span className="font-medium">Ngày:</span>
                    {format(new Date(tournament.start_day), "dd/MM/yyyy")}
                    {tournament.end_day && ` → ${format(new Date(tournament.end_day), "dd/MM/yyyy")}`}
                  </p>
                  <p className="flex items-center gap-2 mb-2">
                    <span className="font-medium">Địa điểm:</span>
                    {tournament.location}
                  </p>
                  <p className="flex items-center gap-2 mb-2">
                    <span className="font-medium">Giải thưởng:</span>
                    <span className="text-green-600 font-bold">{tournament.prize}</span>
                  </p>
                </div>
                <div>
                  <p className="flex items-center gap-2 mb-2">
                    <span className="font-medium">Số đội:</span>
                    {teams.length} / {tournament.max_teams}
                  </p>
                  <p className="flex items-center gap-2 mb-2">
                    <span className="font-medium">Trạng thái:</span>
                    {isFull ? "Đã đủ đội" : "Còn chỗ"}
                  </p>
                </div>
              </div>

              <p className="mt-6 text-gray-600 leading-relaxed">
                {tournament.description}
              </p>

              <div className="mt-8">
                            <a
                    href={`/registerTournament?tournament=${tournament.tournament_id}`}
                    className={`inline-block px-8 py-3 rounded-xl font-bold text-lg transition-all transform ${
                    !isFull && tournament.status === "upcoming"
                        ? "bg-gradient-to-r from-green-500 to-green-600 text-white hover:scale-105 shadow-lg"
                        : "bg-gray-400 text-gray-700 cursor-not-allowed pointer-events-none"
                    }`}
                >
                    {isFull ? "Đã đủ đội" : tournament.status !== "upcoming" ? "Không thể đăng ký" : "Đăng Ký Tham Gia"}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Danh sách đội */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            Danh Sách Đội Tham Gia ({teams.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {teams.map((team) => (
              <div key={team.team_id} className="border rounded-xl p-4 hover:shadow-md transition">
                <h3 className="font-semibold text-lg">{team.team_name}</h3>
                <p className="text-sm text-gray-600">{team.member_count} thành viên</p>
              </div>
            ))}
          </div>
        </div>

        {/* Lịch thi đấu */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Lịch Thi Đấu</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Vòng</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Thời gian</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Đội 1</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Tỉ số</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Đội 2</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Sân</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {matches.map((match) => {
                  const team1 = TEAMS.find((t) => t.team_id === match.team1_id)?.team_name || "TBD";
                  const team2 = TEAMS.find((t) => t.team_id === match.team2_id)?.team_name || "TBD";
                  const score = match.status === "finished"
                    ? `${match.score_team1} - ${match.score_team2}`
                    : "-";

                  return (
                    <tr key={match.match_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{match.round}</td>
                      <td className="px-4 py-3 text-sm">{match.start_time} - {match.end_time}</td>
                      <td className="px-4 py-3 text-sm font-medium">{team1}</td>
                      <td className="px-4 py-3 text-center text-sm font-bold">{score}</td>
                      <td className="px-4 py-3 text-sm font-medium">{team2}</td>
                      <td className="px-4 py-3 text-sm">Sân {match.court_id}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          match.status === "finished" ? "bg-green-100 text-green-800" :
                          match.status === "ongoing" ? "bg-yellow-100 text-yellow-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {match.status === "finished" ? "Hoàn thành" :
                           match.status === "ongoing" ? "Đang đấu" : "Chưa bắt đầu"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}