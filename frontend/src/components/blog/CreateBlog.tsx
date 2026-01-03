/* eslint-disable @next/next/no-img-element */
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import TextEditor from "@/components/ui/TextEditor";
import { API_URL } from "@/lib/config";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";


export function CreateBlogDialog({ show, onClose, onCreated }: { show: boolean; onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [userId, setUserId] = useState<string>('');
  const [imageFileLocal, setImageFileLocal] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [loadingLocal, setLoadingLocal] = useState(false);

  useEffect(() => {
    if (show) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setAuthor(user.full_name || '');
          setUserId(user.userID || '');
        } catch (err) {
          console.error('Error parsing user data:', err);
        }
      }
    }
  }, [show]);

  const handleImageChangeLocal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFileLocal(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitLocal = async () => {
    try {
      if (!title || !content || !author) {
        toast.error('Vui lòng điền đầy đủ thông tin');
        return;
      }
      setLoadingLocal(true);
      const fd = new FormData();
      fd.append('title', title);
      fd.append('content', content);
      fd.append('author', author);
      if (userId) fd.append('user_id', userId);
      if (imageFileLocal) fd.append('image', imageFileLocal);

      const res = await fetch(`${API_URL}/api/blogs/create`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi tạo bài viết');

      toast.success('Bài viết đã được gửi để duyệt');
      setTitle(''); setContent(''); setAuthor(''); setImageFileLocal(null); setPreview('');
      onCreated();
      onClose();
    } catch (err) {
      toast.error((err as Error).message || 'Lỗi');
    } finally {
      setLoadingLocal(false);
    }
  };

  return (
    <Dialog open={show} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo bài viết</DialogTitle>
          <DialogDescription>Gửi bài viết để admin duyệt</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label htmlFor="title">Tiêu đề</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="author">Tác giả</Label>
            <Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="content">Nội dung</Label>
            <div className="min-h-[200px]"><TextEditor value={content} onChange={(v: string) => setContent(v)} /></div>
          </div>
          <div>
            <Label htmlFor="image">Hình ảnh</Label>
            <Input id="image" type="file" accept="image/*" onChange={handleImageChangeLocal} />
            {preview && <img src={preview} alt="preview" className="mt-3 w-full h-48 object-cover rounded-lg" />}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleSubmitLocal} className="bg-blue-600 hover:bg-blue-700">{loadingLocal ? 'Đang gửi...' : 'Gửi để duyệt'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}