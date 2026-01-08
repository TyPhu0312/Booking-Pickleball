import express from "express";
import {
  getBlogs,
  getBlogById,
  getBlogByUserId,
  createBlog,
  approveBlog,
  rejectBlog,
  updateBlog,
  deleteBlog,
  toggleLike,
  getLikes,
  getComments,
  createComment,
  deleteComment,
  
} from "../controllers/blogs.controller";
import { uploadBlogImage } from "../config/multer";

const router = express.Router();

router.get("/", getBlogs);
router.get("/:id", getBlogById);
router.get("/user/:userId", getBlogByUserId);
router.post("/create", uploadBlogImage.single("image"), createBlog);
router.post("/:id/approve", approveBlog);
router.post("/:id/reject", rejectBlog);
router.put("/update/:id", uploadBlogImage.single("image"), updateBlog);
router.delete("/delete/:id", deleteBlog);

router.post("/:id/like", toggleLike);
router.get("/:id/likes", getLikes);

router.get("/:id/comments", getComments);
router.post("/:id/comments", createComment);
router.delete("/comments/:commentId", deleteComment);

export default router;
