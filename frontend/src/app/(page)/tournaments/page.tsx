import Link from "next/link";
import { mockTournaments } from "@/lib/data";

export default function TournamentsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-center mb-8">Các Giải Đấu Pickleball</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockTournaments.map((tournament) => (
          <Link
            key={tournament.id}
            href={`/tournaments/${tournament.id}`}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition"
          >
            <div className="bg-gray-200 border-2 border-dashed rounded-t-xl w-full h-48"></div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">{tournament.name}</h3>
              <p className="text-gray-600 text-sm mb-3">{tournament.date}</p>
              <p className="text-sm text-gray-500">Số đội: {tournament.teams}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}