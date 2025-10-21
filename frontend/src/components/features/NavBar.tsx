"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import Image from "next/image";

export default function Navbar() {
    const [open, setOpen] = useState(false);

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
                <Link href="/" className="text-2xl font-bold text-green-600">
                    <span className="flex">
                        <Image
                            src="/images/logo.png"
                            alt={"Pickleball Sao Mai"}
                            width={50}
                            height={50}
                            className="md:text-center"
                        />
                        Pickleball Sao Mai
                    </span>

                </Link>
                <div className="hidden md:flex space-x-6 text-gray-700 font-medium">
                    <Link href="/">Trang chủ</Link>
                    <Link href="/bookingfield">Đặt sân</Link>
                    <Link href="/tounaments">Giải đấu</Link>
                    <Link href="/about">Giới thiệu</Link>
                    <Link href="/contact">Liên hệ</Link>
                    
                </div>
                <div className="hidden md:flex space-x-4">
                    <Link href="/login" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                        Đăng nhập
                    </Link>
                    <Link
                        href="/register"
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                        Đăng ký
                    </Link>
                </div>
                <button
                    className="md:hidden text-green-600"
                    onClick={() => setOpen(!open)}
                >
                    <Menu size={28} />
                </button>
            </div>

            {open && (
                <div className="md:hidden bg-white shadow-inner">
                    <Link href="/" className="block px-4 py-2 border-b">
                        Trang chủ
                    </Link>
                    <Link href="/courts" className="block px-4 py-2 border-b">
                        Đặt sân
                    </Link>
                    <Link href="/about" className="block px-4 py-2 border-b">
                        Giới thiệu
                    </Link>
                    <Link href="/contact" className="block px-4 py-2 border-b">
                        Liên hệ
                    </Link>
                </div>
            )}
        </nav>
    );
}
