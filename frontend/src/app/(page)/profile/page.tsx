"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

interface Role {
  roleID: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface User {
  userID: string;
  full_name: string;
  role: Role;
  phone?: string | null;
  address?: string | null;
  bank_account_number?: string | null;
  bank_account_owner?: string | null;
  bank_name?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(
    null as
      | {
          full_name: string;
          phone?: string | null;
          address?: string | null;
          bank_account_number?: string | null;
          bank_account_owner?: string | null;
          bank_name?: string | null;
        }
      | null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      setEditForm(parsed);
    }
    setLoading(false);
  }, []);

  const handleSave = async () => {
    if (!editForm) return;

    if (!editForm.full_name.trim()) {
      alert("Vui lòng nhập họ tên!");
      return;
    }
    if (!editForm.phone || !/^0[3|5|7|8|9]\d{8}$/.test(editForm.phone)) {
      alert("Số điện thoại không hợp lệ!");
      return;
    }

    console.log("Saving user:", editForm);

    try {
      if (!user) {
        alert("Không tìm thấy thông tin người dùng!");
        return;
      }
      const response = await fetch(
        `http://localhost:5000/api/users/update/${user.userID}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editForm),
        }
      );

      if (!response.ok) {
        alert("Cập nhật hồ sơ thất bại!");
        return;
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setIsEditOpen(false);
      alert("Cập nhật hồ sơ thành công!");
    } catch (error) {
      console.error(error);
      alert("Đã có lỗi xảy ra khi cập nhật hồ sơ!");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>Đang tải hồ sơ...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>Không tìm thấy thông tin người dùng.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Hồ Sơ Người Dùng
        </h1>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-6 mb-8">
            <Avatar className="w-24 h-24">
              <AvatarImage src="" />
              <AvatarFallback className="text-2xl">
                {user.full_name?.split(" ").pop()?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{user.full_name}</h2>
              <p className="text-gray-500 text-sm mt-1">
                Vai trò: {user.role?.name === "customer" ? "Người dùng" : "Quản Lý"}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <Label className="text-gray-600">Số điện thoại</Label>
              <p className="font-medium">
                {user.phone || "Chưa cập nhật"}
              </p>
            </div>

            <div >
              <Label className="text-gray-600 ">Tên ngân hàng</Label>
              <p className="font-medium">
                {user.bank_name || "Chưa cập nhật"}
              </p>
            </div>

           
            <div >
              <Label className="text-gray-600">Địa chỉ</Label>
              <p className="font-medium">
                {user.address || "Chưa cập nhật"}
              </p>
            </div>
            <div>
              <Label className="text-gray-600">Số tài khoản</Label>
              <p className="font-medium">
                {user.bank_account_number || "Chưa cập nhật"}
              </p>
            </div>

            {/* <div>
              <Label className="text-gray-600 ">Chủ tài khoản</Label>
              <p className="font-medium">
                {user.bank_account_owner || "Chưa cập nhật"}
              </p>
            </div> */}

           
          </div>

          <Button
            onClick={() => {
              setEditForm(user);
              setIsEditOpen(true);
            }}
            className="mt-8 w-full md:w-auto"
          >
            Chỉnh Sửa Hồ Sơ
          </Button>
        </div>
      </div>

      {/* 🔹 Modal chỉnh sửa */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh Sửa Hồ Sơ</DialogTitle>
          </DialogHeader>

          {editForm && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Họ và tên</Label>
                <Input
                  value={editForm.full_name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, full_name: e.target.value })
                  }
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div>
                <Label>Số điện thoại</Label>
                <Input
                  value={editForm.phone || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                  placeholder="0901234567"
                />
              </div>

              <div>
                <Label>Địa chỉ</Label>
                <Input
                  value={editForm.address || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, address: e.target.value })
                  }
                  placeholder="Quận 7, TP.HCM"
                />
              </div>

              <div>
                <Label>Tên ngân hàng</Label>
                <Input
                  value={editForm.bank_name || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, bank_name: e.target.value })
                  }
                  placeholder="MB Bank"
                />
              </div>

              <div>
                <Label>Số tài khoản</Label>
                <Input
                  value={editForm.bank_account_number || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, bank_account_number: e.target.value })
                  }
                  placeholder="0789xxxxxxx"
                />
              </div>
              <div>
                <Label>Chủ tài khoản</Label>
                <Input
                  value={editForm.bank_account_owner || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, bank_account_owner: e.target.value })
                  }
                  placeholder="NGUYEN VAN A"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(false)}
            >
              Hủy
            </Button>
            <Button onClick={handleSave}>Lưu Thay Đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
