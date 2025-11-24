/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Plus, Trophy, Calendar, Users, Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";
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
  user_id: string;
  createdAt: string;
  updatedAt: string;
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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
    status: "UPCOMING",
    user_id: "",
  });


  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); 
    }, 1000); 

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    async function fetchTournaments() {
      try {
        setLoading(true);

        const params = new URLSearchParams({
          page: currentPage.toString(),
        });

        if (statusFilter !== "all") {
          params.append("status", statusFilter);
        }

        if (debouncedSearch) {
          params.append("search", debouncedSearch);
        }

        const response = await fetch(`${API_URL}/api/tournaments?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setTournaments(data.tournaments);
          setTotalPages(data.totalPages);
          setCurrentPage(data.currentPage);
          setTotalTournaments(data.totalTournaments);
        }
      } catch (error) {
        console.error("Error fetching tournaments:", error);
        toast.error("Không thể tải danh sách giải đấu");
      } finally {
        setLoading(false);
      }
    }

    fetchTournaments();
   
  }, [currentPage, statusFilter, debouncedSearch]);



  async function handleCreate() {

    if (!form.name || !form.start_day || !form.max_teams) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    if (parseInt(form.max_teams) < 2) {
      toast.error("Số đội tối thiểu là 2");
      return;
    }

    const userLS = localStorage.getItem("user");
    if (!userLS) {
      toast.error("Vui lòng đăng nhập để tạo giải đấu");
      return;
    }

    const userData = JSON.parse(userLS);
    console.log("User data from localStorage:", userData);
    console.log("User ID for tournament creation:", userData.userID);

    try {
      const payload = {
        name: form.name,
        start_day: new Date(form.start_day).toISOString(),
        max_teams: parseInt(form.max_teams),
        description: form.description || null,
        status: form.status,
        user_id: userData.userID,
        image: form.image || null,
      };

      const response = await fetch(`${API_URL}/api/tournaments/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Created tournament:", data);
        toast.success("Tạo giải đấu thành công!");
        setIsCreateOpen(false);
        setForm({ name: "", start_day: "", max_teams: "", description: "", image: "", status: "UPCOMING", user_id: "" });
        setCurrentPage(1);
      } else {
        const error = await response.json();
        console.error("Error response:", error);
        toast.error(error.error || "Không thể tạo giải đấu");
      }
    } catch (error) {
      console.error("Error creating tournament:", error);
      toast.error("Lỗi khi tạo giải đấu - Kiểm tra console để xem chi tiết");
    }
  }


  const filteredTournaments = tournaments;

  function getStatusBadge(status: string) {
    const config = {
      UPCOMING: { bg: "bg-blue-100", text: "text-blue-800", label: "Sắp diễn ra" },
      ONGOING: { bg: "bg-green-100", text: "text-green-800", label: "Đang diễn ra" },
      COMPLETED: { bg: "bg-gray-100", text: "text-gray-800", label: "Đã kết thúc" },
      CANCELLED: { bg: "bg-red-100", text: "text-red-800", label: "Đã hủy" },
    }[status] || { bg: "bg-gray-100", text: "text-gray-800", label: status };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">Các Giải Đấu Pickleball</h1>
        <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-5 h-5" />
          Tạo Giải Đấu
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Tìm kiếm giải đấu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 max-w-2xl"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Lọc theo trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="UPCOMING">Sắp diễn ra</SelectItem>
            <SelectItem value="ONGOING">Đang diễn ra</SelectItem>
            <SelectItem value="COMPLETED">Đã kết thúc</SelectItem>
            <SelectItem value="CANCELLED">Đã hủy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredTournaments.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Không tìm thấy giải đấu nào</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTournaments.map((tournament) => (
            <div
              key={tournament.tournamentID}
              className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="relative">
                {tournament.image ? (
                  <img
                    src={tournament.image}
                    alt={tournament.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                   <img
                    src="images/anh_bia_giai_dau.jpg"
                    alt={tournament.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="absolute top-3 right-3">
                  {getStatusBadge(tournament.status)}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2 text-gray-800 group-hover:text-emerald-600 transition line-clamp-1">
                  {tournament.name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(tournament.start_day), "dd/MM/yyyy")}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  Tối đa {tournament.max_teams} đội
                </div>
                {tournament.description && (
                  <p className="text-sm text-gray-500 mt-3 line-clamp-2">{tournament.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Trước
          </Button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                onClick={() => setCurrentPage(page)}
                className={currentPage === page ? "bg-emerald-600 hover:bg-emerald-700" : ""}
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="flex items-center gap-2"
          >
            Sau
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {totalTournaments > 0 && (
        <div className="text-center mt-4 text-sm text-gray-600">
          Hiển thị trang {currentPage} / {totalPages} (Tổng {totalTournaments} giải đấu)
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Tạo Giải Đấu Mới
            </DialogTitle>
            <DialogDescription>
              Điền thông tin để tạo giải đấu Pickleball mới
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Tên giải đấu *</Label>
              <Input
                placeholder="VD: Giải Pickleball Mùa Thu 2025"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <Label>Ngày diễn ra *</Label>
              <Input
                type="date"
                value={form.start_day}
                onChange={(e) => setForm({ ...form, start_day: e.target.value })}
                min={format(new Date(), "yyyy-MM-dd")}
              />
            </div>

            <div>
              <Label>Số đội tham gia tối đa *</Label>
              <Input
                type="number"
                placeholder="16"
                value={form.max_teams}
                onChange={(e) => setForm({ ...form, max_teams: e.target.value })}
                min="2"
              />
            </div>

            <div>
              <Label>Trạng thái *</Label>
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
              <Label>Mô tả</Label>
              <Textarea
                placeholder="Thông tin giải thưởng, thể lệ..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label>URL ảnh bìa</Label>
              <Input
                placeholder="https://example.com/image.jpg"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700">
              Tạo Giải Đấu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

