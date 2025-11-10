"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const initialUser = {
  name: "Nguyễn Văn A",
  email: "nguyenvana@gmail.com",
  phone: "0901234567",
  level: "trung_binh",
  gender: "nam",
  birthday: "1995-03-15",
  address: "Quận 7, TP.HCM",
};

export default function ProfilePage() {
  const [user, setUser] = useState(initialUser);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(initialUser);

  const handleSave = () => {
    if (!editForm.name.trim()) {
      alert("Vui lòng nhập họ tên!");
      return;
    }
    if (!editForm.phone.match(/^0[3|5|7|8|9]\d{8}$/)) {
      alert("Số điện thoại không hợp lệ!");
      return;
    }

    setUser(editForm);
    setIsEditOpen(false);
    alert("Cập nhật hồ sơ thành công!");
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Hồ Sơ Người Dùng</h1>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-6 mb-8">
            <Avatar className="w-24 h-24">
              <AvatarImage src="" />
              <AvatarFallback className="text-2xl">NA</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <Label className="text-gray-600">Số điện thoại</Label>
              <p className="font-medium">{user.phone}</p>
            </div>
            <div>
              <Label className="text-gray-600">Cấp độ chơi</Label>
              <p className="font-medium capitalize">{user.level.replace("_", " ")}</p>
            </div>
            <div>
              <Label className="text-gray-600">Giới tính</Label>
              <p className="font-medium capitalize">{user.gender}</p>
            </div>
            <div>
              <Label className="text-gray-600">Ngày sinh</Label>
              <p className="font-medium">{format(new Date(user.birthday), "dd/MM/yyyy")}</p>
            </div>
            <div className="md:col-span-2">
              <Label className="text-gray-600">Địa chỉ</Label>
              <p className="font-medium">{user.address}</p>
            </div>
          </div>

          <Button onClick={() => { setEditForm(user); setIsEditOpen(true); }} className="mt-8 w-full md:w-auto">
            Chỉnh Sửa Hồ Sơ
          </Button>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh Sửa Hồ Sơ</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Họ và tên</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input value={editForm.email} readOnly className="bg-gray-50" />
            </div>

            <div>
              <Label>Số điện thoại</Label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="0901234567"
              />
            </div>

            <div>
              <Label>Cấp độ chơi</Label>
              <Select value={editForm.level} onValueChange={(v) => setEditForm({ ...editForm, level: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="moi_choi">Mới chơi</SelectItem>
                  <SelectItem value="trung_binh">Trung bình</SelectItem>
                  <SelectItem value="kha_gioi">Khá giỏi</SelectItem>
                  <SelectItem value="chuyen_nghiep">Chuyên nghiệp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Giới tính</Label>
              <Select value={editForm.gender} onValueChange={(v) => setEditForm({ ...editForm, gender: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nam">Nam</SelectItem>
                  <SelectItem value="nu">Nữ</SelectItem>
                  <SelectItem value="khac">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Ngày sinh</Label>
              <Input
                type="date"
                value={editForm.birthday}
                onChange={(e) => setEditForm({ ...editForm, birthday: e.target.value })}
              />
            </div>

            <div>
              <Label>Địa chỉ</Label>
              <Input
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                placeholder="Quận 7, TP.HCM"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Hủy</Button>
            <Button onClick={handleSave}>Lưu Thay Đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}