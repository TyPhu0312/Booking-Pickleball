"use client";

import { useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { Clock, MapPin, Users, Trophy, Calendar, ChevronRight, Star, Zap, Sparkles } from "lucide-react";

export default function HomePage() {

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

  const stats = [
    { number: "8+", label: "Sân Chuyên Nghiệp" },
    { number: "500+", label: "Thành Viên" },
    { number: "100+", label: "Trận Đấu/Tuần" },
    { number: "4.9★", label: "Đánh Giá" },
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

          <div className="max-w-5xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-linear-to-r from-purple-600 via-pink-600 to-red-600"></div>
              
              <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              
              <div className="relative p-12">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div className="text-white space-y-6">
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
                      <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                      <span className="text-sm font-semibold">Giải Đấu Chính Thức</span>
                    </div>
                    
                    <h3 className="text-4xl lg:text-5xl font-black leading-tight">
                      Giải Pickleball <br />
                      Mùa Thu 2025
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-lg">
                        <Calendar className="w-5 h-5 text-yellow-300" />
                        <span className="font-semibold">15 - 16 Tháng 11, 2025</span>
                      </div>
                      <div className="flex items-center gap-3 text-lg">
                        <Users className="w-5 h-5 text-yellow-300" />
                        <span className="font-semibold">16 đội tham gia</span>
                      </div>
                      <div className="flex items-center gap-3 text-lg">
                        <Trophy className="w-5 h-5 text-yellow-300" />
                        <span className="font-semibold">Giải thưởng: 20.000.000 VNĐ</span>
                      </div>
                    </div>

                    <Link
                      href="/tournaments/1"
                      className="inline-flex items-center gap-3 bg-white text-purple-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-yellow-300 hover:text-purple-700 transition-all shadow-2xl hover:shadow-yellow-300/50 hover:scale-105 mt-4"
                    >
                      Xem Chi Tiết
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </div>
                  
                  <div className="hidden md:flex items-center justify-center">
                    <div className="relative">
                      <div className="w-64 h-64 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border-8 border-white/20">
                        <Trophy className="w-32 h-32 text-yellow-300" />
                      </div>
                      <div className="absolute -top-4 -right-4 bg-yellow-300 text-purple-600 w-20 h-20 rounded-full flex items-center justify-center font-black text-2xl shadow-xl">
                        20M
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-emerald-600 via-teal-600 to-cyan-600"></div>
        
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-40"></div>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white space-y-8">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-sm font-semibold">Bắt Đầu Ngay Hôm Nay</span>
            </div>
            
            <h2 className="text-5xl lg:text-6xl font-black leading-tight">
              Sẵn Sàng Chơi <br className="hidden md:block" />
              Pickleball?
            </h2>
            
            <p className="text-2xl text-emerald-50 leading-relaxed">
              Đặt sân ngay hôm nay – Miễn phí hủy trước 2 giờ!
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/bookings"
                className="inline-flex items-center gap-3 bg-white text-emerald-600 px-10 py-5 rounded-full font-black text-xl hover:bg-yellow-300 hover:text-emerald-700 transition-all shadow-2xl hover:shadow-yellow-300/50 hover:scale-105"
              >
                <Calendar className="w-7 h-7" />
                Đặt Sân Ngay
                <ChevronRight className="w-6 h-6" />
              </Link>
              
              <Link
                href="/tournaments"
                className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm text-white px-10 py-5 rounded-full font-bold text-xl hover:bg-white/20 transition-all border-2 border-white/30"
              >
                <Trophy className="w-7 h-7" />
                Xem Giải Đấu
              </Link>
            </div>
            
            <div className="pt-8 flex flex-wrap items-center justify-center gap-8 text-emerald-50">
              {[
                "✓ Miễn phí hủy trước 2h",
                "✓ Thanh toán linh hoạt",
                "✓ Sân chuẩn quốc tế",
                "✓ Hỗ trợ 24/7",
              ].map((item, i) => (
                <div key={i} className="text-lg font-semibold">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}