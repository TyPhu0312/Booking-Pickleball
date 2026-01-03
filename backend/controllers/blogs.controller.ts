import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { deleteFile } from "../config/multer";
import path from "path";

const prisma = new PrismaClient();

export const getBlogs = async (req: Request, res: Response) => {
    try {
        const isAdmin = req.query.admin === 'true';
        const where: any = {};
        if (!isAdmin) {
            where.status = 'APPROVED';
        }

        const blogs = await prisma.blogs.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });
        res.json(blogs);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi lấy danh sách bài viết" });
    }
};

export const getBlogByUserId = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const blogs = await prisma.blogs.findMany({ where: { user_id: userId }, orderBy: { createdAt: "desc" } });
        res.json(blogs);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi lấy danh sách bài viết của người dùng" });
    }
};


export const getBlogById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; 
        const blog = await prisma.blogs.findUnique({ where: { blogID: id } });
        if (!blog) return res.status(404).json({ error: "Không tìm thấy bài viết" });
        res.json(blog);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi lấy thông tin bài viết" });
    }
};
export const createBlog = async (req: Request, res: Response) => {
    try {
                const { title, content, user_id, author } = req.body;
                const imagePath = req.file ? `/uploads/blogs/${req.file.filename}` : null;

                const newBlog = await prisma.blogs.create({
                        data: {
                                title,
                                content,
                                image: imagePath,
                                user_id: user_id || null,
                                author: author || null,
                                status: 'PENDING'
                        },
                });
                res.status(201).json(newBlog);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi tạo bài viết" });
    }
};

export const approveBlog = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { reviewer_id, review_note } = req.body;

        const blog = await prisma.blogs.findUnique({ where: { blogID: id } });
        if (!blog) return res.status(404).json({ error: 'Không tìm thấy bài viết' });

        const updated = await prisma.blogs.update({
            where: { blogID: id },
            data: {
                status: 'APPROVED',
                reviewer_id: reviewer_id || null,
                review_note: review_note || null,
                review_date: new Date()
            }
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi duyệt bài viết' });
    }
};

export const rejectBlog = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { reviewer_id, review_note } = req.body;

        const blog = await prisma.blogs.findUnique({ where: { blogID: id } });
        if (!blog) return res.status(404).json({ error: 'Không tìm thấy bài viết' });

        const updated = await prisma.blogs.update({
            where: { blogID: id },
            data: {
                status: 'REJECTED',
                reviewer_id: reviewer_id || null,
                review_note: review_note || null,
                review_date: new Date()
            }
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi từ chối bài viết' });
    }
};
export const updateBlog = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, content, author, user_id } = req.body;
        
        const existingBlog = await prisma.blogs.findUnique({ where: { blogID: id } });
        if (!existingBlog) {
            return res.status(404).json({ error: "Không tìm thấy bài viết" });
        }

        let imagePath = existingBlog.image;

        if (req.file) {
            if (existingBlog.image) {
                const oldImagePath = path.join(process.cwd(), existingBlog.image);
                deleteFile(oldImagePath);
            }
            imagePath = `/uploads/blogs/${req.file.filename}`;
        }
        
        const updatedBlog = await prisma.blogs.update({
            where: { blogID: id },
            data: {
                title,
                content,
                author,
                image: imagePath,
                user_id
            },
        });
        res.json(updatedBlog);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi cập nhật bài viết" });
    }
};
export const deleteBlog = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const existingBlog = await prisma.blogs.findUnique({ where: { blogID: id } });
        if (!existingBlog) {
            return res.status(404).json({ error: "Không tìm thấy bài viết" });
        }

        if (existingBlog.image) {
            const imagePath = path.join(process.cwd(), existingBlog.image);
            deleteFile(imagePath);
        }

        await prisma.blogs.delete({ where: { blogID: id } });
        res.json({ message: "Xóa bài viết thành công" });
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi xóa bài viết" });
    }
};