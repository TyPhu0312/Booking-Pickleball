export default function HeroSection() {
    return (
      <section
        className="relative h-[80vh] flex items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://img.freepik.com/premium-vector/realistic-pickleball-background_52683-174110.jpg?w=2000')",
        }}
      >
        <div className="absolute inset-0 bg-opacity-40" />
        <div className="relative z-10 text-center text-gray-900 sm:px-6 lg:px-8 md:mt-96  ">
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-4">
            Đặt sân Pickleball Sao Mai dễ dàng và nhanh chóng!
          </h1>
          <p className="text-lg mb-6">
            Trải nghiệm hệ thống đặt sân thể thao hiện đại – tiện lợi – mọi lúc mọi nơi.
          </p>
          {/* <a
            href="/courts"
            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold text-white shadow-lg"
          >
            Đặt sân ngay
          </a> */}
        </div>
      </section>
    );
  }
  