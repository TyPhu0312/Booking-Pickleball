"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { API_URL } from '@/lib/config';
import { toast } from "sonner";

export default function RegisterForm() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors = { password: "", confirmPassword: "" };
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordRegex.test(form.password)) {
      newErrors.password =
        "Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, số và ký tự đặc biệt.";
    }

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((err) => err === "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error("Mật khẩu không khớp!");
      return;
    }
    if (validate()) {
      try {
        const res = await fetch(`${API_URL}/api/auth/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: form.name,
            phone: form.phone,
            password: form.password,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.message || "Đăng ký thất bại");
          return;
        }

        localStorage.setItem("token", data.token);
        toast.success("Đăng ký thành công!");
        window.location.href = "/login";
      } catch (error) {
        console.error(error);
        toast.error("Có lỗi xảy ra, thử lại sau.");
      }
    }
    else {
      toast.error("Có lỗi, vui lòng kiểm tra lại.");
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg mt-16">
      <h2 className="text-3xl font-bold text-center mb-6 text-green-700">
        Đăng ký tài khoản
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Họ và tên</label>
          <Input
            name="name"
            type="text"
            placeholder="Nguyễn Văn A"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Số điện thoại</label>
          <Input
            name="phone"
            type="number"
            placeholder="033789xxx"
            value={form.phone}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Mật khẩu</label>
          <Input
            name="password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            required
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Xác nhận mật khẩu
          </label>
          <Input
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
          )}
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
          <p className="text-xs text-blue-800">
            <strong>💡 Yêu cầu mật khẩu:</strong>
          </p>
          <ul className="text-xs text-blue-700 mt-2 space-y-1 ml-4 list-disc">
            <li>Tối thiểu 8 ký tự</li>
            <li>Ít nhất 1 chữ hoa (A-Z)</li>
            <li>Ít nhất 1 chữ số (0-9)</li>
            <li>Ít nhất 1 ký tự đặc biệt (@$!%*?&)</li>
          </ul>
        </div>


        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
          Đăng ký
        </Button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-4">
        Đã có tài khoản?{" "}
        <Link href="/login" className="text-green-600 font-medium hover:underline">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
