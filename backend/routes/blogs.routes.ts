import express from "express";
import {
  getBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
} from "../controllers/blogs.controller";
import { uploadBlogImage } from "../config/multer";

const router = express.Router();

router.get("/", getBlogs);
router.get("/:id", getBlogById);
router.post("/create", uploadBlogImage.single("image"), createBlog);
router.put("/update/:id", uploadBlogImage.single("image"), updateBlog);
router.delete("/delete/:id", deleteBlog);

export default router;
