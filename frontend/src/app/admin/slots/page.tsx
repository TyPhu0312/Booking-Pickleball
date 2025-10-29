// app/admin/slots/page.tsx
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Plus, Edit, Trash2, Clock, Calendar, DollarSign, AlertCircle, FileDown, Save } from "lucide-react";
import * as XLSX from "xlsx";

interface Booking {
  id: number;
  slot_id: number;
  date: string;
  court_count: number;
}

interface Slot {
  id: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  price: number;
  is_special: boolean;
  special_type: "tournament" | "maintenance" | null;
  total_courts: number;
}

const initialSlots: Slot[] = [
  { id: 1, start_time: "06:00", end_time: "07:00", is_active: true, price: 200000, is_special: false, special_type: null, total_courts: 4 },
  { id: 2, start_time: "07:00", end_time: "08:00", is_active: true, price: 200000, is_special: false, special_type: null, total_courts: 4 },
  { id: 3, start_time: "08:00", end_time: "09:00", is_active: true, price: 200000, is_special: false, special_type: null, total_courts: 4 },
  { id: 4, start_time: "15:00", end_time: "16:00", is_active: true, price: 250000, is_special: false, special_type: null, total_courts: 4 },
  { id: 5, start_time: "16:00", end_time: "17:00", is_active: true, price: 250000, is_special: false, special_type: null, total_courts: 4 },
  { id: 6, start_time: "17:00", end_time: "18:00", is_active: true, price: 250000, is_special: false, special_type: null, total_courts: 4 },
  { id: 7, start_time: "19:00", end_time: "20:00", is_active: true, price: 300000, is_special: true, special_type: "tournament", total_courts: 4 },
  { id: 8, start_time: "20:00", end_time: "21:00", is_active: false, price: 300000, is_special: true, special_type: "maintenance", total_courts: 4 },
  { id: 9, start_time: "21:00", end_time: "22:00", is_active: true, price: 300000, is_special: false, special_type: null, total_courts: 4 },
];

// Giả lập bookings
const mockBookings: Booking[] = [
  { id: 1, slot_id: 1, date: "2025-10-30", court_count: 1 },
  { id: 2, slot_id: 2, date: "2025-10-30", court_count: 4 },
  { id: 3, slot_id: 5, date: "2025-10-30", court_count: 3 },
  { id: 4, slot_id: 9, date: "2025-10-30", court_count: 3 },
];

