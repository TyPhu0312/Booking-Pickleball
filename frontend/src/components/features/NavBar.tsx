"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import Image from "next/image";
import Cookies from "js-cookie";


interface User {
    userID: string;
    full_name: string;
    email: string;
    role:{
        roleID: string;
        name: string;
        description?: string;
        createdAt?: string;
        updatedAt?: string;
    };
    phone?: string | null;
    address?: string | null;
    bank_account_number?: string | null;
    bank_account_owner?: string | null;
    bank_name?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export default function Navbar() {
    const [open, setOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [dropdown, setDropdown] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            const token = Cookies.get("token");
            const phoneUser = localStorage.getItem("phone_user");
            if (!token) return;
            if (!phoneUser) return;
            console.log("Fetching user info for phone:", phoneUser);
            try {
                const res = await fetch(
                    `http://localhost:5000/api/users/getUserByPhone/${phoneUser}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (!res.ok) {
                    console.error("Không thể lấy thông tin user");
                    return;
                }
                const data = await res.json();
                setUser(data.user);
                localStorage.setItem("user", JSON.stringify(data.user));
            } catch (err) {
                console.error(err);
            }
        };

        fetchUser();
    }, []);

    const handleLogout = () => {
        Cookies.remove("token");
        localStorage.removeItem("email_user");
        localStorage.removeItem("user");
        setUser(null);
        window.location.href = "/";
    };

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
                <Link
                    href="/"
                    className="text-2xl font-bold text-green-600 flex items-center gap-2"
                >
                    <Image
                        src="/images/logo.png"
                        alt="Pickleball Sao Mai"
                        width={50}
                        height={50}
                    />
                    Pickleball Sao Mai
                </Link>

                <div className="hidden md:flex space-x-6 text-gray-700 font-medium">
                    <div className="hidden md:flex space-x-6 text-gray-700 font-medium">
                        <Link
                            href="/"
                            className="relative group px-1 py-1 transition-all duration-300 hover:text-blue-600"
                        >
                            Trang chủ
                            <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-blue-500 transition-all group-hover:w-full"></span>
                        </Link>

                        <Link
                            href="/tournaments"
                            className="relative group px-1 py-1 transition-all duration-300 hover:text-blue-600"
                        >
                            Giải đấu
                            <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-blue-500 transition-all group-hover:w-full"></span>
                        </Link>

                        <Link
                            href="/bookings"
                            className="relative group px-1 py-1 transition-all duration-300 hover:text-blue-600"
                        >
                            Đặt sân
                            <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-blue-500 transition-all group-hover:w-full"></span>
                        </Link>

                        <Link
                            href="/history"
                            className="relative group px-1 py-1 transition-all duration-300 hover:text-blue-600"
                        >
                            Lịch sử
                            <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-blue-500 transition-all group-hover:w-full"></span>
                        </Link>
                    </div>


                    {user ? (
                        <div className="relative">
                            <button
                                className="relative group px-1 py-1 transition-all duration-300 hover:text-blue-600"
                                onClick={() => setDropdown(!dropdown)}
                            >
                                {user.full_name}
                                <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-blue-500 transition-all group-hover:w-full"></span>
                            </button>
                            {dropdown && (
                                <div className="absolute right-0 mt-2 w-44 bg-white shadow-lg rounded-lg overflow-hidden z-50 border border-green-300">
                                    <Link
                                        href="/profile"
                                        className="block px-4 py-2 hover:bg-green-100 text-green-700 font-medium transition-colors"
                                    >
                                        Thông tin
                                    </Link>

                                    {user.role.name === "admin" && (
                                        <Link
                                            href="/admin"
                                            className="block px-4 py-2 hover:bg-blue-100 text-blue-700 font-medium transition-colors"
                                        >
                                            Admin
                                        </Link>
                                    )}

                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 hover:bg-red-100 text-red-600 font-medium transition-colors"
                                    >
                                        Logout
                                    </button>
                                </div>

                            )}
                        </div>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                            >
                                Đăng nhập
                            </Link>
                            <Link
                                href="/register"
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                            >
                                Đăng ký
                            </Link>
                        </>
                    )}
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
                    <Link href="/tournaments" className="block px-4 py-2 border-b">
                        Giải đấu
                    </Link>
                    <Link href="/bookings" className="block px-4 py-2 border-b">
                        Đặt sân
                    </Link>
                    <Link href="/history" className="block px-4 py-2 border-b">
                        Lịch sử
                    </Link>
                    {user ? (
                        <>
                            <Link href="/profile" className="block px-4 py-2 border-b">
                                Thông tin
                            </Link>
                            {user.role.name === "admin" && (
                                <Link href="/admin" className="block px-4 py-2 border-b">
                                    Admin
                                </Link>
                            )}
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2 border-b"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="block px-4 py-2 border-b">
                                Đăng nhập
                            </Link>
                            <Link href="/register" className="block px-4 py-2 border-b">
                                Đăng ký
                            </Link>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
}
