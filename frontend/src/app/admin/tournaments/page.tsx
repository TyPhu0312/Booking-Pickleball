/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Tournament {
  tournamentID: string;
  name: string;
  start_day: string;
  description: string | null;
  status: string;
  max_teams: number;
  image: string | null;
  user_id: string| null;
  phone_user: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTournaments, setTotalTournaments] = useState(0);
  const [form, setForm] = useState({
    name: "",
    start_day: "",
    max_teams: "",
    description: "",
    image: "",
    phone_user: "",
    status: "UPCOMING",
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchTournaments();
  }, [currentPage, statusFilter, debouncedSearch]);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(debouncedSearch && { search: debouncedSearch }),
      });

      const res = await fetch(`${API_URL}/api/tournaments?${params}`);
      if (!res.ok) throw new Error("Không thể tải danh sách giải đấu");
      
      const data = await res.json();
      setTournaments(data.tournaments || []);
      setTotalPages(data.totalPages || 1);
      setTotalTournaments(data.totalTournaments || 0);
    } catch (error: unknown) {
      toast.error((error as Error).message || "Lỗi khi tải danh sách giải đấu");
    } finally {
      setLoading(false);
    }
  };

  const validatePhoneNumber = (phone: string): boolean => {
    if (!phone) return true; 
    const phoneRegex = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
    return phoneRegex.test(phone);
  };

  const handleCreate = async () => {
    try {
      if (!form.name.trim()) {
        toast.error("Vui lòng nhập tên giải đấu");
        return;
      }

      if (!form.start_day) {
        toast.error("Vui lòng chọn ngày diễn ra");
        return;
      }

      if (!form.max_teams || parseInt(form.max_teams) < 2) {
        toast.error("Số đội tối đa phải từ 2 trở lên");
        return;
      }

      if (form.phone_user && !validatePhoneNumber(form.phone_user)) {
        toast.error("Số điện thoại không hợp lệ (VD: 0912345678 hoặc +84912345678)");
        return;
      }

      const userData = localStorage.getItem("user");
      if (!userData) {
        toast.error("Vui lòng đăng nhập");
        return;
      }

      const user = JSON.parse(userData);
      const payload = {
        ...form,
        max_teams: parseInt(form.max_teams),
        user_id: user.userID,
      };

      const res = await fetch(`${API_URL}/api/tournaments/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Không thể tạo giải đấu");
      }

      toast.success("Tạo giải đấu thành công!");
      setIsCreateOpen(false);
      setForm({
        name: "",
        start_day: "",
        max_teams: "",
        description: "",
        image: "",
        phone_user: "",
        status: "UPCOMING",
      });
      fetchTournaments();
    } catch (error: unknown) {
      toast.error((error as Error).message || "Lỗi khi tạo giải đấu");
    }
  };

  const handleEdit = async () => {
    if (!selectedTournament) return;
    
    try {
      if (!form.name.trim()) {
        toast.error("Vui lòng nhập tên giải đấu");
        return;
      }

      if (!form.start_day) {
        toast.error("Vui lòng chọn ngày diễn ra");
        return;
      }

      if (!form.max_teams || parseInt(form.max_teams) < 2) {
        toast.error("Số đội tối đa phải từ 2 trở lên");
        return;
      }

      if (form.phone_user && !validatePhoneNumber(form.phone_user)) {
        toast.error("Số điện thoại không hợp lệ (VD: 0912345678 hoặc +84912345678)");
        return;
      }

      const payload = {
        name: form.name,
        start_day: form.start_day,
        max_teams: parseInt(form.max_teams),
        description: form.description,
        image: form.image,
        status: form.status,
      };

      const res = await fetch(`${API_URL}/api/tournaments/update/${selectedTournament.tournamentID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Không thể cập nhật giải đấu");
      }

      toast.success("Cập nhật giải đấu thành công!");
      setIsEditOpen(false);
      setSelectedTournament(null);
      fetchTournaments();
    } catch (error: unknown) {
      toast.error((error as Error).message || "Lỗi khi cập nhật giải đấu");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa giải đấu "${name}"?`)) return;

    try {
      const res = await fetch(`${API_URL}/api/tournaments/delete/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Không thể xóa giải đấu");
      }

      toast.success("Xóa giải đấu thành công!");
      fetchTournaments();
    } catch (error: unknown) {
      toast.error((error as Error).message || "Lỗi khi xóa giải đấu");
    }
  };

  const openEditDialog = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setForm({
      name: tournament.name,
      start_day: tournament.start_day.split("T")[0],
      max_teams: tournament.max_teams.toString(),
      description: tournament.description || "",
      image: tournament.image || "",
      phone_user: tournament.phone_user || "",
      status: tournament.status,
    });
    setIsEditOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      UPCOMING: "bg-blue-100 text-blue-800",
      ONGOING: "bg-yellow-100 text-yellow-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    const labels = {
      UPCOMING: "Sắp diễn ra",
      ONGOING: "Đang diễn ra",
      COMPLETED: "Đã kết thúc",
      CANCELLED: "Đã hủy",
    };
    return (
      <span className={`px-3 py-1 text-xs rounded-full ${styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800"}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Quản Lý Giải Đấu</h1>
        <button 
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Plus className="w-4 h-4" />
          Tạo Giải Mới
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Tìm kiếm theo tên hoặc mô tả..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="UPCOMING">Sắp diễn ra</SelectItem>
              <SelectItem value="ONGOING">Đang diễn ra</SelectItem>
              <SelectItem value="COMPLETED">Đã kết thúc</SelectItem>
              <SelectItem value="CANCELLED">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Tìm thấy {totalTournaments} giải đấu
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : tournaments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <p className="text-gray-500 text-lg">Không tìm thấy giải đấu nào</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => (
              <div key={tournament.tournamentID} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                {tournament.image && (
                  <img 
                    src={tournament.image} 
                    alt={tournament.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{tournament.name}</h3>
                  <p className="text-gray-600 mb-2">
                    Ngày: {format(new Date(tournament.start_day), "dd/MM/yyyy")}
                  </p>
                  <p className="text-gray-600 mb-2">Số đội: {tournament.max_teams}</p>
                  {tournament.description && (
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">{tournament.description}</p>
                  )}
                  <div className="mb-4">
                    {getStatusBadge(tournament.status)}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => openEditDialog(tournament)}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Sửa
                    </button>
                    <button 
                      onClick={() => handleDelete(tournament.tournamentID, tournament.name)}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo Giải Đấu Mới</DialogTitle>
            <DialogDescription>
              Nhập thông tin để tạo giải đấu mới
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Tên giải đấu *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="VD: Giải Mùa Thu 2025"
              />
            </div>

            <div>
              <Label htmlFor="phone_user">Số điện thoại người tạo</Label>
              <Input
                id="phone_user"
                value={form.phone_user}
                onChange={(e) => setForm({ ...form, phone_user: e.target.value })}
                placeholder="VD: 0912345678 hoặc +84912345678"
              />
              <p className="text-xs text-gray-500 mt-1">
                Số điện thoại Việt Nam (bắt đầu bằng 0 hoặc +84, theo sau là 9-10 số)
              </p>
            </div>

            <div>
              <Label htmlFor="start_day">Ngày diễn ra *</Label>
              <Input
                id="start_day"
                type="date"
                value={form.start_day}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setForm({ ...form, start_day: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="max_teams">Số đội tối đa *</Label>
              <Input
                id="max_teams"
                type="number"
                min="2"
                value={form.max_teams}
                onChange={(e) => setForm({ ...form, max_teams: e.target.value })}
                placeholder="VD: 16"
              />
            </div>

            <div>
              <Label htmlFor="status">Trạng thái *</Label>
              <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPCOMING">Sắp diễn ra</SelectItem>
                  <SelectItem value="ONGOING">Đang diễn ra</SelectItem>
                  <SelectItem value="COMPLETED">Đã kết thúc</SelectItem>
                  <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Mô tả về giải đấu..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="image">Link hình ảnh</Label>
              <Input
                id="image"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreate} className="bg-green-600 hover:bg-green-700">
              Tạo giải đấu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh Sửa Giải Đấu</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin giải đấu
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Tên giải đấu *</Label>
              <Input
                id="edit-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="VD: Giải Mùa Thu 2025"
              />
            </div>

            <div>
              <Label htmlFor="edit-start_day">Ngày diễn ra *</Label>
              <Input
                id="edit-start_day"
                type="date"
                value={form.start_day}
                onChange={(e) => setForm({ ...form, start_day: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-max_teams">Số đội tối đa *</Label>
              <Input
                id="edit-max_teams"
                type="number"
                min="2"
                value={form.max_teams}
                onChange={(e) => setForm({ ...form, max_teams: e.target.value })}
                placeholder="VD: 16"
              />
            </div>

            <div>
              <Label htmlFor="edit-status">Trạng thái *</Label>
              <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPCOMING">Sắp diễn ra</SelectItem>
                  <SelectItem value="ONGOING">Đang diễn ra</SelectItem>
                  <SelectItem value="COMPLETED">Đã kết thúc</SelectItem>
                  <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-description">Mô tả</Label>
              <Textarea
                id="edit-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Mô tả về giải đấu..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="edit-image">Link hình ảnh</Label>
              <Input
                id="edit-image"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleEdit} className="bg-blue-600 hover:bg-blue-700">
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}