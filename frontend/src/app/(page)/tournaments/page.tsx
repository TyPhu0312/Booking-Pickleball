"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { mockTournaments } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Plus, Trophy, Calendar, Users, Upload } from "lucide-react";
import { toast } from "sonner";

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState(mockTournaments);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    date: "",
    teams: "",
    description: "",
    image: "",
  });

  function handleCreate() {
    if (!form.name || !form.date || !form.teams) {
      toast("Lỗi", {  description: "Vui lòng điền đầy đủ thông tin",
      action: {
        label: "Yes",
        onClick: () => console.log("Yes"),
      }, });
      return;
    }

    const newTournament = {
      id: tournaments.length + 1,
      name: form.name,
      date: format(new Date(form.date), "dd/MM/yyyy"),
      teams: Number(form.teams),
      description: form.description,
      image: form.image || "/placeholder-tournament.jpg",
    };

    setTournaments([newTournament, ...tournaments]);
    setIsCreateOpen(false);
    setForm({ name: "", date: "", teams: "", description: "", image: "" });
    toast( "Thành công",{ description: "Tạo giải đấu thành công!" });
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Các Giải Đấu Pickleball</h1>
        <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Tạo Giải Đấu
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map((tournament) => (
          <Link
            key={tournament.id}
            href={`/tournaments/${tournament.id}`}
            className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="relative">
              <div className="bg-linear-to-br from-blue-600 to-pink-600 h-48 flex items-center justify-center">
                <Trophy className="w-16 h-16 text-white opacity-30" />
              </div>
              <img
                src="./images/logo.png"
                alt={tournament.name}
                className="absolute top-0 left-0 w-full h-48 object-cover object-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2 text-gray-800 group-hover:text-blue-600 transition">
                {tournament.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Calendar className="w-4 h-4" />
                {tournament.date}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                {tournament.teams} đội tham gia
              </div>
              {tournament.description && (
                <p className="text-sm text-gray-500 mt-3 line-clamp-2">{tournament.description}</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Tạo Giải Đấu Mới
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Tên giải đấu</Label>
              <Input
                placeholder="VD: Giải Pickleball Mùa Thu 2025"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <Label>Ngày diễn ra</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                min={format(new Date(), "yyyy-MM-dd")}
              />
            </div>

            <div>
              <Label>Số đội tham gia (tối đa)</Label>
              <Input
                type="number"
                placeholder="16"
                value={form.teams}
                onChange={(e) => setForm({ ...form, teams: e.target.value })}
                min="4"
                max="32"
              />
            </div>

            <div>
              <Label>Mô tả (tùy chọn)</Label>
              <Textarea
                placeholder="Thông tin giải thưởng, thể lệ..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label>Ảnh bìa (URL - tùy chọn)</Label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                />
                <Button variant="outline" size="icon">
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreate}>Tạo Giải Đấu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}