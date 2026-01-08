/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Heart, MessageCircle, Calendar, User, Search, Send, Trash2 } from "lucide-react";
import { API_URL } from '@/lib/config';
import { toast } from "sonner";

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

interface BlogComment {
  commentID: string;
  content: string;
  createdAt: string;
  user: {
    userID: string;
    full_name: string;
  };
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [expandedBlogs, setExpandedBlogs] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [blogComments, setBlogComments] = useState<Record<string, BlogComment[]>>({});
  const [showComments, setShowComments] = useState<Set<string>>(new Set());
  const [currentUser, setCurrentUser] = useState<{ userID: string; full_name: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser({ userID: user.userID, full_name: user.full_name });
    }
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/blogs?includeStats=true`);
      if (res.ok) {
        const data = await res.json();
        setBlogs(data);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (blogID: string) => {
    try {
      const res = await fetch(`${API_URL}/api/blogs/${blogID}/comments`);
      if (res.ok) {
        const data = await res.json();
        setBlogComments(prev => ({ ...prev, [blogID]: data }));
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleLike = async (blogID: string) => {
    if (!currentUser) {
      toast.error("Vui lòng đăng nhập để thích bài viết");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/blogs/${blogID}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: currentUser.userID }),
      });

      if (res.ok) {
        fetchBlogs();
      } else {
        const error = await res.json();
        console.error("Like error:", error);
        toast.error(error.error || "Không thể thích bài viết");
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Không thể thích bài viết");
    }
  };

  const handleComment = async (blogID: string) => {
    if (!currentUser) {
      toast.error("Vui lòng đăng nhập để bình luận");
      return;
    }

    const content = commentInputs[blogID]?.trim();
    if (!content) {
      toast.error("Vui lòng nhập nội dung bình luận");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/blogs/${blogID}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: currentUser.userID, content }),
      });

      if (res.ok) {
        setCommentInputs(prev => ({ ...prev, [blogID]: "" }));
        fetchComments(blogID);
        fetchBlogs();
      } else {
        const error = await res.json();
        console.error("Comment error:", error);
        toast.error(error.error || "Không thể thêm bình luận");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Không thể thêm bình luận");
    }
  };

  const handleDeleteComment = async (blogID: string, commentID: string) => {
    try {
      const res = await fetch(`${API_URL}/api/blogs/comments/${commentID}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchComments(blogID);
        fetchBlogs();
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Không thể xóa bình luận");
    }
  };

  const toggleExpand = (blogID: string) => {
    setExpandedBlogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(blogID)) {
        newSet.delete(blogID);
      } else {
        newSet.add(blogID);
      }
      return newSet;
    });
  };

  const toggleComments = (blogID: string) => {
    const isShowing = showComments.has(blogID);
    setShowComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(blogID)) {
        newSet.delete(blogID);
      } else {
        newSet.add(blogID);
      }
      return newSet;
    });

    if (!isShowing && !blogComments[blogID]) {
      fetchComments(blogID);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy");
  };

  const isUserLiked = (blog: Blog) => {
    return blog.likes?.some(like => like.user_id === currentUser?.userID) || false;
  };

  const filteredBlogs = blogs.filter((blog) => {
    const keyword = searchInput.toLowerCase();
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
  }, [searchInput]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50">
      <div className="bg-linear-to-r py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Bài viết
            </h1>
          </div>
          
          <div className="max-w-xl mx-auto mt-10">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm bài viết..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-full border-0 shadow-lg focus:ring-2 focus:ring-blue-300 outline-none text-gray-700"
              />
            </div>
          </div>
        </div>
      </div>

      <section className="py-16">
        <div className="container mx-auto px-4">
          {filteredBlogs.length === 0 ? (
            <div className="max-w-3xl mx-auto text-center py-20">
              <Search className="w-20 h-20 mx-auto text-gray-300 mb-4" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy bài viết</h3>
              <p className="text-gray-600">Thử tìm kiếm với từ khóa khác</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-1 lg:grid-cols-1 gap-8 max-w-4xl mx-auto">
              {currentBlogs.map((blog) => {
                const isExpanded = expandedBlogs.has(blog.blogID);
                const plainContent = blog.content.replace(/<[^>]*>/g, '');
                const showReadMore = plainContent.length > 300;

                return (
                  <div
                    key={blog.blogID}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex items-center gap-4 mb-4 text-gray-500 text-sm">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {blog.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(blog.createdAt)}
                        </span>
                      </div>
                      
                      <h2 className="text-2xl font-bold text-gray-800 mb-4">
                        {blog.title}
                      </h2>
                      
                      <div 
                        className={`text-gray-700 text-base mb-4 prose max-w-none ${!isExpanded && showReadMore ? 'line-clamp-10' : ''}`}
                        dangerouslySetInnerHTML={{ 
                          __html: isExpanded ? blog.content : blog.content 
                        }}
                      />

                      {showReadMore && (
                        <button
                          onClick={() => toggleExpand(blog.blogID)}
                          className="text-blue-600 hover:text-blue-700 font-semibold text-sm mb-4"
                        >
                          {isExpanded ? "Thu gọn" : "Xem thêm"}
                        </button>
                      )}

                      {blog.image && (
                        <div className="relative h-80 overflow-hidden rounded-lg mb-4">
                          <img 
                            src={`${API_URL}${blog.image}`} 
                            alt={blog.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {blog.video_url && (
                        <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
                          <iframe
                            src={blog.video_url}
                            className="w-full h-full"
                            allowFullScreen
                            title={blog.title}
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center gap-6 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => handleLike(blog.blogID)}
                          className={`flex items-center gap-2 transition-colors ${
                            isUserLiked(blog)
                              ? "text-red-500"
                              : "text-gray-600 hover:text-red-500"
                          }`}
                        >
                          <Heart className={`w-5 h-5 ${isUserLiked(blog) ? "fill-current" : ""}`} />
                          <span className="font-medium">{blog._count?.likes || 0}</span>
                        </button>

                        <button
                          onClick={() => toggleComments(blog.blogID)}
                          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span className="font-medium">{blog._count?.comments || 0}</span>
                        </button>
                      </div>

                      {showComments.has(blog.blogID) && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <h3 className="font-semibold text-gray-800 mb-4">Bình luận</h3>
                          
                          {currentUser && (
                            <div className="flex gap-2 mb-4">
                              <input
                                type="text"
                                placeholder="Viết bình luận..."
                                value={commentInputs[blog.blogID] || ""}
                                onChange={(e) => setCommentInputs(prev => ({ ...prev, [blog.blogID]: e.target.value }))}
                                onKeyDown={(e) => e.key === "Enter" && handleComment(blog.blogID)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <button
                                onClick={() => handleComment(blog.blogID)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                <Send className="w-5 h-5" />
                              </button>
                            </div>
                          )}

                          <div className="space-y-4">
                            {blogComments[blog.blogID]?.map((comment) => (
                              <div key={comment.commentID} className="flex gap-3">
                                <div className="flex-1 bg-gray-50 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold text-sm text-gray-800">
                                      {comment.user.full_name}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-500">
                                        {format(new Date(comment.createdAt), "dd/MM/yyyy HH:mm")}
                                      </span>
                                      {currentUser?.userID === comment.user.userID && (
                                        <button
                                          onClick={() => handleDeleteComment(blog.blogID, comment.commentID)}
                                          className="text-red-500 hover:text-red-700"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-gray-700 text-sm">{comment.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {filteredBlogs.length > 0 && totalPages > 1 && (
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
        </div>
      </section>
    </div>
  );
}
