/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { Star, Filter, MapPin, User, Calendar, MessageSquare, Trash2, Search, Eye, X } from "lucide-react";
import { format } from "date-fns";
import { API_URL } from "@/lib/config";

interface User {
  userID: string;
  full_name: string;
}

interface Court {
  courtID: string;
  name: string;
  type: string;
}

interface Feedback {
  feedbackID: string;
  user_id: string;
  court_id: string;
  rating: number;
  comment: string | null;
  is_anonymous: boolean;
  createdAt: string;
  updatedAt: string;
  user: User | null;
  court: Court;
}

export default function AdminFeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [courts, setCourts] = useState<Court[]>([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [feedbacks, selectedRating, selectedCourt, searchTerm]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/feedbacks`);
      if (response.ok) {
        const data: Feedback[] = await response.json();
        setFeedbacks(data);
        
        const uniqueCourts = Array.from(
          new Map(data.map(f => [f.court.courtID, f.court])).values()
        );
        setCourts(uniqueCourts);
      } else {
        console.error("Failed to fetch feedbacks");
      }
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...feedbacks];

    if (selectedRating !== null) {
      filtered = filtered.filter(f => f.rating === selectedRating);
    }

    if (selectedCourt) {
      filtered = filtered.filter(f => f.court.courtID === selectedCourt);
    }

    if (searchTerm) {
      filtered = filtered.filter(f => {
        const courtName = f.court.name.toLowerCase();
        const userName = f.user?.full_name.toLowerCase() || "";
        const comment = f.comment?.toLowerCase() || "";
        const search = searchTerm.toLowerCase();
        
        return courtName.includes(search) || userName.includes(search) || comment.includes(search);
      });
    }

    setFilteredFeedbacks(filtered);
    setCurrentPage(1);
  };

  const handleDeleteFeedback = async (feedbackID: string) => {
    if (!confirm("Bạn có chắc muốn xóa đánh giá này không?")) return;

    try {
      const response = await fetch(`${API_URL}/api/feedbacks/${feedbackID}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Xóa đánh giá thành công!");
        fetchFeedbacks();
      } else {
        const error = await response.json();
        alert(error.message || "Xóa đánh giá thất bại");
      }
    } catch (error) {
      console.error("Error deleting feedback:", error);
      alert("Có lỗi xảy ra khi xóa đánh giá");
    }
  };

  const handleViewDetail = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setShowDetailModal(true);
  };

  const calculateStats = () => {
    const totalReviews = feedbacks.length;
    const avgRating = totalReviews > 0
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalReviews
      : 0;

    const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: feedbacks.filter(f => f.rating === rating).length
    }));

    return { totalReviews, avgRating, ratingDistribution };
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const stats = calculateStats();

  const totalPages = Math.ceil(filteredFeedbacks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFeedbacks = filteredFeedbacks.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Quản Lý Đánh Giá</h1>
        <p className="text-gray-600">Xem và quản lý tất cả đánh giá từ khách hàng</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className="w-8 h-8 opacity-80" />
            <div className="text-right">
              <p className="text-3xl font-bold">{stats.totalReviews}</p>
              <p className="text-sm opacity-90">Tổng đánh giá</p>
            </div>
          </div>
        </div>

        <div className="bg-linear-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Star className="w-8 h-8 opacity-80 fill-white" />
            <div className="text-right">
              <p className="text-3xl font-bold">{stats.avgRating.toFixed(1)}</p>
              <p className="text-sm opacity-90">Điểm TB</p>
            </div>
          </div>
        </div>

        <div className="bg-linear-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <MapPin className="w-8 h-8 opacity-80" />
            <div className="text-right">
              <p className="text-3xl font-bold">{courts.length}</p>
              <p className="text-sm opacity-90">Sân được đánh giá</p>
            </div>
          </div>
        </div>

        <div className="bg-linear-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Star className="w-8 h-8 opacity-80 fill-white" />
            <div className="text-right">
              <p className="text-3xl font-bold">
                {stats.ratingDistribution.find(r => r.rating === 5)?.count || 0}
              </p>
              <p className="text-sm opacity-90">Đánh giá 5⭐</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-lg font-bold mb-4 text-gray-800">Phân bố đánh giá</h3>
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((rating) => {
            const data = stats.ratingDistribution.find(r => r.rating === rating);
            const count = data?.count || 0;
            const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
            
            return (
              <div key={rating} className="flex items-center gap-4">
                <div className="flex items-center gap-1 w-20">
                  <span className="font-medium">{rating}</span>
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-yellow-400 h-full transition-all duration-300 flex items-center justify-end px-2"
                    style={{ width: `${percentage}%` }}
                  >
                    {percentage > 10 && (
                      <span className="text-xs font-medium text-gray-800">{count}</span>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-600 w-20 text-right">
                  {count} ({percentage.toFixed(0)}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-bold text-lg text-gray-800">Bộ lọc & Tìm kiếm</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tìm kiếm
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên sân, người dùng, nội dung..."
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lọc theo số sao
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedRating(null)}
                className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                  selectedRating === null
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Tất cả
              </button>
              {[5, 4, 3, 2, 1].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setSelectedRating(rating)}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-1 text-sm ${
                    selectedRating === rating
                      ? "bg-yellow-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {rating}
                  <Star className="w-3 h-3 fill-current" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lọc theo sân
            </label>
            <select
              value={selectedCourt}
              onChange={(e) => setSelectedCourt(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">Tất cả sân</option>
              {courts.map((court) => (
                <option key={court.courtID} value={court.courtID}>
                  {court.name} ({court.type === "INDOOR" ? "Trong nhà" : "Ngoài trời"})
                </option>
              ))}
            </select>
          </div>
        </div>

        {(selectedRating !== null || selectedCourt || searchTerm) && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Hiển thị <span className="font-bold text-blue-600">{filteredFeedbacks.length}</span> / {feedbacks.length} đánh giá
            </p>
            <button
              onClick={() => {
                setSelectedRating(null);
                setSelectedCourt("");
                setSearchTerm("");
              }}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      {currentFeedbacks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {searchTerm || selectedRating !== null || selectedCourt
              ? "Không tìm thấy đánh giá phù hợp"
              : "Chưa có đánh giá nào"}
          </h3>
          <p className="text-gray-600">
            {searchTerm || selectedRating !== null || selectedCourt
              ? "Hãy thử thay đổi bộ lọc để xem kết quả khác"
              : "Đánh giá từ khách hàng sẽ hiển thị tại đây"}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Sân
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Người đánh giá
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Đánh giá
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Nội dung
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentFeedbacks.map((feedback) => (
                    <tr key={feedback.feedbackID} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <div>
                            <div className="font-medium text-gray-900">{feedback.court.name}</div>
                            <div className="text-xs text-gray-500">
                              {feedback.court.type === "INDOOR" ? "🏠 Trong nhà" : "🌤️ Ngoài trời"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {feedback.is_anonymous ? (
                            <>
                              <User className="w-4 h-4 text-purple-600" />
                              <div>
                                <div className="text-sm text-gray-900">Ẩn danh</div>
                                <div className="text-xs text-purple-600">👤 Anonymous</div>
                              </div>
                            </>
                          ) : (
                            <>
                              <User className="w-4 h-4 text-gray-600" />
                              <div className="text-sm text-gray-900">
                                {feedback.user?.full_name || "N/A"}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {renderStars(feedback.rating)}
                          <span className="text-sm font-bold text-yellow-600">
                            {feedback.rating}/5
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          {feedback.comment ? (
                            <p className="text-sm text-gray-700 line-clamp-2">
                              {feedback.comment}
                            </p>
                          ) : (
                            <span className="text-sm text-gray-400 italic">Không có nhận xét</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(feedback.createdAt), "dd/MM/yyyy HH:mm")}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewDetail(feedback)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                            Chi tiết
                          </button>
                          {/* <button
                            onClick={() => handleDeleteFeedback(feedback.feedbackID)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                            title="Xóa đánh giá"
                          >
                            <Trash2 className="w-4 h-4" />
                            Xóa
                          </button> */}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:bg-transparent transition-all font-medium"
                >
                  ← Trước
                </button>

                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`w-10 h-10 rounded-lg border-2 transition-all font-medium ${
                            currentPage === page
                              ? "border-blue-500 bg-blue-500 text-white"
                              : "border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <span key={page} className="w-10 h-10 flex items-center justify-center text-gray-400">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:bg-transparent transition-all font-medium"
                >
                  Sau →
                </button>
              </div>

              <div className="text-gray-600 text-sm">
                Trang {currentPage} / {totalPages} - Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredFeedbacks.length)} / {filteredFeedbacks.length} đánh giá
              </div>
            </div>
          )}
        </>
      )}

      {showDetailModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-linear-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-6 h-6" />
                <h2 className="text-2xl font-bold">Chi tiết đánh giá</h2>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedFeedback(null);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-xl p-5 border-l-4 border-blue-600">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-blue-700" />
                  <h3 className="font-bold text-lg text-blue-900">Thông tin sân</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-blue-700 mb-1">Tên sân</p>
                    <p className="font-semibold text-blue-900 text-lg">{selectedFeedback.court.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 mb-1">Loại sân</p>
                    <p className="font-semibold text-blue-900">
                      {selectedFeedback.court.type === "INDOOR" ? "🏠 Trong nhà" : "🌤️ Ngoài trời"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-linear-to-br from-purple-50 to-purple-100 rounded-xl p-5 border-l-4 border-purple-600">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-5 h-5 text-purple-700" />
                  <h3 className="font-bold text-lg text-purple-900">Người đánh giá</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-purple-700 mb-1">Tên người dùng</p>
                    {selectedFeedback.is_anonymous ? (
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-sm font-medium">
                          👤 Ẩn danh
                        </span>
                      </div>
                    ) : (
                      <p className="font-semibold text-purple-900">
                        {selectedFeedback.user?.full_name || "N/A"}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-purple-700 mb-1">Trạng thái</p>
                    <p className="font-semibold text-purple-900">
                      {selectedFeedback.is_anonymous ? "Ẩn danh" : "Công khai"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-linear-to-br from-yellow-50 to-yellow-100 rounded-xl p-5 border-l-4 border-yellow-600">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-5 h-5 text-yellow-700 fill-yellow-700" />
                  <h3 className="font-bold text-lg text-yellow-900">Đánh giá</h3>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-8 h-8 ${
                          star <= selectedFeedback.rating
                            ? "fill-yellow-500 text-yellow-500"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-4xl font-bold text-yellow-700">
                    {selectedFeedback.rating}/5
                  </span>
                </div>
                <p className="text-sm text-yellow-700 mt-2">
                  {selectedFeedback.rating === 5 && "⭐ Tuyệt vời!"}
                  {selectedFeedback.rating === 4 && "👍 Rất tốt"}
                  {selectedFeedback.rating === 3 && "😊 Tốt"}
                  {selectedFeedback.rating === 2 && "😐 Bình thường"}
                  {selectedFeedback.rating === 1 && "😞 Cần cải thiện"}
                </p>
              </div>

              <div className="bg-linear-to-br from-green-50 to-green-100 rounded-xl p-5 border-l-4 border-green-600">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-5 h-5 text-green-700" />
                  <h3 className="font-bold text-lg text-green-900">Nội dung đánh giá</h3>
                </div>
                {selectedFeedback.comment ? (
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {selectedFeedback.comment}
                    </p>
                  </div>
                ) : (
                  <p className="text-green-700 italic">Không có nhận xét chi tiết</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl p-5 border-l-4 border-gray-400">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-gray-700" />
                  <h3 className="font-bold text-lg text-gray-900">Thông tin thời gian</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Ngày tạo</p>
                    <p className="font-semibold text-gray-900">
                      {format(new Date(selectedFeedback.createdAt), "dd/MM/yyyy HH:mm:ss")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Cập nhật lần cuối</p>
                    <p className="font-semibold text-gray-900">
                      {format(new Date(selectedFeedback.updatedAt), "dd/MM/yyyy HH:mm:ss")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 p-4 rounded-b-xl border-t border-gray-200 flex justify-end gap-3">
              {/* <button
                onClick={() => {
                  setShowDetailModal(false);
                  handleDeleteFeedback(selectedFeedback.feedbackID);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Xóa đánh giá
              </button> */}
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedFeedback(null);
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
