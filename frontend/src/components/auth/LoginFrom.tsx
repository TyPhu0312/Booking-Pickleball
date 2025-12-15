"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import Cookies from "js-cookie";
import { API_URL } from '@/lib/config';
import { toast } from "sonner";

export default function LoginForm() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();

      console.log(data);
      if (!res.ok) {
        setError(data.message || "Đăng nhập thất bại");
        setLoading(false);
        return;
      }

      localStorage.setItem("phone_user", phone);
      Cookies.set("token", data.token, { expires: 7 }); 
   
      toast.success("Đăng nhập thành công!");
      window.location.href = "/"; 
    } catch (err) {
      console.error(err);
      setError("Có lỗi xảy ra, thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg mt-16">
      <h2 className="text-3xl font-bold text-center mb-6 text-green-700">
        Đăng nhập
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Số điện thoại</label>
          <Input
            name="phone"
            type="number"
            placeholder="033789xxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Mật khẩu</label>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <Button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700"
          disabled={loading}
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-4">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="text-green-600 font-medium hover:underline">
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
}
