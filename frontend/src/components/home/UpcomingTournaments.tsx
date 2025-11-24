/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { Trophy, Calendar, Users, ChevronRight, Star } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Tournament {
  tournamentID: string;
  name: string;
  start_day: string;
  description: string | null;
  status: string;
  max_teams: number;
  image: string | null;
}

export default function UpcomingTournaments() {
  const [upcomingTournaments, setUpcomingTournaments] = useState<Tournament[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);

  useEffect(() => {
    fetchUpcomingTournaments();
  }, []);

  const fetchUpcomingTournaments = async () => {
    try {
      setLoadingTournaments(true);
      const res = await fetch(`${API_URL}/api/tournaments/upcoming`);
      if (res.ok) {
        const data = await res.json();
        setUpcomingTournaments(data.slice(0, 3));
      }
    } catch (error) {
      console.error("Error fetching upcoming tournaments:", error);
    } finally {
      setLoadingTournaments(false);
    }
  };

  const gradients = [
    "from-purple-600 via-pink-600 to-red-600",
    "from-blue-600 via-indigo-600 to-purple-600",
    "from-emerald-600 via-teal-600 to-cyan-600",
  ];

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNTAgMEw1MCAxMDBNMCA1MEwxMDAgNTBNMjUgMEwyNSAxMDBNNzUgMEw3NSAxMDBNMCAyNUwxMDAgMjVNMCA3NUwxMDAgNzUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIi8+PC9zdmc+')]"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-linear-to-r from-purple-100 to-pink-100 px-4 py-2 rounded-full font-semibold mb-4">
            <Trophy className="w-4 h-4 text-purple-600" />
            <span className="text-purple-600">Sự Kiện Nổi Bật</span>
          </div>
          <h2 className="text-5xl font-black text-gray-800 mb-4">Giải Đấu Sắp Tới</h2>
          <p className="text-xl text-gray-600">Tham gia ngay – Cơ hội nhận giải thưởng khủng!</p>
        </div>

        {loadingTournaments ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : upcomingTournaments.length === 0 ? (
          <div className="max-w-3xl mx-auto text-center py-16">
            <Trophy className="w-20 h-20 mx-auto text-gray-300 mb-4" />
            <p className="text-xl text-gray-500">Chưa có giải đấu sắp tới</p>
            <Link 
              href="/tournaments"
              className="inline-flex items-center gap-2 mt-6 text-purple-600 hover:text-purple-700 font-semibold"
            >
              Xem tất cả giải đấu
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {upcomingTournaments.map((tournament, index) => (
              <div
                key={tournament.tournamentID}
                className="group relative rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className={`absolute inset-0 bg-linear-to-r ${gradients[index % 3]}`}></div>
                
                <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                
                {tournament.image && (
                  <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
                    <img 
                      src={tournament.image} 
                      alt={tournament.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="relative p-8 text-white min-h-[400px] flex flex-col">
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/30 self-start mb-4">
                    <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                    <span className="text-sm font-semibold">Sắp diễn ra</span>
                  </div>
                  
                  <h3 className="text-3xl font-black leading-tight mb-6 line-clamp-2 group-hover:scale-105 transition-transform">
                    {tournament.name}
                  </h3>
                  
                  <div className="space-y-3 mb-6 flex-1">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-yellow-300" />
                      <span className="font-semibold">
                        {format(new Date(tournament.start_day), "dd/MM/yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-yellow-300" />
                      <span className="font-semibold">{tournament.max_teams} đội</span>
                    </div>
                    {tournament.description && (
                      <p className="text-sm text-white/80 mt-4 line-clamp-2">
                        {tournament.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div className="text-lg font-bold">
                      20.000.000đ Giải Thưởng
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link
            href="/tournaments"
            className="inline-flex items-center gap-2 bg-linear-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all"
          >
            Xem Tất Cả Giải Đấu
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
