/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
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
  comment: string;
  is_anonymous: boolean;
  createdAt: string;
  updatedAt: string;
  user: User | null;
  court: Court;
}

export default function Reviews() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<Feedback[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/feedbacks/`);
        if (response.ok) {
          const data = await response.json();
          setFeedbacks(data);
          setFilteredFeedbacks(data);

          const uniqueCourts = Array.from(
            new Map(data.map((f: Feedback) => [f.court.courtID, f.court])).values()
          ) as Court[];
          setCourts(uniqueCourts);
        }
      } catch (error) {
        console.error("Error fetching feedbacks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, []);

  useEffect(() => {
    let filtered = [...feedbacks];

    if (selectedRating !== null) {
      filtered = filtered.filter((f) => f.rating === selectedRating);
    }

    if (selectedCourt) {
      filtered = filtered.filter((f) => f.court.courtID === selectedCourt);
    }

    setFilteredFeedbacks(filtered);
    setCurrentPage(1); 
  }, [selectedRating, selectedCourt, feedbacks]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const calculateStats = () => {
    const totalReviews = feedbacks.length;
    const avgRating =
      totalReviews > 0
        ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalReviews
        : 0;

    const ratingCounts = [1, 2, 3, 4, 5].map(
      (rating) => feedbacks.filter((f) => f.rating === rating).length
    );

    return { totalReviews, avgRating, ratingCounts };
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
      <div className="py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Đánh Giá Của Khách Hàng
          </h2>
          <p className="text-xl text-gray-600">
            Xem những đánh giá chân thực từ người chơi
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {stats.totalReviews}
            </div>
            <div className="text-gray-600">Tổng đánh giá</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-4xl font-bold text-yellow-500">
                {stats.avgRating.toFixed(1)}
              </span>
              <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
            </div>
            <div className="text-gray-600">Điểm trung bình</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {courts.length}
            </div>
            <div className="text-gray-600">Sân được đánh giá</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4">Phân bố đánh giá</h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating, index) => {
              const count = stats.ratingCounts[rating - 1];
              const percentage =
                stats.totalReviews > 0
                  ? (count / stats.totalReviews) * 100
                  : 0;
              return (
                <div key={rating} className="flex items-center gap-4">
                  <div className="flex items-center gap-1 w-24">
                    <span className="font-medium">{rating}</span>
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-yellow-400 h-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-16 text-right">
                    {count} ({percentage.toFixed(0)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4">Lọc đánh giá</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Theo số sao
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedRating(null)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    selectedRating === null
                      ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  Tất cả
                </button>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setSelectedRating(rating)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all flex items-center gap-2 ${
                      selectedRating === rating
                        ? "border-yellow-500 bg-yellow-50 text-yellow-700 font-semibold"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <span>{rating}</span>
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Theo sân
              </label>
              <select
                value={selectedCourt}
                onChange={(e) => setSelectedCourt(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">Tất cả các sân</option>
                {courts.map((court) => (
                  <option key={court.courtID} value={court.courtID}>
                    {court.name} ({court.type === "INDOOR" ? "Sân trong nhà" : "Sân ngoài trời"})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredFeedbacks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <div className="text-gray-400 mb-4">
              <Star className="w-16 h-16 mx-auto" />
            </div>
            <p className="text-xl text-gray-600">
              {feedbacks.length === 0
                ? "Chưa có đánh giá nào"
                : "Không tìm thấy đánh giá phù hợp"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentFeedbacks.map((feedback) => (
                <div
                  key={feedback.feedbackID}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <h4 className="font-semibold text-lg text-gray-900">
                      {feedback.court.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      Loại sân: {feedback.court.type === "INDOOR" ? "Sân trong nhà" : "Sân ngoài trời"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                      {feedback.is_anonymous
                        ? "?"
                        : feedback.user?.full_name.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {feedback.is_anonymous
                          ? "Người dùng ẩn danh"
                          : feedback.user?.full_name || "Người dùng"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(feedback.createdAt).toLocaleDateString("vi-VN")}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">{renderStars(feedback.rating)}</div>

                  {feedback.comment && (
                    <div className="text-gray-700 leading-relaxed">
                      <p className="line-clamp-4">{feedback.comment}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex flex-col items-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:bg-transparent transition-all"
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
                            className={`w-10 h-10 rounded-lg border-2 transition-all ${
                              currentPage === page
                                ? "border-blue-500 bg-blue-500 text-white font-semibold"
                                : "border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return (
                          <span key={page} className="w-10 h-10 flex items-center justify-center">
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
                    className="px-4 py-2 rounded-lg border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:bg-transparent transition-all"
                  >
                    Sau →
                  </button>
                </div>

                <div className="text-gray-600">
                  Trang {currentPage} / {totalPages} - Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredFeedbacks.length)} / {filteredFeedbacks.length} đánh giá
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
