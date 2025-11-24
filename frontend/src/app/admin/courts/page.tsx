/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Court {
  courtID: string;
  name: string;
  type: string;
  status: string;
  multiplier: number;
  image?: string;
}

export default function CourtsPage() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    status: "",
    multiplier: 1,
    image: "",
  });
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [editImagePreview, setEditImagePreview] = useState<string>("");

  const fetchCourts = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/courts");
      const data = await res.json();
      setCourts(data);
      console.log(`http://localhost:5000${data[0]?.image}`)

    } catch (error) {
      console.error("Lỗi khi tải sân:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourts();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateCourt = async () => {
    try {
      if (!formData.name || !formData.type || !formData.status) {
        toast.error("Vui lòng điền đầy đủ thông tin");
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("type", formData.type);
      formDataToSend.append("status", formData.status);
      formDataToSend.append("multiplier", formData.multiplier.toString());
      
      if (imageFile) {
        formDataToSend.append("image", imageFile);
      }

      const res = await fetch("http://localhost:5000/api/courts/create", {
        method: "POST",
        body: formDataToSend,
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Lỗi khi tạo sân");
      }
      
      toast.success("Tạo sân thành công!");
      setShowForm(false);
      setFormData({ name: "", type: "", status: "", multiplier: 1, image: "" });
      setImageFile(null);
      setImagePreview("");
      fetchCourts();
    } catch (error: unknown) {
      toast.error((error as Error).message || "Lỗi khi tạo sân");
    }
  };

  const handleUpdateCourt = async () => {
    if (!editingCourt) return;
    
    try {
      if (!editingCourt.name || !editingCourt.type || !editingCourt.status) {
        toast.error("Vui lòng điền đầy đủ thông tin");
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append("name", editingCourt.name);
      formDataToSend.append("type", editingCourt.type);
      formDataToSend.append("status", editingCourt.status);
      formDataToSend.append("multiplier", editingCourt.multiplier.toString());
      
      if (editImageFile) {
        formDataToSend.append("image", editImageFile);
      }

      const res = await fetch(`http://localhost:5000/api/courts/update/${editingCourt.courtID}`, {
        method: "PUT",
        body: formDataToSend,
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Lỗi khi cập nhật sân");
      }
      
      toast.success("Cập nhật sân thành công!");
      setEditingCourt(null);
      setEditImageFile(null);
      setEditImagePreview("");
      fetchCourts();
    } catch (error: unknown) {
      toast.error((error as Error).message || "Lỗi khi cập nhật sân");
    }
  };


  const handleDeleteCourt = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa sân "${name}"?`)) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/courts/delete/${id}`, {
        method: "DELETE",
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Lỗi khi xóa sân");
      }
      
      toast.success("Xóa sân thành công!");
      fetchCourts();
    } catch (error: unknown) {
      toast.error((error as Error).message || "Lỗi khi xóa sân");
    }
  };

  const filteredCourts = courts.filter((court) => {
    const keyword = searchInput.toLowerCase();

    return (
      court.name.toLowerCase().includes(keyword) ||
      court.type.toLowerCase().includes(keyword) ||
      court.status.toLowerCase().includes(keyword)
    );
  });

  if (loading) return <p>Đang tải dữ liệu...</p>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Quản Lý Sân</h1>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm sân..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 shadow-sm"
          />
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Thêm Sân
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Hình Ảnh</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Tên Sân</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Loại</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Trạng Thái</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Hệ Số Tiền</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredCourts.map((court) => (
              <tr key={court.courtID} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {court.image ? (
                    <img 
                      src={`http://localhost:5000${court.image}`} 
                      alt={court.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No Image</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium">{court.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {court.type === "INDOOR" ? "Trong nhà" : "Ngoài trời"}

                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${court.status === "AVAILABLE"
                      ? "bg-green-100 text-green-800"
                      : court.status === "OCCUPIED"
                        ? "bg-yellow-100 text-yellow-800"
                        : court.status === "MAINTENANCE"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                  >
                    {court.status === "AVAILABLE" ? "Hoạt động" : court.status === "OCCUPIED" ? "Đang sử dụng" : court.status === "MAINTENANCE" ? "Bảo trì" : "Đóng cửa"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium">{court.multiplier}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button className="text-blue-600 hover:text-blue-900"
                    onClick={() => setEditingCourt(court)}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCourt(court.courtID, court.name)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm Sân Mới</DialogTitle>
            <DialogDescription>
              Nhập thông tin để tạo sân mới
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Tên sân *</Label>
              <Input
                id="name"
                placeholder="VD: Sân A1"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="type">Loại sân *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại sân" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INDOOR">Trong nhà</SelectItem>
                  <SelectItem value="OUTDOOR">Ngoài trời</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="multiplier">Hệ số nhân *</Label>
              <Input
                id="multiplier"
                type="number"
                step="0.1"
                min="0"
                placeholder="VD: 1.2"
                value={isNaN(formData.multiplier) ? "" : formData.multiplier}
                onChange={(e) => setFormData({ ...formData, multiplier: parseFloat(e.target.value) })}
              />
              <p className="text-xs text-gray-500 mt-1">Hệ số nhân giá tiền (VD: 1.2 = tăng 20%)</p>
            </div>

            <div>
              <Label htmlFor="status">Trạng thái *</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Hoạt động</SelectItem>
                  <SelectItem value="OCCUPIED">Đang sử dụng</SelectItem>
                  <SelectItem value="MAINTENANCE">Bảo trì</SelectItem>
                  <SelectItem value="CLOSED">Đóng cửa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="image">Hình ảnh sân</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="cursor-pointer"
              />
              {imagePreview && (
                <div className="mt-3">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowForm(false);
              setImageFile(null);
              setImagePreview("");
            }}>
              Hủy
            </Button>
            <Button onClick={handleCreateCourt} className="bg-blue-600 hover:bg-blue-700">
              Tạo sân
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingCourt} onOpenChange={(open) => !open && setEditingCourt(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh Sửa Sân</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin sân
            </DialogDescription>
          </DialogHeader>
          
          {editingCourt && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Tên sân *</Label>
                <Input
                  id="edit-name"
                  placeholder="VD: Sân A1"
                  value={editingCourt.name}
                  onChange={(e) => setEditingCourt({ ...editingCourt, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit-type">Loại sân *</Label>
                <Select 
                  value={editingCourt.type} 
                  onValueChange={(value) => setEditingCourt({ ...editingCourt, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INDOOR">Trong nhà</SelectItem>
                    <SelectItem value="OUTDOOR">Ngoài trời</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-multiplier">Hệ số nhân *</Label>
                <Input
                  id="edit-multiplier"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="VD: 1.2"
                  value={editingCourt.multiplier}
                  onChange={(e) => setEditingCourt({ ...editingCourt, multiplier: parseFloat(e.target.value) })}
                />
                <p className="text-xs text-gray-500 mt-1">Hệ số nhân giá tiền (VD: 1.2 = tăng 20%)</p>
              </div>

              <div>
                <Label htmlFor="edit-status">Trạng thái *</Label>
                <Select 
                  value={editingCourt.status} 
                  onValueChange={(value) => setEditingCourt({ ...editingCourt, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">Hoạt động</SelectItem>
                    <SelectItem value="OCCUPIED">Đang sử dụng</SelectItem>
                    <SelectItem value="MAINTENANCE">Bảo trì</SelectItem>
                    <SelectItem value="CLOSED">Đóng cửa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-image">Hình ảnh sân</Label>
                {editingCourt.image && !editImagePreview && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-2">Ảnh hiện tại:</p>
                    <img 
                      src={`http://localhost:5000${editingCourt.image}`} 
                      alt={editingCourt.name}
                      className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                    />
                  </div>
                )}
                <Input
                  id="edit-image"
                  type="file"
                  accept="image/*"
                  onChange={handleEditImageChange}
                  className="cursor-pointer"
                />
                {editImagePreview && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">Ảnh mới:</p>
                    <img 
                      src={editImagePreview} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded-lg border-2 border-green-200"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditingCourt(null);
              setEditImageFile(null);
              setEditImagePreview("");
            }}>
              Hủy
            </Button>
            <Button onClick={handleUpdateCourt} className="bg-green-600 hover:bg-green-700">
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
