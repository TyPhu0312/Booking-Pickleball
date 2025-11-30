import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const blogStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/blogs';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'blog-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const courtStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/courts';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'court-' + uniqueSuffix + path.extname(file.originalname));
  }
});


const imageFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif, webp)!'));
  }
};

export const uploadBlogImage = multer({
  storage: blogStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: imageFilter
});

export const uploadCourtImage = multer({
  storage: courtStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: imageFilter
});


export const deleteFile = (filePath: string) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};
