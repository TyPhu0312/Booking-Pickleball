/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { BookOpen, Calendar, User, Search, ChevronRight } from "lucide-react";

import { API_URL } from '@/lib/config';

interface Blog {
  blogID: string;
  title: string;
  content: string;
  author: string;
  user_id?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/blogs`);
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

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy");
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    const plainText = content.replace(/<[^>]*>/g, '');
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + "...";
  };

  const filteredBlogs = blogs.filter((blog) => {
    const keyword = searchInput.toLowerCase();
    return (
      blog.title.toLowerCase().includes(keyword) ||
      blog.author.toLowerCase().includes(keyword) ||
      blog.content.toLowerCase().includes(keyword)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50">
      <div className="bg-linear-to-r py-20 ">
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
              <BookOpen className="w-20 h-20 mx-auto text-gray-300 mb-4" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy bài viết</h3>
              <p className="text-gray-600">Thử tìm kiếm với từ khóa khác</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {filteredBlogs.map((blog) => (
                <Link
                  key={blog.blogID}
                  href={`/blogs/${blog.blogID}`}
                  className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white"
                >
                  {blog.image ? (
                    <div className="relative h-56 overflow-hidden">
                      <img 
                        src={`${API_URL}${blog.image}`} 
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent"></div>
                    </div>
                  ) : (
                    <div className="h-56 bg-linear-to-br from-blue-500 to-indigo-600"></div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-3 text-gray-500 text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(blog.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {blog.author}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {blog.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 truncate">
                      {truncateContent(blog.content)}
                    </p>
                    
                    <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm group-hover:gap-3 transition-all">
                      Đọc thêm
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
