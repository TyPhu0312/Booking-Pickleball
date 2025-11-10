"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Plus, Edit, Trash2, Clock, Calendar, DollarSign, FileDown, Save, X } from "lucide-react";
import * as XLSX from "xlsx";
import TimePicker from "react-time-picker";
import "react-time-picker/dist/TimePicker.css";

interface SlotStatus {
  slot_id: number;
  slot_name: string;
  start_time?: string | null;
  end_time?: string | null;
  price: number;
  totalCourts: number;
  bookedCourts: number;
  availableCourts: number;

}
interface Slot {
  slotID: number;
  slot_name: string;
  start_time: string;
  end_time: string;
  price: number;
}

export default function SlotsPage() {
  const [slotsStatus, setSlotsStatus] = useState<SlotStatus[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<SlotStatus>>({});

  const fetchSlotsByDate = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("fetching data for date:", selectedDate);
      const res = await fetch(`http://localhost:5000/api/slots/getSlotStatusByDate/${selectedDate}`);
      if (!res.ok) throw new Error("Lỗi khi tải dữ liệu slot");
      const data = await res.json();
      setSlotsStatus(data.slots || []);
    } catch (err: any) {
      setError(err.message);
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
    const data = slotsStatus.map((slotST) => ({
      "Khung giờ": `${slotST.start_time} - ${slotST.end_time}`,
      "Giá": slotST.price.toLocaleString() + "đ",
      "Tổng sân": slotST.totalCourts,
      "Sân đã đặt": slotST.bookedCourts,
      "Sân còn trống": slotST.availableCourts,
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
    const method = editing ? "PUT" : "POST";
    const url = editing
      ? `http://localhost:5000/api/slots/update/${formData.slot_id}`
      : "http://localhost:5000/api/slots/create";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Không thể lưu slot");
      await fetchSlotsByDate();
      setShowAddModal(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xoá slot này?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/slots/delete/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Không thể xoá slot");
      fetchSlotsByDate();
    } catch (err: any) {
      alert(err.message);
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
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                  Tên Slot
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                  Khung giờ
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                  Giá/Giờ
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">
                  Tổng sân
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">
                  Đã đặt
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">
                  Còn trống
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {slotsStatus.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-500">
                    Không có dữ liệu cho ngày này
                  </td>
                </tr>
              ) : (
                slotsStatus.sort((a, b) => parseInt(a.slot_name.replace("Slot ", "")) - parseInt(b.slot_name.replace("Slot ", "")))
                .map((slot) => (
                  <tr key={slot.slot_id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {slot.slot_name}
                    </td>

                    <td className="px-6 py-4 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">
                        {slot.start_time} - {slot.end_time}
                      </span>
                    </td>

                    <td className="px-6 py-4 gap-1">
                    <span className="font-semibold flex items-center">
                    <DollarSign className="w-4 h-4 text-green-600" />
                        {slot.price.toLocaleString()}đ 
                      </span>
                    </td>
          
                    <td className="px-6 py-4 text-center font-medium text-gray-800">
                      {slot.totalCourts}
                    </td>

                    <td className="px-6 py-4 text-center font-semibold text-orange-600">
                      {slot.bookedCourts}
                    </td>

                    <td
                      className={`px-6 py-4 text-center font-bold text-lg ${slot.availableCourts > 0 ? "text-green-600" : "text-red-600"
                        }`}
                    >
                      {slot.availableCourts}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-900"
                        onClick={() => openEditModal(slot)}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(slot.slot_id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md relative shadow-lg">
            <button onClick={() => setShowAddModal(false)} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700">
              <X />
            </button>
            <h2 className="text-xl font-bold mb-4">{editing ? "Sửa Slot" : "Thêm Slot"}</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Tên slot"
                value={formData.slot_name || ""}
                onChange={(e) => setFormData({ ...formData, slot_name: e.target.value })}
                className="w-full border p-2 rounded"
              />
              <TimePicker
                value={formData.start_time}
                onChange={(value) => setFormData({ ...formData, start_time: value || "" })}
                disableClock={true}
                format="HH:mm"
              />
              <TimePicker
                value={formData.end_time}
                onChange={(value) => setFormData({ ...formData, end_time: value || "" })}
                disableClock={true}
                format="HH:mm"
              />
              <input
                type="number"
                placeholder="Giá / giờ"
                value={formData.price || ""}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="w-full border p-2 rounded"
              />
            </div>
            <button
              onClick={handleSave}
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
              <Save className="inline w-4 h-4 mr-2" />
              Lưu
            </button>
          </div>
        </div>
      )}
    </div>

  );
}
