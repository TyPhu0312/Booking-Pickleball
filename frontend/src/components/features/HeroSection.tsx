
"use client";

import Link from "next/link";
import { Trophy, Calendar, ChevronRight, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const backgroundImages = [
    "/images/hero/HienHo2.jpg",
     "/images/hero/anh1.jpg",
    "/images/hero/MinhHang.jpg",
    "/images/hero/anh2.jpg",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % backgroundImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0">
        {backgroundImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
            style={{
              backgroundImage: `url(${image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 bg-black/40"></div>

      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
      </div>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
        {backgroundImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${index === currentSlide
                ? "bg-white w-8"
                : "bg-white/50 hover:bg-white/75"
              }`}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
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
            ].map((item, i) => (
              <div key={i} className="text-lg font-semibold">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
