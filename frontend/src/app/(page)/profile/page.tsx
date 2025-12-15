"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_URL } from '@/lib/config';
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
import { toast } from "sonner";

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
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
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
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
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
      toast("Vui lòng nhập họ tên!");
      return;
    }
    if (!editForm.phone || !/^0[3|5|7|8|9]\d{8}$/.test(editForm.phone)) {
      toast("Số điện thoại không hợp lệ!");
      return;
    }
    
    try {
      if (!user) {
        toast.error("Không tìm thấy thông tin người dùng!");
        return;
      }
      const response = await fetch(
        `${API_URL}/api/users/update/${user.userID}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editForm),
        }
      );

      if (!response.ok) {
        toast.error("Cập nhật hồ sơ thất bại!");
        return;
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setIsEditOpen(false);
      toast.success("Cập nhật hồ sơ thành công!");
    } catch (error) {
      console.error(error);
      toast.error("Đã có lỗi xảy ra khi cập nhật hồ sơ!");
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword.trim()) {
      toast("Vui lòng nhập mật khẩu hiện tại!");
      return;
    }
    if (!passwordForm.newPassword.trim()) {
      toast("Vui lòng nhập mật khẩu mới!");
      return;
    }
    
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(passwordForm.newPassword)) {
      toast("Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, số và ký tự đặc biệt!");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast("Mật khẩu xác nhận không khớp!");
      return;
    }

    try {
      if (!user) {
        toast.error("Không tìm thấy thông tin người dùng!");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/users/change-password/${user.userID}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Đổi mật khẩu thất bại!");
        return;
      }

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsPasswordOpen(false);
      toast.success("Đổi mật khẩu thành công!");
    } catch (error) {
      console.error(error);
      toast.error("Đã có lỗi xảy ra khi đổi mật khẩu!");
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
          <Button
            onClick={() => {
              setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
              });
              setIsPasswordOpen(true);
            }}
            className="mt-8 w-full md:w-auto ml-4"
            variant="outline"
          >
            Đổi mật khẩu
          </Button>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-2xl font-bold text-gray-800">
              ✏️ Chỉnh Sửa Hồ Sơ
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-2">
              Cập nhật thông tin cá nhân và tài khoản ngân hàng của bạn
            </p>
          </DialogHeader>

          {editForm && (
            <div className="space-y-5 py-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Họ và tên <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={editForm.full_name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, full_name: e.target.value })
                  }
                  placeholder="Nguyễn Văn A"
                  className="h-11 border-gray-300 focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Số điện thoại <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={editForm.phone || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                  placeholder="0901234567"
                  className="h-11 border-gray-300 focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Địa chỉ</Label>
                <Input
                  value={editForm.address || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, address: e.target.value })
                  }
                  placeholder="Quận 7, TP.HCM"
                  className="h-11 border-gray-300 focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  💳 Thông tin ngân hàng
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">
                      Tên ngân hàng
                    </Label>
                    <Input
                      value={editForm.bank_name || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, bank_name: e.target.value })
                      }
                      placeholder="MB Bank, Vietcombank, Techcombank..."
                      className="h-11 border-gray-300 focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">
                      Số tài khoản
                    </Label>
                    <Input
                      value={editForm.bank_account_number || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, bank_account_number: e.target.value })
                      }
                      placeholder="0789123456"
                      className="h-11 border-gray-300 focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">
                      Chủ tài khoản
                    </Label>
                    <Input
                      value={editForm.bank_account_owner || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, bank_account_owner: e.target.value })
                      }
                      placeholder="NGUYEN VAN A"
                      className="h-11 border-gray-300 focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              className="h-11 px-6"
            >
              Hủy
            </Button>
            <Button 
              onClick={handleSave}
              className="h-11 px-6 bg-green-600 hover:bg-green-700"
            >
              💾 Lưu Thay Đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-2xl font-bold text-gray-800">
              🔒 Đổi Mật Khẩu
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-2">
              Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, số và ký tự đặc biệt
            </p>
          </DialogHeader>

          <div className="space-y-5 py-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                Mật khẩu hiện tại <span className="text-red-500">*</span>
              </Label>
              <Input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                }
                placeholder="••••••••"
                className="h-11 border-gray-300 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                Mật khẩu mới <span className="text-red-500">*</span>
              </Label>
              <Input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                }
                placeholder="••••••••"
                className="h-11 border-gray-300 focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ví dụ: MyPass123!
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                Xác nhận mật khẩu mới <span className="text-red-500">*</span>
              </Label>
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
                placeholder="••••••••"
                className="h-11 border-gray-300 focus:ring-2 focus:ring-blue-500"
              />
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
          </div>

          <DialogFooter className="pt-4 border-t gap-2">
            <Button
              variant="outline"
              onClick={() => setIsPasswordOpen(false)}
              className="h-11 px-6"
            >
              Hủy
            </Button>
            <Button 
              onClick={handleChangePassword}
              className="h-11 px-6 bg-blue-600 hover:bg-blue-700"
            >
              🔑 Đổi Mật Khẩu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
