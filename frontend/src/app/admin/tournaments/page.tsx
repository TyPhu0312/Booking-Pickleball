// app/admin/tournaments/page.tsx
import { Plus, Edit, Trash2, Eye } from "lucide-react";

const tournaments = [
  { id: 1, name: "Giải Mùa Thu 2025", date: "15/11/2025", teams: 12, status: "upcoming" },
  { id: 2, name: "Giải Doanh Nghiệp", date: "01/12/2025", teams: 28, status: "ongoing" },
];

export default function TournamentsPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Quản Lý Giải Đấu</h1>
        <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
          <Plus className="w-4 h-4" />
          Tạo Giải Mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map((tournament) => (
          <div key={tournament.id} className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-2">{tournament.name}</h3>
            <p className="text-gray-600 mb-2">Ngày: {tournament.date}</p>
            <p className="text-gray-600 mb-4">Đội: {tournament.teams}</p>
            <span className={`px-3 py-1 text-xs rounded-full ${
              tournament.status === "upcoming" ? "bg-blue-100 text-blue-800" :
              "bg-yellow-100 text-yellow-800"
            }`}>
              {tournament.status === "upcoming" ? "Sắp diễn ra" : "Đang diễn ra"}
            </span>
            <div className="mt-4 space-x-2">
              <button className="text-blue-600 hover:text-blue-900">
                <Eye className="w-4 h-4" />
              </button>
              <button className="text-green-600 hover:text-green-900">
                <Edit className="w-4 h-4" />
              </button>
              <button className="text-red-600 hover:text-red-900">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}