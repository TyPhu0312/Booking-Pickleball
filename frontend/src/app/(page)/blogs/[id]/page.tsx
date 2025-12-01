/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useParams, useRouter } from "next/navigation";
import { Calendar, User, ArrowLeft, BookOpen } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Blog {
  blogID: string;
  title: string;
  content: string;
  author: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async (id: string) => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/blogs/${id}`);
        if (res.ok) {
          const data = await res.json();
          setBlog(data);
        } else {
          router.push("/blogs");
        }
      } catch (error) {
        console.error("Error fetching blog:", error);
        router.push("/blogs");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchBlog(params.id as string);
    }
  }, [params.id, router]);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMMM yyyy, HH:mm");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-20 h-20 mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy bài viết</h2>
          <button
            onClick={() => router.push("/blogs")}
            className="text-blue-600 hover:underline"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-semibold"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại
        </button>
      </div>

      <article className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="p-8 md:p-12 border-b border-gray-100">
            <h1 className="text-4xl md:text-5xl font-black text-gray-800 mb-6 leading-tight">
              {blog.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="font-medium">{formatDate(blog.createdAt)}</span>
              </div>
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Bởi {blog.author}</span>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12">
            <div 
              className="prose prose-lg max-w-none prose-headings:text-gray-800 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-800 prose-ul:text-gray-700 prose-ol:text-gray-700"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />

            {blog.image && (
              <div className="mt-8 mb-8">
                <div className="rounded-2xl overflow-hidden shadow-lg">
                  <img 
                    src={`${API_URL}${blog.image}`} 
                    alt={blog.title}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            )}

            <div className="mt-12 pt-8 border-t-2 border-gray-100">
              <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-2xl p-6">
                <p className="text-sm text-gray-600 mb-2">Nguồn bài viết</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-linear-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {blog.author.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-lg">{blog.author}</p>
                    <p className="text-sm text-gray-600">Tác giả</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mt-8 text-center">
          <button
            onClick={() => router.push("/blogs")}
            className="inline-flex items-center gap-2 bg-linear-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all"
          >
            <BookOpen className="w-5 h-5" />
            Xem Thêm Bài Viết
          </button>
        </div>
      </article>
    </div>
  );
}
