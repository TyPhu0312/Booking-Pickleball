/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { Clock, MapPin, Users, Trophy, Calendar, ChevronRight, Star, Zap, Sparkles } from "lucide-react";

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

export default function HomePage() {
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
        setUpcomingTournaments(data.slice(0, 3)); // Lấy 3 giải sắp tới
      }
    } catch (error) {
      console.error("Error fetching upcoming tournaments:", error);
    } finally {
      setLoadingTournaments(false);
    }
  };

  const popularSlots = [
    { time: "6:00 - 9:00", label: "Buổi Sáng", price: 200000, bg: "from-orange-400 to-red-500" },
    { time: "15:00 - 18:00", label: "Buổi Chiều", price: 250000, bg: "from-yellow-400 to-orange-500" },
    { time: "19:00 - 22:00", label: "Buổi Tối", price: 300000, bg: "from-indigo-600 to-purple-700" },
  ];

  const features = [
    { icon: <Zap className="w-6 h-6" />, title: "Đặt Slot Dễ Dàng", desc: "Chỉ 30 giây để đặt sân" },
    { icon: <MapPin className="w-6 h-6" />, title: "Sân Đẹp - Hiện Đại", desc: "4 sân trong nhà, 4 sân ngoài trời" },
    { icon: <Users className="w-6 h-6" />, title: "Cộng Đồng Pickleball", desc: "Hàng trăm người chơi mỗi ngày" },
    { icon: <Trophy className="w-6 h-6" />, title: "Giải Đấu Hàng Tháng", desc: "Tham gia thi đấu, nhận quà" },
  ];

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 via-white to-emerald-50">
      
      

      <section className="py-20 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-100 rounded-full blur-3xl opacity-30"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full font-semibold mb-4">
              <Clock className="w-4 h-4" />
              Khung Giờ Linh Hoạt
            </div>
            <h2 className="text-5xl font-black text-gray-800 mb-4">Slot Phổ Biến</h2>
            <p className="text-xl text-gray-600">Chọn khung giờ yêu thích – Đặt ngay!</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {popularSlots.map((slot, index) => (
              <div
                key={slot.time}
                className="group relative overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3 hover:scale-105"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`absolute inset-0 bg-linear-to-br ${slot.bg} opacity-90 group-hover:opacity-100 transition-opacity`}></div>
                
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyIiBmaWxsPSIjZmZmIi8+PC9zdmc+')]"></div>
                </div>
                
                <div className="relative p-10 text-white text-center">
                  <div className="mb-6">
                    <div className="w-20 h-20 mx-auto bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Calendar className="w-10 h-10" />
                    </div>
                  </div>
                  
                  <h3 className="text-3xl font-black mb-2">{slot.time}</h3>
                  <p className="text-lg opacity-90 font-semibold mb-6">{slot.label}</p>
                  
                  <div className="mb-6">
                    <p className="text-4xl font-black">{slot.price.toLocaleString()}đ</p>
                    <p className="text-sm mt-1 opacity-75">/ slot (1 giờ)</p>
                  </div>

                 
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-linear-to-r from-slate-50 to-emerald-50 relative overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-64 h-64 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-64 h-64 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full font-semibold mb-4 shadow-lg">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-600">Vì Sao Chọn Chúng Tôi</span>
            </div>
            <h2 className="text-5xl font-black text-gray-800 mb-4">Lợi Ích Vượt Trội</h2>
            <p className="text-xl text-gray-600">Trải nghiệm pickleball đẳng cấp chuyên nghiệp</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-emerald-200"
              >
                <div className="w-16 h-16 bg-linear-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-black text-gray-800 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: <Star className="w-6 h-6" />, text: "Chất Lượng 5 Sao" },
              { icon: <Users className="w-6 h-6" />, text: "500+ Thành Viên" },
              { icon: <Trophy className="w-6 h-6" />, text: "Giải Đấu Chuyên Nghiệp" },
              { icon: <Zap className="w-6 h-6" />, text: "Đặt Sân Nhanh Chóng" },
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-md">
                <div className="text-emerald-600">{badge.icon}</div>
                <span className="font-bold text-gray-800 text-sm">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNTAgMEw1MCAxMDBNMCA1MEwxMDAgNTBNMjUgMEwyNSAxMDBNNzUgMEw3NSAxMDBNMCAyNUwxMDAgMjVNMCA3NUwxMDAgNzUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIi8+PC9zdmc+')]">​</div>
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
              {upcomingTournaments.map((tournament, index) => {
                const gradients = [
                  "from-purple-600 via-pink-600 to-red-600",
                  "from-blue-600 via-indigo-600 to-purple-600",
                  "from-emerald-600 via-teal-600 to-cyan-600",
                ];
                
                return (
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
                );
              })}
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
    </main>
  );
}