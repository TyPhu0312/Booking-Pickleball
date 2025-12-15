"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Plus, Edit, Trash2, Clock, Calendar, DollarSign, FileDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import TimePicker from "react-time-picker";
import "react-time-picker/dist/TimePicker.css";
import { API_URL } from "@/lib/config";

interface SlotStatus {
  slot_id: string;
  slot_name: string;
  start_time?: string | null;
  end_time?: string | null;
  price: number;
  totalCourts: Record<string, number>;
  bookedCourts: number;
  availableCourts: Record<string, number>;
}

export default function SlotsPage() {
  const [slotsStatus, setSlotsStatus] = useState<SlotStatus[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<SlotStatus>>({});
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [deleteSlotId, setDeleteSlotId] = useState<string | null>(null);

  const fetchSlotsByDate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:5000/api/slots/getSlotStatusByOneDate/${selectedDate}`);
      if (!res.ok) throw new Error("Lỗi khi tải dữ liệu slot");
      const data = await res.json();

      setSlotsStatus(data.slots || []);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlotsByDate();
    const interval = setInterval(fetchSlotsByDate, 10000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  const handleExportExcel = () => {
    const data = slotsStatus.map(slot => ({
      "Tên Slot": slot.slot_name,
      "Khung giờ": `${slot.start_time} - ${slot.end_time}`,
      "Giá": slot.price.toLocaleString() + "đ",
      "Tổng sân INDOOR": slot.totalCourts.INDOOR,
      "Tổng sân OUTDOOR": slot.totalCourts.OUTDOOR,
      "Sân đã đặt": slot.bookedCourts,
      "Sân còn trống INDOOR": slot.availableCourts.INDOOR,
      "Sân còn trống OUTDOOR": slot.availableCourts.OUTDOOR,
      "Ngày": selectedDate,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Slots");
    XLSX.writeFile(wb, `Slot_Status_${selectedDate}.xlsx`);
  };

  const openAddModal = () => {
    setEditing(false);
    setFormData({});
    setShowAddModal(true);
  };

  const openEditModal = (slot: SlotStatus) => {
    setEditing(true);
    setFormData(slot);
    setShowAddModal(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.slot_name || !formData.start_time || !formData.end_time || !formData.price) {
        toast.error("Vui lòng điền đầy đủ thông tin");
        return;
      }

      const method = editing ? "PUT" : "POST";
      const url = editing
        ? `${API_URL}/api/slots/update/${formData.slot_id}`
        : `${API_URL}/api/slots/create`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Không thể lưu slot");
      }

      toast.success(editing ? "Cập nhật slot thành công!" : "Tạo slot thành công!");
      await fetchSlotsByDate();
      setShowAddModal(false);
      setFormData({});
    } catch (err: unknown) {
      toast.error((err as Error).message || "Có lỗi xảy ra");
    }
  };

  const handleDelete = async (id: string) => {
    if (!deleteSlotId) return;

    try {
      const res = await fetch(`${API_URL}/api/slots/delete/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Không thể xoá slot");
      }

      toast.success("Xóa slot thành công!");
      setShowCancelConfirm(false);
      setDeleteSlotId(null);
      await fetchSlotsByDate();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Có lỗi xảy ra");
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Quản Lý Khung Giờ</h1>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            <FileDown className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            Thêm Slot
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Đang tải dữ liệu...</div>
      ) : error ? (
        <div className="text-center py-10 text-red-500">{error}</div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-linear-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Tên Slot</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Khung giờ</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Giá/Giờ</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">Tổng sân INDOOR</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">Tổng sân OUTDOOR</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">Đã đặt</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">Còn trống INDOOR</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">Còn trống OUTDOOR</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {slotsStatus.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-6 text-gray-500">
                    Không có dữ liệu cho ngày này
                  </td>
                </tr>
              ) : (
                slotsStatus
                  .sort((a, b) => parseInt(a.slot_name.replace("Slot ", "")) - parseInt(b.slot_name.replace("Slot ", "")))
                  .map((slot) => (
                    <tr key={slot.slot_id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium text-gray-800">{slot.slot_name}</td>
                      <td className="px-6 py-4 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">{slot.start_time} - {slot.end_time}</span>
                      </td>
                      <td className="px-6 py-4 gap-1">
                        <span className="font-semibold flex items-center">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          {slot.price.toLocaleString()}đ
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-gray-800">{slot.totalCourts.INDOOR}</td>
                      <td className="px-6 py-4 text-center font-medium text-gray-800">{slot.totalCourts.OUTDOOR}</td>
                      <td className="px-6 py-4 text-center font-semibold text-orange-600">{slot.bookedCourts}</td>
                      <td className={`px-6 py-4 text-center font-bold ${slot.availableCourts.INDOOR > 0 ? "text-green-600" : "text-red-600"}`}>{slot.availableCourts.INDOOR}</td>
                      <td className={`px-6 py-4 text-center font-bold ${slot.availableCourts.OUTDOOR > 0 ? "text-green-600" : "text-red-600"}`}>{slot.availableCourts.OUTDOOR}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button className="text-blue-600 hover:text-blue-900" onClick={() => openEditModal(slot)}>
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900"
                          onClick={() => {
                            setDeleteSlotId(slot.slot_id);
                            setShowCancelConfirm(true);
                          }}>
                          <Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Chỉnh Sửa Slot" : "Thêm Slot Mới"}</DialogTitle>
            <DialogDescription>
              {editing ? "Cập nhật thông tin khung giờ" : "Nhập thông tin để tạo khung giờ mới"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="slot_name">Tên slot *</Label>
              <Input
                id="slot_name"
                placeholder="VD: Slot 1"
                value={formData.slot_name || ""}
                onChange={(e) => setFormData({ ...formData, slot_name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="start_time">Giờ bắt đầu *</Label>
              <div className="mt-1">
                <TimePicker
                  value={formData.start_time}
                  onChange={(value) => setFormData({ ...formData, start_time: value || "" })}
                  disableClock={true}
                  format="HH:mm"
                  className="w-full"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Chọn giờ bắt đầu khung giờ</p>
            </div>

            <div>
              <Label htmlFor="end_time">Giờ kết thúc *</Label>
              <div className="mt-1">
                <TimePicker
                  value={formData.end_time}
                  onChange={(value) => setFormData({ ...formData, end_time: value || "" })}
                  disableClock={true}
                  format="HH:mm"
                  className="w-full"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Chọn giờ kết thúc khung giờ</p>
            </div>

            <div>
              <Label htmlFor="price">Giá / giờ (VNĐ) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="1000"
                placeholder="VD: 200000"
                value={formData.price || ""}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              />
              <p className="text-xs text-gray-500 mt-1">Nhập giá cho mỗi giờ chơi</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddModal(false);
              setFormData({});
            }}>
              Hủy
            </Button>
            <Button
              onClick={handleSave}
              className={editing ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}
            >
              {editing ? "Cập nhật" : "Tạo slot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Xác nhận xoá slot</h2>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xoá slot này? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete.bind(null, deleteSlotId!)}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Xác nhận xoá
              </button>
              <button
                onClick={() => {
                  setShowCancelConfirm(false);
                  setDeleteSlotId(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Không
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
