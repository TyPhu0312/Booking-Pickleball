const courts = [
    {
      id: 1,
      name: "Sân A1",
      price: "120.000đ / giờ",
      image:
        "https://img.freepik.com/premium-vector/realistic-pickleball-background_52683-174110.jpg?w=2000",
    },
    {
      id: 2,
      name: "Sân A2",
      price: "150.000đ / giờ",
      image:
        "https://img.freepik.com/premium-vector/realistic-pickleball-background_52683-174110.jpg?w=2000",
    },
    {
      id: 3,
      name: "Sân B1",
      price: "180.000đ / giờ",
      image:
        "https://img.freepik.com/premium-vector/realistic-pickleball-background_52683-174110.jpg?w=2000",
    },
  ];
  
  export default function FeaturedCourts() {
    return (
      <section className="py-16 px-6 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-green-700 mb-10">
          Sân nổi bật
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {courts.map((court) => (
            <div
              key={court.id}
              className="bg-white shadow-md rounded-2xl overflow-hidden hover:shadow-lg transition"
            >
              <img
                src={court.image}
                alt={court.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  {court.name}
                </h3>
                <p className="text-green-600 font-bold mt-2">{court.price}</p>
                <p>Giờ hoạt động: 5h - 22h</p>
                <a
                  href={`/courts/${court.id}`}
                  className="inline-block mt-4 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
                >
                  Đặt ngay
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }
  