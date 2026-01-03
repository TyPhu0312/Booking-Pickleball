/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { Edit, Trash2, Eye, Plus } from "lucide-react";
import TextEditor from "@/components/ui/TextEditor";
import { CreateBlogDialog } from '@/components/blog/CreateBlog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { API_URL } from "@/lib/config";
import { useRouter } from "next/navigation";

interface Blog {
  blogID: string;
  title: string;
  content: string;
  author: string;
  user_id?: string;
  reviewer_id?: string;
  review_note?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
  status?: string;
}

export default function MyBlogsPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string>("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteBlogId, setDeleteBlogId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailBlog, setDetailBlog] = useState<Blog | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserId(user.userID);
      } catch (e) {
        console.error('Error parsing user:', e);
        toast.error("Vui lòng đăng nhập để xem bài viết của bạn");
        router.push('/login');
      }
    } else {
      toast.error("Vui lòng đăng nhập để xem bài viết của bạn");
      router.push('/login');
    }
  }, [router]);

  const fetchMyBlogs = async () => {
    if (!userId) return;
    
    try {
      const res = await fetch(`${API_URL}/api/blogs/user/${userId}`);
      const data = await res.json();
      setBlogs(data);
    } catch (error) {
      console.error("Lỗi khi tải blogs:", error);
      toast.error("Không thể tải danh sách bài viết");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchMyBlogs();
    }
  }, [userId]);

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

  const handleUpdateBlog = async () => {
    if (!editingBlog) return;

    try {
      if (!editingBlog.title || !editingBlog.content || !editingBlog.author) {
        toast.error("Vui lòng điền đầy đủ thông tin");
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append("title", editingBlog.title);
      formDataToSend.append("content", editingBlog.content);
      formDataToSend.append("author", editingBlog.author);

      if (editImageFile) {
        formDataToSend.append("image", editImageFile);
      }

      const res = await fetch(`${API_URL}/api/blogs/update/${editingBlog.blogID}`, {
        method: "PUT",
        body: formDataToSend,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Lỗi khi cập nhật bài viết");
      }

      toast.success("Cập nhật bài viết thành công!");
      setEditingBlog(null);
      setEditImageFile(null);
      setEditImagePreview("");
      fetchMyBlogs();
    } catch (error: unknown) {
      toast.error((error as Error).message || "Lỗi khi cập nhật bài viết");
    }
  };

  const handleDeleteBlog = async () => {
    if (!deleteBlogId) return;

    try {
      const res = await fetch(`${API_URL}/api/blogs/delete/${deleteBlogId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Lỗi khi xóa bài viết");
      }

      toast.success("Xóa bài viết thành công!");
      setShowDeleteConfirm(false);
      setDeleteBlogId(null);
      fetchMyBlogs();
    } catch (error: unknown) {
      toast.error((error as Error).message || "Lỗi khi xóa bài viết");
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Chờ duyệt</span>;
      case 'APPROVED':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Đã duyệt</span>;
      case 'REJECTED':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Từ chối</span>;
      default:
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Không rõ</span>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    const plainText = content.replace(/<[^>]*>/g, '');
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + "...";
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Đang tải bài viết...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Bài Viết Của Tôi</h1>
              <p className="text-gray-600">Quản lý và theo dõi trạng thái các bài viết của bạn</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Tạo bài viết mới
            </button>
          </div>
        </div>

        {blogs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có bài viết nào</h3>
            <p className="text-gray-600">Bạn chưa tạo bài viết nào. Hãy bắt đầu viết bài đầu tiên của bạn bằng cách nhấn nút Tạo bài viết mới ở trên!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {blogs.map((blog) => (
              <div key={blog.blogID} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {blog.image ? (
                  <img
                    src={`${API_URL}${blog.image}`}
                    alt={blog.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-linear-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Không có ảnh</span>
                  </div>
                )}
                
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    {getStatusBadge(blog.status)}
                    <span className="text-xs text-gray-500">{formatDate(blog.createdAt)}</span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{blog.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">{truncateContent(blog.content)}</p>
                  
                  {blog.status === 'REJECTED' && blog.review_note && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs font-semibold text-red-800 mb-1">Lý do từ chối:</p>
                      <p className="text-xs text-red-700">{blog.review_note}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setDetailBlog(blog);
                        setShowDetailModal(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Xem
                    </button>
                    {(blog.status === 'PENDING' || blog.status === 'REJECTED') && (
                      <button
                        onClick={() => setEditingBlog(blog)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                        title={blog.status === 'REJECTED' ? 'Bài viết đã bị từ chối, bạn có thể chỉnh sửa và gửi lại' : 'Chỉnh sửa bài viết đang chờ duyệt'}
                      >
                        <Edit className="w-4 h-4" />
                        Sửa
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setDeleteBlogId(blog.blogID);
                        setShowDeleteConfirm(true);
                      }}
                      className="flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateBlogDialog 
        show={showCreateForm} 
        onClose={() => setShowCreateForm(false)} 
        onCreated={() => fetchMyBlogs()} 
      />

      <Dialog open={!!editingBlog} onOpenChange={(open) => !open && setEditingBlog(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh Sửa Bài Viết</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin bài viết của bạn
            </DialogDescription>
          </DialogHeader>

          {editingBlog && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Tiêu đề *</Label>
                <Input
                  id="edit-title"
                  placeholder="Nhập tiêu đề bài viết"
                  value={editingBlog.title}
                  onChange={(e) => setEditingBlog({ ...editingBlog, title: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit-author">Tác giả *</Label>
                <Input
                  id="edit-author"
                  placeholder="Tên tác giả"
                  value={editingBlog.author}
                  onChange={(e) => setEditingBlog({ ...editingBlog, author: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit-content">Nội dung *</Label>
                <div className="min-h-[300px]">
                  <TextEditor
                    value={editingBlog.content}
                    onChange={(data: string) => setEditingBlog({ ...editingBlog, content: data })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-image">Hình ảnh</Label>
                {editingBlog.image && !editImagePreview && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-2">Ảnh hiện tại:</p>
                    <img
                      src={`${API_URL}${editingBlog.image}`}
                      alt={editingBlog.title}
                      className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
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
                      className="w-full h-64 object-cover rounded-lg border-2 border-green-200"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditingBlog(null);
              setEditImageFile(null);
              setEditImagePreview("");
            }}>
              Hủy
            </Button>
            <Button onClick={handleUpdateBlog} className="bg-green-600 hover:bg-green-700">
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Xác nhận xóa bài viết</h2>
            <p className="text-gray-600 mb-6">Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.</p>
            
            <div className="flex gap-3">
              <button
                onClick={handleDeleteBlog}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Xác nhận xóa
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteBlogId(null);
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
