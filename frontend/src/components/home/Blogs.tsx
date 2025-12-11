/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { BookOpen, Calendar, User, ChevronRight } from "lucide-react";
import { API_URL } from "@/lib/config";

interface Blog {
  blogID: string;
  title: string;
  content: string;
  author: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export default function Blogs() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/blogs`);
      if (res.ok) {
        const data = await res.json();
        setBlogs(data.slice(0, 6)); 
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy");
  };

  const truncateContent = (content: string, maxLength: number = 120) => {
    const plainText = content.replace(/<[^>]*>/g, '');
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + "...";
  };

  return (
    <section className="py-24 bg-linear-to-br from-white via-slate-50 to-blue-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-30"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-semibold mb-4">
            <BookOpen className="w-4 h-4" />
            Tin Tức & Bài Viết
          </div>
          <h2 className="text-5xl font-black text-gray-800 mb-4">Bài viết Pickleball</h2>
          <p className="text-xl text-gray-600">Cập nhật kiến thức, mẹo chơi và tin tức mới nhất</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : blogs.length === 0 ? (
          <div className="max-w-3xl mx-auto text-center py-16">
            <BookOpen className="w-20 h-20 mx-auto text-gray-300 mb-4" />
            <p className="text-xl text-gray-500">Chưa có bài viết nào</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {blogs.map((blog) => (
              <Link
                key={blog.blogID}
                href={`/blogs/${blog.blogID}`}
                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white"
              >
                {blog.image ? (
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={`${API_URL}${blog.image}`} 
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent"></div>
                  </div>
                ) : (
                  <div className="h-48 bg-linear-to-br from-blue-500 to-indigo-600"></div>
                )}
                
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3 text-gray-500 text-sm">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(blog.createdAt)}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {blog.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {truncateContent(blog.content)}
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="w-3 h-3" />
                      <span className="text-sm font-semibold">{blog.author}</span>
                    </div>
                    <span className="text-blue-600 hover:gap-2 inline-flex items-center gap-1 text-sm font-semibold transition-all">
                      Xem
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {blogs.length > 0 && (
          <div className="text-center mt-12">
            <Link
              href="/blogs"
              className="inline-flex items-center gap-2 bg-linear-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all"
            >
              Xem Tất Cả Bài Viết
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
