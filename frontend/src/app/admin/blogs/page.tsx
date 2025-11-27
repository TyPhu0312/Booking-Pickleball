/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import TextEditor from "@/components/ui/TextEditor";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Blog {
  blogID: string;
  title: string;
  content: string;
  author: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    author: "",
  });
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [editImagePreview, setEditImagePreview] = useState<string>("");

  const fetchBlogs = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/blogs");
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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

  const handleCreateBlog = async () => {
    try {
      if (!formData.title || !formData.content || !formData.author) {
        toast.error("Vui lòng điền đầy đủ thông tin");
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("content", formData.content);
      formDataToSend.append("author", formData.author);
      
      if (imageFile) {
        formDataToSend.append("image", imageFile);
      }

      const res = await fetch("http://localhost:5000/api/blogs/create", {
        method: "POST",
        body: formDataToSend,
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Lỗi khi tạo blog");
      }
      
      toast.success("Tạo blog thành công!");
      setShowForm(false);
      setFormData({ title: "", content: "", author: "" });
      setImageFile(null);
      setImagePreview("");
      fetchBlogs();
    } catch (error: unknown) {
      toast.error((error as Error).message || "Lỗi khi tạo blog");
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

      const res = await fetch(`http://localhost:5000/api/blogs/update/${editingBlog.blogID}`, {
        method: "PUT",
        body: formDataToSend,
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Lỗi khi cập nhật blog");
      }
      
      toast.success("Cập nhật blog thành công!");
      setEditingBlog(null);
      setEditImageFile(null);
      setEditImagePreview("");
      fetchBlogs();
    } catch (error: unknown) {
      toast.error((error as Error).message || "Lỗi khi cập nhật blog");
    }
  };

  const handleDeleteBlog = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa blog "${title}"?`)) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/blogs/delete/${id}`, {
        method: "DELETE",
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Lỗi khi xóa blog");
      }
      
      toast.success("Xóa blog thành công!");
      fetchBlogs();
    } catch (error: unknown) {
      toast.error((error as Error).message || "Lỗi khi xóa blog");
    }
  };

  const filteredBlogs = blogs.filter((blog) => {
    const keyword = searchInput.toLowerCase();
    return (
      blog.title.toLowerCase().includes(keyword) ||
      blog.author.toLowerCase().includes(keyword) ||
      blog.content.toLowerCase().includes(keyword)
    );
  });

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
      <div className="flex justify-between items-center mb-8">
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

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Hình Ảnh</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Tiêu Đề</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Tác Giả</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Ngày Tạo</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredBlogs.map((blog) => (
              <tr key={blog.blogID} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {blog.image ? (
                    <img 
                      src={`http://localhost:5000${blog.image}`} 
                      alt={blog.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No Image</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium max-w-xs truncate">{blog.title}</div>
                  <div className="text-sm text-gray-500 max-w-xs truncate">{truncateContent(blog.content)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{blog.author}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(blog.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button 
                    className="text-blue-600 hover:text-blue-900"
                    onClick={() => setEditingBlog(blog)}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteBlog(blog.blogID, blog.title)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thêm Blog Mới</DialogTitle>
            <DialogDescription>
              Nhập thông tin để tạo blog mới
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Tiêu đề *</Label>
              <Input
                id="title"
                placeholder="Nhập tiêu đề blog"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="author">Tác giả *</Label>
              <Input
                id="author"
                placeholder="Tên tác giả"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="content">Nội dung *</Label>
              <TextEditor
                value={formData.content}
                onChange={(data: string) => setFormData({ ...formData, content: data })}
              />
            </div>

            <div>
              <Label htmlFor="image">Hình ảnh</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="cursor-pointer"
              />
              {imagePreview && (
                <div className="mt-3">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowForm(false);
              setImageFile(null);
              setImagePreview("");
            }}>
              Hủy
            </Button>
            <Button onClick={handleCreateBlog} className="bg-blue-600 hover:bg-blue-700">
              Tạo blog
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingBlog} onOpenChange={(open) => !open && setEditingBlog(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh Sửa Blog</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin blog
            </DialogDescription>
          </DialogHeader>
          
          {editingBlog && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Tiêu đề *</Label>
                <Input
                  id="edit-title"
                  placeholder="Nhập tiêu đề blog"
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
                <TextEditor
                  value={editingBlog.content}
                  onChange={(data: string) => setEditingBlog({ ...editingBlog, content: data })}
                />
              </div>

              <div>
                <Label htmlFor="edit-image">Hình ảnh</Label>
                {editingBlog.image && !editImagePreview && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-2">Ảnh hiện tại:</p>
                    <img 
                      src={`http://localhost:5000${editingBlog.image}`} 
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
    </div>
  );
}
