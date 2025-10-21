
import { Facebook, Instagram, MapPin, Music, Youtube } from "lucide-react";
import { FaTiktok } from "react-icons/fa";
import Image from "next/image";

export default function Footer() {
    return (
        <footer className="bg-white shadow-md rounded-t-2xl mt-12">
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
                        <h2 className="font-bold text-blue-500 uppercase">
                            Pickelball Sao Mai
                        </h2>
                    </div>
                    <p className="text=sm">MST:</p>
                    <p className="text=sm">Đại chỉ: 180 Cao Lỗ Phường Chánh Hưng, TP.Hồ Chí Minh</p>
                    <p className="text=sm">Hotline: 0767392xxx</p>
                    <p className="text=sm">Email:picklesaomai@gmail.com</p>
                </div>

                <div className="md:text-center">
                    <a href="/">
                        <h3 className="font-bold text-blue-500 mb-3">Trang chủ</h3>
                    </a>
                    
                    <ul className="space-y-1 text-sm">
                        <li><a href="" className="hover:text-blue-600">Giải đấu</a></li>
                        <li><a href="" className="hover:text-blue-600">Đặt sân</a></li>
                        <li><a href="" className="hover:text-blue-600">Câu lạc bộ</a></li>
                        <li><a href="" className="hover:text-blue-600">Gian hàng</a></li>
                        <li><a href="" className="hover:text-blue-600">Liên hệ</a></li>
                    </ul>
                </div>
                <div className="md:text-right space-y-3">
                    <h3 className="font-serif uppercase">Theo dõi trên mạng xã hội</h3>
                    <div className="flex md: justify-between gap-3">
                        <a href="" className="hover:scale-110 transition-transform">
                            <Facebook className="text-blue-400"/>
                        </a>
                        <a href="" className="hover:scale-110 transition-transform">
                            <FaTiktok className="text-black"/>
                        </a>
                        <a href="" className="hover:scale-110 transition-transform">
                            <Youtube className="text-red-600" />
                        </a>
                        <a href="" className="hover:scale-110 transition-transform">
                            <Instagram className="text-pink-600" />
                        </a>
                    </div>
                    <div className="flex justify-center items-center gap-1 text-sm">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <a href="" className="hover:underline">Bản đồ sân Pickelball Sao Mai</a>
                </div>
                </div>
                
            </div>
        </footer>
    );
}
