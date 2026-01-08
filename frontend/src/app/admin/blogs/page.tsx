/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Eye, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { API_URL } from "@/lib/config";
import { CreateBlogDialog } from "@/components/blog/CreateBlog";

interface Blog {
  blogID: string;
  title: string;
  content: string;
  author: string;
  user_id?: string;
  reviewer_id?: string;
  review_note?: string;
  image?: string;
  video_url?: string;
  createdAt: string;
  updatedAt: string;
  status?: string;
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailBlog, setDetailBlog] = useState<Blog | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelBlogId, setCancelBlogId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectBlogId, setRejectBlogId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchBlogs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/blogs?admin=true`);
      const data = await res.json();
      setBlogs(data);
    } catch (error) {
      console.error("Lỗi khi tải blogs:", error);
      toast.error("Không thể tải danh sách blogs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleDeleteBlog = async (id: string) => {
    if (!cancelBlogId) return;

    try {
      const res = await fetch(`${API_URL}/api/blogs/delete/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Lỗi khi xóa blog");
      }

      toast.success("Xóa blog thành công!");
      setShowCancelConfirm(false);
      setCancelBlogId(null);
      fetchBlogs();
    } catch (error: unknown) {
      toast.error((error as Error).message || "Lỗi khi xóa blog");
    }
  };

  const handleApproveBlog = async (blogId: string) => {
    try {
      const userStr = localStorage.getItem('user');
      let reviewer_id = null;
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          reviewer_id = user.userID;
        } catch (e) {
          console.error('Error parsing user:', e);
        }
      }
      
      const res = await fetch(`${API_URL}/api/blogs/${blogId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewer_id }),
      });
      if (!res.ok) throw new Error('Lỗi khi duyệt bài');
      toast.success('Duyệt bài thành công');
      fetchBlogs();
    } catch (err) {
      toast.error((err as Error).message || 'Lỗi');
    }
  };

  const handleRejectBlog = async () => {
    if (!rejectBlogId || !rejectReason.trim()) return;

    try {
      const userStr = localStorage.getItem('user');
      let reviewer_id = null;
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          reviewer_id = user.userID;
        } catch (e) {
          console.error('Error parsing user:', e);
        }
      }
      
      const res = await fetch(`${API_URL}/api/blogs/${rejectBlogId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_note: rejectReason, reviewer_id }),
      });
      if (!res.ok) throw new Error('Lỗi khi từ chối bài');
      toast.success('Đã từ chối bài viết');
      setShowRejectModal(false);
      setRejectBlogId(null);
      setRejectReason('');
      fetchBlogs();
    } catch (err) {
      toast.error((err as Error).message || 'Lỗi');
    }
  };

  const filteredBlogs = blogs.filter((blog) => {
    const keyword = searchInput.toLowerCase();
    const matchesSearch = (
      blog.title.toLowerCase().includes(keyword) ||
      blog.author.toLowerCase().includes(keyword) ||
      blog.content.toLowerCase().includes(keyword)
    );
    const matchesStatus = statusFilter === 'ALL' || blog.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    ALL: blogs.length,
    PENDING: blogs.filter(b => b.status === 'PENDING').length,
    APPROVED: blogs.filter(b => b.status === 'APPROVED').length,
    REJECTED: blogs.filter(b => b.status === 'REJECTED').length,
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Chờ duyệt</span>;
      case 'APPROVED':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Đã duyệt</span>;
      case 'REJECTED':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Từ chối</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Không rõ</span>;
    }
  };

  const totalPages = Math.ceil(filteredBlogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBlogs = filteredBlogs.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchInput]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) return <p>Đang tải dữ liệu...</p>;

  const truncateContent = (content: string, maxLength: number = 150) => {
    const plainText = content.replace(/<[^>]*>/g, '');
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + "...";
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Quản Lý Bài Viết</h1>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm blog..."
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
          Thêm Blog
        </button>
      </div>

      <div className="flex gap-2 mb-6 border-b">
        {[
          { key: 'ALL', label: 'Tất cả' },
          { key: 'PENDING', label: 'Chờ duyệt' },
          { key: 'APPROVED', label: 'Đã duyệt' },
          { key: 'REJECTED', label: 'Từ chối' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              statusFilter === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label} ({statusCounts[tab.key as keyof typeof statusCounts]})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Media</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Tiêu Đề</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Tác Giả</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Trạng Thái</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Ngày Tạo</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentBlogs.map((blog) => (
              <tr key={blog.blogID} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {blog.video_url ? (
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-black flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                      </svg>
                    </div>
                  ) : blog.image ? (
                    <img
                      src={`${API_URL}${blog.image}`}
                      alt={blog.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No Media</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium max-w-xs truncate">{blog.title}</div>
                  <div className="text-sm text-gray-500 max-w-xs truncate">{truncateContent(blog.content)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{blog.author}</td>
                <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(blog.status)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(blog.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <button
                      className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                      onClick={() => {
                        setDetailBlog(blog);
                        setShowDetailModal(true);
                      }}
                      title="Xem chi tiết"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {blog.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleApproveBlog(blog.blogID)}
                          className="px-3 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded"
                          title="Duyệt bài"
                        >Duyệt</button>
                        <button
                          onClick={() => {
                            setRejectBlogId(blog.blogID);
                            setShowRejectModal(true);
                          }}
                          className="px-3 py-1 text-xs font-medium text-white bg-orange-600 hover:bg-orange-700 rounded"
                          title="Từ chối bài"
                        >Từ chối</button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        setCancelBlogId(blog.blogID);
                        setShowCancelConfirm(true);
                      }}
                      className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                      title="Xóa bài"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-gray-700">
              <span className="font-medium"></span>Tổng số bài viết{" "}
              <span className="font-medium">{filteredBlogs.length}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="disabled:opacity-50"
              >
                Trước
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page ? "bg-blue-600 hover:bg-blue-700" : ""}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="disabled:opacity-50"
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>

      <CreateBlogDialog 
        show={showForm} 
        onClose={() => setShowForm(false)} 
        onCreated={() => fetchBlogs()} 
      />

      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi Tiết Bài Viết</DialogTitle>
          </DialogHeader>

          {detailBlog && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-4">
                  {getStatusBadge(detailBlog.status)}
                  <span className="text-sm text-gray-500">{formatDate(detailBlog.createdAt)}</span>
                </div>
                
                {detailBlog.video_url && (
                  <div className="aspect-video rounded-lg overflow-hidden mb-4">
                    <iframe
                      src={detailBlog.video_url}
                      className="w-full h-full"
                      allowFullScreen
                      title={detailBlog.title}
                    />
                  </div>
                )}
                
                {detailBlog.image && (
                  <img
                    src={`${API_URL}${detailBlog.image}`}
                    alt={detailBlog.title}
                    className="w-full h-96 object-cover rounded-lg mb-4"
                  />
                )}
                
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{detailBlog.title}</h2>
                <p className="text-sm text-gray-600 mb-4">Tác giả: {detailBlog.author}</p>
                
                {detailBlog.status === 'REJECTED' && detailBlog.review_note && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-semibold text-red-800 mb-2">Lý do từ chối:</p>
                    <p className="text-sm text-red-700">{detailBlog.review_note}</p>
                  </div>
                )}
                
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: detailBlog.content }}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Từ chối bài viết</h2>
            <p className="text-gray-600 mb-4">Vui lòng nhập lý do từ chối:</p>
            
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[100px] mb-4"
            />
            
            <div className="flex gap-3">
              <button
                onClick={handleRejectBlog}
                disabled={!rejectReason.trim()}
                className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Xác nhận từ chối
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectBlogId(null);
                  setRejectReason('');
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 relative">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Xác nhận xóa bài viết</h2>
            <p className="text-gray-600 mb-6">Bạn có chắc chắn muốn xóa bài viết này không?</p>
            
            <div className="flex gap-3">
              <button
                onClick={handleDeleteBlog.bind(null, cancelBlogId!)}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Xác nhận xóa
              </button>
              <button
                onClick={() => {
                  setShowCancelConfirm(false);
                  setCancelBlogId(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