export default function SlotsPage() {
  const [slots, setSlots] = useState<Slot[]>(initialSlots);
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);

  // Tính sân trống theo ngày
  const getBookedCount = (slotId: number) => {
    return bookings
      .filter(b => b.slot_id === slotId && b.date === selectedDate)
      .reduce((sum, b) => sum + b.court_count, 0);
  };

  const getAvailable = (slot: Slot) => {
    if (!slot.is_active || slot.is_special) return 0;
    return Math.max(0, slot.total_courts - getBookedCount(slot.id));
  };

  const handleSaveSlot = (updated: Slot) => {
    setSlots(slots.map(s => s.id === updated.id ? updated : s));
    setEditingSlot(null);
    setShowAddModal(false);
  };

  const handleExportExcel = () => {
    const data = slots.map(slot => ({
      "Slot": `${slot.start_time} - ${slot.end_time}`,
      "Giá": slot.price.toLocaleString() + "đ",
      "Trạng thái": slot.is_active ? "Hoạt động" : "Tạm dừng",
      "Đặc biệt": slot.is_special ? (slot.special_type === "tournament" ? "Giải đấu" : "Bảo trì") : "Không",
      "Tổng sân": slot.total_courts,
      "Đặt hôm nay": getBookedCount(slot.id),
      "Còn trống": getAvailable(slot),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Slots");
    XLSX.writeFile(wb, `Slots_${selectedDate}.xlsx`);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Quản Lý Slots</h1>
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
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            Thêm Slot
          </button>
        </div>
      </div>

      {/* BẢNG SLOT NÂNG CAO */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Slot</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Giá/Giờ</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Trạng Thái</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Đặc Biệt</th>
              <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">Tổng</th>
              <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">Đặt</th>
              <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">Còn</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {slots.map((slot) => {
              const booked = getBookedCount(slot.id);
              const available = getAvailable(slot);
              return (
                <tr key={slot.id} className={`hover:bg-gray-50 transition ${!slot.is_active ? "opacity-60" : ""}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">{slot.start_time} - {slot.end_time}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-semibold">{slot.price.toLocaleString()}đ</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={slot.is_active}
                        onChange={() => {
                          setSlots(slots.map(s => s.id === slot.id ? { ...s, is_active: !s.is_active } : s));
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className={`text-sm font-medium ${slot.is_active ? "text-green-600" : "text-red-600"}`}>
                        {slot.is_active ? "Hoạt động" : "Tạm dừng"}
                      </span>
                    </label>
                  </td>
                  <td className="px-6 py-4">
                    {slot.is_special ? (
                      <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${
                        slot.special_type === "tournament" 
                          ? "bg-purple-100 text-purple-800" 
                          : "bg-orange-100 text-orange-800"
                      }`}>
                        <AlertCircle className="w-3 h-3" />
                        {slot.special_type === "tournament" ? "Giải đấu" : "Bảo trì"}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center font-medium">{slot.total_courts}</td>
                  <td className="px-6 py-4 text-center">{booked}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-bold text-lg ${available > 0 ? "text-green-600" : "text-red-600"}`}>
                      {available}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button
                      onClick={() => setEditingSlot(slot)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Chỉnh sửa"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Xóa slot này?")) {
                          setSlots(slots.filter(s => s.id !== slot.id));
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL THÊM/SỬA SLOT */}
      {(showAddModal || editingSlot) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Save className="w-5 h-5" />
              {editingSlot ? "Chỉnh Sửa Slot" : "Thêm Slot Mới"}
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const start = (form.elements.namedItem("start") as HTMLInputElement).value;
                const end = (form.elements.namedItem("end") as HTMLInputElement).value;
                const price = Number((form.elements.namedItem("price") as HTMLInputElement).value);
                const isSpecial = (form.elements.namedItem("is_special") as HTMLInputElement).checked;
                const specialType = isSpecial ? (form.elements.namedItem("special_type") as HTMLSelectElement).value as "tournament" | "maintenance" : null;

                const newSlot: Slot = editingSlot ? {
                  ...editingSlot,
                  start_time: start,
                  end_time: end,
                  price,
                  is_special: isSpecial,
                  special_type: specialType,
                } : {
                  id: slots.length + 1,
                  start_time: start,
                  end_time: end,
                  is_active: true,
                  price,
                  is_special: isSpecial,
                  special_type: specialType,
                  total_courts: 4,
                };

                handleSaveSlot(newSlot);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Giờ bắt đầu</label>
                  <input
                    type="time"
                    name="start"
                    defaultValue={editingSlot?.start_time}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Giờ kết thúc</label>
                  <input
                    type="time"
                    name="end"
                    defaultValue={editingSlot?.end_time}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Giá mỗi giờ (VNĐ)</label>
                <input
                  type="number"
                  name="price"
                  defaultValue={editingSlot?.price || 200000}
                  min="0"
                  step="10000"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_special"
                    defaultChecked={editingSlot?.is_special}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium">Slot đặc biệt</span>
                </label>
              </div>

              {(document.querySelector("[name=is_special]") as HTMLInputElement)?.checked || editingSlot?.is_special ? (
                <div>
                  <label className="block text-sm font-medium mb-1">Loại đặc biệt</label>
                  <select
                    name="special_type"
                    defaultValue={editingSlot?.special_type || "tournament"}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="tournament">Giải đấu</option>
                    <option value="maintenance">Bảo trì</option>
                  </select>
                </div>
              ) : null}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingSlot(null);
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingSlot ? "Cập Nhật" : "Thêm Slot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}