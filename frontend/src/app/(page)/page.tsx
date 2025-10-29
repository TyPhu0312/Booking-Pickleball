// app/page.tsx
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Search, Clock, MapPin, Users, Trophy, Calendar, ChevronRight } from "lucide-react";

export default function HomePage() {
  const [searchDate, setSearchDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const popularSlots = [
    { time: "6:00 - 9:00", label: "Buổi Sáng", price: 200000, bg: "from-orange-400 to-red-500", icon: "Sun" },
    { time: "15:00 - 18:00", label: "Buổi Chiều", price: 250000, bg: "from-yellow-400 to-orange-500", icon: "Sun" },
    { time: "19:00 - 22:00", label: "Buổi Tối", price: 300000, bg: "from-indigo-600 to-purple-700", icon: "Moon" },
  ];

  const features = [
    { icon: <Clock className="w-6 h-6" />, title: "Đặt Slot Dễ Dàng", desc: "Chỉ 30 giây để đặt sân" },
    { icon: <MapPin className="w-6 h-6" />, title: "Sân Đẹp - Hiện Đại", desc: "4 sân trong nhà, 4 sân ngoài trời" },
    { icon: <Users className="w-6 h-6" />, title: "Cộng Đồng Pickleball", desc: "Hàng trăm người chơi mỗi ngày" },
    { icon: <Trophy className="w-6 h-6" />, title: "Giải Đấu Hàng Tháng", desc: "Tham gia thi đấu, nhận quà" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* SLOT PHỔ BIẾN */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-3">Slot Phổ Biến</h2>
            <p className="text-gray-600">Chọn khung giờ yêu thích – Đặt ngay!</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {popularSlots.map((slot) => (
              <div
                key={slot.time}
                className="group relative overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${slot.bg} opacity-90`}></div>
                <div className="relative p-8 text-white text-center">
                  <div className="text-6xl mb-4 opacity-20">{slot.icon}</div>
                  <h3 className="text-2xl font-bold mb-2">{slot.time}</h3>
                  <p className="text-lg opacity-90">{slot.label}</p>
                  <p className="text-3xl font-bold mt-4">{slot.price.toLocaleString()}đ</p>
                  <p className="text-sm mt-1">/ slot (1h)</p>

                  <a
                    href={`/bookings?date=${format(new Date(), "yyyy-MM-dd")}&slot=1`}
                    className="mt-6 inline-flex items-center gap-2 bg-white text-gray-800 px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition"
                  >
                    Đặt Ngay
                    <ChevronRight className="w-5 h-5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TÍNH NĂNG NỔI BẬT */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-3">Tại Sao Chọn Chúng Tôi?</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GIẢI ĐẤU SẮP TỚI */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-3">Giải Đấu Sắp Tới</h2>
            <p className="text-gray-600">Tham gia ngay – Cơ hội nhận giải thưởng!</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-3xl font-bold mb-2">Giải Pickleball Mùa Thu 2025</h3>
                  <p className="text-lg opacity-90">15 - 16 Tháng 11, 2025</p>
                  <p className="mt-3">16 đội – Giải thưởng: 20.000.000 VNĐ</p>
                </div>
                <div>
                  <a
                    href="/tournaments/1"
                    className="bg-white text-purple-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-lg flex items-center gap-2"
                  >
                    Xem Chi Tiết
                    <ChevronRight className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-emerald-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Sẵn Sàng Chơi Pickleball?</h2>
          <p className="text-xl mb-8">Đặt sân ngay hôm nay – Miễn phí hủy trước 2h!</p>
          <a
            href="/bookings"
            className="inline-flex items-center gap-3 bg-white text-green-600 px-10 py-4 rounded-full font-bold text-xl hover:bg-gray-100 transition shadow-xl"
          >
            <Calendar className="w-6 h-6" />
            Đặt Sân Ngay
          </a>
        </div>
      </section>
    </main>
  );
}