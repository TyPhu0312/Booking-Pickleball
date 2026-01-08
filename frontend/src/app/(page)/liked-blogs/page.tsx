/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Heart, MessageCircle, Calendar, User, Search, Eye, Share2, X } from "lucide-react";
import { API_URL } from '@/lib/config';
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Blog {
  blogID: string;
  title: string;
  content: string;
  author: string;
  user_id?: string;
  image?: string;
  video_url?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    likes: number;
    comments: number;
  };
  likes?: BlogLike[];
}

interface BlogLike {
  likeID: string;
  user_id: string;
}

export default function LikedBlogsPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<{ userID: string; full_name: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailBlog, setDetailBlog] = useState<Blog | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser({ userID: user.userID, full_name: user.full_name });
    } else {
      toast.error("Vui lòng đăng nhập để xem bài viết đã thích");
      router.push('/login');
    }
  }, [router]);

  const fetchLikedBlogs = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/blogs?includeStats=true`);
      if (res.ok) {
        const data = await res.json();
        const likedBlogs = data.filter((blog: Blog) => 
          blog.likes?.some(like => like.user_id === currentUser.userID)
        );
        setBlogs(likedBlogs);
      }
    } catch (error) {
      console.error("Error fetching liked blogs:", error);
      toast.error("Không thể tải danh sách bài viết đã thích");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchLikedBlogs();
    }
  }, [currentUser, fetchLikedBlogs]);

  const handleUnlike = async (blogID: string) => {
    if (!currentUser) {
      toast.error("Vui lòng đăng nhập");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/blogs/${blogID}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: currentUser.userID }),
      });

      if (res.ok) {
        toast.success("Đã bỏ thích bài viết");
        fetchLikedBlogs();
      } else {
        const error = await res.json();
        toast.error(error.error || "Không thể bỏ thích bài viết");
      }
    } catch (error) {
      console.error("Error unliking blog:", error);
      toast.error("Không thể bỏ thích bài viết");
    }
  };

  const handleShare = async (blog: Blog) => {
    const url = `${window.location.origin}/blogs#${blog.blogID}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Đã sao chép link bài viết!");
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("Không thể sao chép link");
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy");
  };

  const getContentPreview = (content: string, maxLength: number = 150) => {
    const plainText = content.replace(/<[^>]*>/g, '');
    if (plainText.length <= maxLength) return plainText;
    const truncated = plainText.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...';
  };

  const filteredBlogs = blogs.filter((blog) => {
    const keyword = searchQuery.toLowerCase();
    return (
      blog.title.toLowerCase().includes(keyword) ||
      blog.author.toLowerCase().includes(keyword) ||
      blog.content.toLowerCase().includes(keyword)
    );
  });

  const totalPages = Math.ceil(filteredBlogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBlogs = filteredBlogs.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewBlog = (blog: Blog) => {
    setDetailBlog(blog);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải bài viết đã thích...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50">
      <div className="bg-linear-to-r bg-white-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center text-black">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Bài Viết Đã Thích
            </h1>
          </div>
          
          <div className="max-w-xl mx-auto mt-10">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm bài viết đã thích..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-full border-0 shadow-lg focus:ring-2 focus:ring-purple-300 outline-none text-gray-700"
              />
            </div>
          </div>
        </div>
      </div>

      <section className="py-4">
        <div className="container mx-auto px-4">
          {filteredBlogs.length === 0 && blogs.length === 0 ? (
            <div className="max-w-3xl mx-auto text-center py-20">
              <div className="bg-white rounded-2xl shadow-lg p-12">
                <Heart className="w-24 h-24 mx-auto text-gray-300 mb-4" />
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Chưa có bài viết nào</h3>
                <p className="text-gray-600 mb-6">Bạn chưa thích bài viết nào. Hãy khám phá và thích những bài viết bạn yêu thích!</p>
                <button
                  onClick={() => router.push('/blogs')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Khám phá bài viết
                </button>
              </div>
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="max-w-3xl mx-auto text-center py-20">
              <div className="bg-white rounded-2xl shadow-lg p-12">
                <Search className="w-24 h-24 mx-auto text-gray-300 mb-4" />
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy bài viết</h3>
                <p className="text-gray-600 mb-4">Không có bài viết nào phù hợp với từ khóa &ldquo;{searchQuery}&rdquo;</p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Xóa tìm kiếm
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {currentBlogs.map((blog) => (
                  <div
                    key={blog.blogID}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1"
                  >
                    {blog.video_url ? (
                      <div className="relative h-56 overflow-hidden">
                        <iframe
                          src={blog.video_url}
                          className="w-full h-full"
                          allowFullScreen
                          title={blog.title}
                        />
                      </div>
                    ) : blog.image ? (
                      <div className="relative h-56 overflow-hidden">
                        <img 
                          src={`${API_URL}${blog.image}`} 
                          alt={blog.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="h-56 bg-linear-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">Không có ảnh/video</span>
                      </div>
                    )}
                    
                    <div className="p-6">
                      <div className="flex items-center gap-4 mb-3 text-gray-500 text-sm">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {blog.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(blog.createdAt)}
                        </span>
                      </div>
                      
                      <h2 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2 hover:text-blue-600 transition-colors">
                        {blog.title}
                      </h2>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {getContentPreview(blog.content)}
                      </p>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1 text-gray-600 text-sm">
                            <Heart className="w-4 h-4 fill-current text-red-500" />
                            {blog._count?.likes || 0}
                          </span>
                          <span className="flex items-center gap-1 text-gray-600 text-sm">
                            <MessageCircle className="w-4 h-4" />
                            {blog._count?.comments || 0}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewBlog(blog)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Xem bài viết"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleShare(blog)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Chia sẻ"
                          >
                            <Share2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleUnlike(blog.blogID)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Bỏ thích"
                          >
                            <Heart className="w-5 h-5 fill-current" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 shadow-md"
                    }`}
                  >
                    Trước
                  </button>

                  <div className="flex gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      const showPage = 
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 1 && page <= currentPage + 1);
                      
                      const showEllipsis = 
                        (page === currentPage - 2 && currentPage > 3) ||
                        (page === currentPage + 2 && currentPage < totalPages - 2);

                      if (showEllipsis) {
                        return <span key={page} className="px-2 text-gray-400">...</span>;
                      }

                      if (!showPage) return null;

                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                            currentPage === page
                              ? "bg-blue-600 text-white shadow-lg"
                              : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 shadow-md"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentPage === totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 shadow-md"
                    }`}
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {showDetailModal && detailBlog && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4" onClick={() => setShowDetailModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900">Chi tiết bài viết</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-4 text-gray-500 text-sm">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {detailBlog.author}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(detailBlog.createdAt)}
                </span>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-6">{detailBlog.title}</h1>

              {detailBlog.video_url && (
                <div className="relative aspect-video rounded-lg overflow-hidden mb-6">
                  <iframe
                    src={detailBlog.video_url}
                    className="w-full h-full"
                    allowFullScreen
                    title={detailBlog.title}
                  />
                </div>
              )}

              {detailBlog.image && (
                <div className="relative overflow-hidden rounded-lg mb-6">
                  <img 
                    src={`${API_URL}${detailBlog.image}`} 
                    alt={detailBlog.title}
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}

              <div 
                className="prose max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: detailBlog.content }}
              />

              <div className="flex items-center gap-6 pt-6 mt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 text-gray-600">
                  <Heart className="w-5 h-5 fill-current text-red-500" />
                  <span className="font-medium">{detailBlog._count?.likes || 0} lượt thích</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-medium">{detailBlog._count?.comments || 0} bình luận</span>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => handleShare(detailBlog)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  Chia sẻ
                </button>
                <button
                  onClick={() => {
                    handleUnlike(detailBlog.blogID);
                    setShowDetailModal(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Heart className="w-5 h-5 fill-current" />
                  Bỏ thích
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
