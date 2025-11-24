import { Zap, MapPin, Users, Trophy, Star, Sparkles } from "lucide-react";

const features = [
  { icon: <Zap className="w-6 h-6" />, title: "Đặt Slot Dễ Dàng", desc: "Chỉ 30 giây để đặt sân" },
  { icon: <MapPin className="w-6 h-6" />, title: "Sân Đẹp - Hiện Đại", desc: "4 sân trong nhà, 4 sân ngoài trời" },
  { icon: <Users className="w-6 h-6" />, title: "Cộng Đồng Pickleball", desc: "Hàng trăm người chơi mỗi ngày" },
  { icon: <Trophy className="w-6 h-6" />, title: "Giải Đấu Hàng Tháng", desc: "Tham gia thi đấu, nhận quà" },
];

const badges = [
  { icon: <Star className="w-6 h-6" />, text: "Chất Lượng 5 Sao" },
  { icon: <Users className="w-6 h-6" />, text: "500+ Thành Viên" },
  { icon: <Trophy className="w-6 h-6" />, text: "Giải Đấu Chuyên Nghiệp" },
  { icon: <Zap className="w-6 h-6" />, text: "Đặt Sân Nhanh Chóng" },
];

export default function Features() {
  return (
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
          {badges.map((badge, i) => (
            <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-md">
              <div className="text-emerald-600">{badge.icon}</div>
              <span className="font-bold text-gray-800 text-sm">{badge.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
