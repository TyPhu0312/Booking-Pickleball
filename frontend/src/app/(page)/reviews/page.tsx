/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { Star, Filter, MapPin, Calendar, MessageSquare, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import { API_URL } from "@/lib/config";

interface Court {
  courtID: string;
  name: string;
  type: string;
}

interface Feedback {
  feedbackID: string;
  rating: number;
  comment: string | null;
  is_anonymous: boolean;
  createdAt: string;
  court: Court;
}

interface FeedbacksData {
  feedbacks: Feedback[];
  totalFeedbacks: number;
  averageRating: number;
}

export default function ReviewsPage() {
  const [user, setUser] = useState<{ userID: string; full_name: string } | null>(null);
  const [feedbacksData, setFeedbacksData] = useState<FeedbacksData | null>(null);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<string | null>(null);
  const [courts, setCourts] = useState<Court[]>([]);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null);
  const [editForm, setEditForm] = useState({
    rating: 5,
    comment: "",
    is_anonymous: false
  });

  useEffect(() => {
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (user?.userID) {
      fetchFeedbacks();
    }
  }, [user?.userID]);

  useEffect(() => {
    if (feedbacksData) {
      applyFilters();
    }
  }, [feedbacksData, selectedRating, selectedCourt]);

  const fetchFeedbacks = async () => {
    if (!user?.userID) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/feedbacks/user/${user.userID}`);
      if (response.ok) {
        const data: FeedbacksData = await response.json();
        setFeedbacksData(data);
        
        const uniqueCourts = Array.from(
          new Map(data.feedbacks.map(f => [f.court.courtID, f.court])).values()
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
    if (!feedbacksData) return;

    let filtered = [...feedbacksData.feedbacks];

    if (selectedRating !== null) {
      filtered = filtered.filter(f => f.rating === selectedRating);
    }

    if (selectedCourt) {
      filtered = filtered.filter(f => f.court.courtID === selectedCourt);
    }

    setFilteredFeedbacks(filtered);
  };

  const handleDeleteReview = async (feedbackID: string) => {
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

  const handleOpenEdit = (feedback: Feedback) => {
    setEditingFeedback(feedback);
    setEditForm({
      rating: feedback.rating,
      comment: feedback.comment || "",
      is_anonymous: feedback.is_anonymous
    });
    setShowEditModal(true);
  };

  const handleSubmitEdit = async () => {
    if (!editingFeedback || !user?.userID) return;

    if (!editForm.comment.trim()) {
      alert("Vui lòng nhập nhận xét!");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/feedbacks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.userID,
          court_id: editingFeedback.court.courtID,
          rating: editForm.rating,
          comment: editForm.comment,
          is_anonymous: editForm.is_anonymous
        }),
      });

      if (response.ok) {
        alert("Cập nhật đánh giá thành công!");
        setShowEditModal(false);
        setEditingFeedback(null);
        setEditForm({
          rating: 5,
          comment: "",
          is_anonymous: false
        });
        fetchFeedbacks();
      } else {
        const error = await response.json();
        alert(error.message || "Cập nhật đánh giá thất bại");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật đánh giá:", error);
      alert("Có lỗi xảy ra khi cập nhật đánh giá");
    }
  };

  const renderStars = (rating: number, size: "sm" | "lg" = "sm") => {
    const sizeClass = size === "lg" ? "w-6 h-6" : "w-4 h-4";
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-gray-600">Vui lòng đăng nhập để xem đánh giá của bạn</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Đánh Giá Của Tôi</h1>
        <p className="text-gray-600">Quản lý tất cả đánh giá bạn đã đăng</p>
      </div>

      {feedbacksData && feedbacksData.totalFeedbacks > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium mb-1">Tổng đánh giá</p>
                <p className="text-3xl font-bold text-blue-900">{feedbacksData.totalFeedbacks}</p>
              </div>
              <MessageSquare className="w-12 h-12 text-blue-400" />
            </div>
          </div>

          <div className="bg-linear-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium mb-1">Đánh giá trung bình</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold text-yellow-900">{feedbacksData.averageRating}</p>
                  <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                </div>
              </div>
              {renderStars(Math.round(feedbacksData.averageRating), "lg")}
            </div>
          </div>

          <div className="bg-linear-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium mb-1">Sân đã đánh giá</p>
                <p className="text-3xl font-bold text-green-900">{courts.length}</p>
              </div>
              <MapPin className="w-12 h-12 text-green-400" />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-bold text-lg text-gray-800">Bộ lọc</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lọc theo số sao
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedRating(null)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    selectedRating === rating
                      ? "bg-yellow-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {rating}
                  <Star className="w-4 h-4 fill-current" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lọc theo sân
            </label>
            <select
              value={selectedCourt || ""}
              onChange={(e) => setSelectedCourt(e.target.value || null)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
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

        {(selectedRating !== null || selectedCourt) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Hiển thị <span className="font-bold text-blue-600">{filteredFeedbacks.length}</span> / {feedbacksData?.totalFeedbacks} đánh giá
            </p>
          </div>
        )}
      </div>

      {filteredFeedbacks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {selectedRating !== null || selectedCourt
              ? "Không tìm thấy đánh giá phù hợp"
              : "Chưa có đánh giá nào"}
          </h3>
          <p className="text-gray-600">
            {selectedRating !== null || selectedCourt
              ? "Hãy thử thay đổi bộ lọc để xem kết quả khác"
              : "Hãy đặt sân và trải nghiệm để có thể đánh giá nhé!"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFeedbacks.map((feedback) => (
            <div
              key={feedback.feedbackID}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-800">{feedback.court.name}</h3>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      {feedback.court.type === "INDOOR" ? "🏠 Trong nhà" : "🌤️ Ngoài trời"}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-3">
                    {renderStars(feedback.rating, "lg")}
                    <span className="text-2xl font-bold text-yellow-600">{feedback.rating}/5</span>
                  </div>

                  {feedback.comment && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-3">
                      <p className="text-gray-700 leading-relaxed">{feedback.comment}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(feedback.createdAt), "dd/MM/yyyy HH:mm")}</span>
                    </div>
                    {feedback.is_anonymous && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                        👤 Ẩn danh
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEdit(feedback)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Sửa đánh giá"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteReview(feedback.feedbackID)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Xóa đánh giá"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showEditModal && editingFeedback && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto my-8">
            <button
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
              onClick={() => {
                setShowEditModal(false);
                setEditingFeedback(null);
                setEditForm({
                  rating: 5,
                  comment: "",
                  is_anonymous: false
                });
              }}
            >
              ✕
            </button>

            <h2 className="text-xl font-bold text-gray-800 mb-4">Sửa đánh giá</h2>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">{editingFeedback.court.name}</h3>
                <p className="text-sm text-blue-700">
                  Loại sân: {editingFeedback.court.type === "INDOOR" ? "Trong nhà" : "Ngoài trời"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Đánh giá <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, rating: star })}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-10 h-10 ${
                          star <= editForm.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {editForm.rating === 5 && "Tuyệt vời!"}
                  {editForm.rating === 4 && "Rất tốt"}
                  {editForm.rating === 3 && "Tốt"}
                  {editForm.rating === 2 && "Bình thường"}
                  {editForm.rating === 1 && "Cần cải thiện"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nhận xét <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={editForm.comment}
                  onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Chia sẻ trải nghiệm của bạn về sân này..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-anonymous"
                  checked={editForm.is_anonymous}
                  onChange={(e) => setEditForm({ ...editForm, is_anonymous: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="edit-anonymous" className="text-sm text-gray-700">
                  Đánh giá ẩn danh
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSubmitEdit}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Cập nhật đánh giá
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingFeedback(null);
                    setEditForm({
                      rating: 5,
                      comment: "",
                      is_anonymous: false
                    });
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
