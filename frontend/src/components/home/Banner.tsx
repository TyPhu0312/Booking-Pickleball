import Image from "next/image";

export default function PickleballBanner() {
  return (
    <div>
      <div>
        <h2 className="text-3xl font-bold text-center my-8">
          PICKLEBALL GEAR COLLECTION
        </h2>
      </div>
      <div className="w-full bg-white flex justify-center py-6">
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl overflow-hidden shadow">
            <Image
              src="/images/HienHoPickleball.jpg"
              alt="Pickleball Left"
              width={600}
              height={800}
              className="w-full h-full object-cover" />
          </div>

          <div className="flex flex-col items-center justify-center bg-pink-300 rounded-2xl p-6 text-center shadow">
            <h3 className="text-white font-semibold text-sm tracking-wide mb-2 uppercase">
              New Pickleball Collection
            </h3>
            <h1 className="text-white text-4xl font-bold leading-tight">
              WHY DON&apos;T <br /> YOU <br /> TRY IT?
            </h1>
          </div>

          <div className="rounded-2xl overflow-hidden shadow">
            <Image
              src="/images/DoPhuQuiPickleball.jpg"
              alt="Pickleball Right"
              width={600}
              height={800}
              className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </div>

  );
}