
import { Facebook, Instagram, MapPin, Music, Youtube } from "lucide-react";
import { FaTiktok } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-linear-to-r from-emerald-600 via-teal-600 to-cyan-600 shadow-md rounded-t-2xl mt-12">
            <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
                <div className="md:text-center flex justify-center">
                    <Image
                        src="/images/logo.png"
                        alt={"Pickleball Sao Mai"}
                        width={300}
                        height={300}
                        className="md:text-center"
                    />
                </div>
                <div className="space-y-2">
                    <div className="gap-2 mb-4">
                        <h2 className="font-bold text-white uppercase">
                            Pickelball Sao Mai
                        </h2>
                    </div>
                    <p className="text-sm text-gray-100">MST:</p>
                    <p className="text-sm text-gray-100">Đại chỉ: 180 Cao Lỗ Phường Chánh Hưng, TP.Hồ Chí Minh</p>
                    <p className="text-sm text-gray-100">Hotline: 0767392xxx</p>
                    <p className="text-sm text-gray-100">Email:picklesaomai@gmail.com</p>
                </div>

                <div className="md:text-center">
                    <Link href="/">
                        <h3 className="font-bold text-white mb-3 cursor-pointer hover:text-cyan-200">Trang chủ</h3>
                    </Link>
                    
                    <ul className="space-y-1 text-sm text-gray-100">
                        <li><Link href="/tournaments" className="hover:text-cyan-200 transition-colors">Giải đấu</Link></li>
                        <li><Link href="/bookings" className="hover:text-cyan-200 transition-colors">Đặt sân</Link></li>
                        <li><Link href="/clubs" className="hover:text-cyan-200 transition-colors">Câu lạc bộ</Link></li>
                        <li><Link href="/shop" className="hover:text-cyan-200 transition-colors">Gian hàng</Link></li>
                        <li><Link href="/contact" className="hover:text-cyan-200 transition-colors">Liên hệ</Link></li>
                    </ul>
                </div>
                <div className="md:text-right space-y-3">
                    <h3 className="font-serif uppercase text-white">Theo dõi trên mạng xã hội</h3>
                    <div className="flex md: justify-between gap-3">
                        <a href="" className="hover:scale-110 transition-transform">
                            <Facebook className="text-white hover:text-blue-300"/>
                        </a>
                        <a href="" className="hover:scale-110 transition-transform">
                            <FaTiktok className="text-white hover:text-gray-300"/>
                        </a>
                        <a href="" className="hover:scale-110 transition-transform">
                            <Youtube className="text-white hover:text-red-300" />
                        </a>
                        <a href="" className="hover:scale-110 transition-transform">
                            <Instagram className="text-white hover:text-pink-300" />
                        </a>
                    </div>
                    <div className="flex justify-center items-center gap-1 text-sm text-gray-100">
                    <MapPin className="w-4 h-4 text-white" />
                    <a href="" className="hover:text-cyan-200 transition-colors">Bản đồ sân Pickelball Sao Mai</a>
                </div>
                </div>
                
            </div>
        </footer>
    );
}
