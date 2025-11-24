import { Calendar, Clock } from "lucide-react";

const popularSlots = [
  { time: "6:00 - 9:00", label: "Buổi Sáng", price: 100000, bg: "from-orange-400 to-red-500" },
  { time: "15:00 - 18:00", label: "Buổi Chiều", price: 150000, bg: "from-yellow-400 to-orange-500" },
  { time: "19:00 - 22:00", label: "Buổi Tối", price: 200000, bg: "from-indigo-600 to-purple-700" },
];

export default function PopularSlots() {
  return (
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
  );
}
