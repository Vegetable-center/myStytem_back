import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// 视频存储目录
export const VIDEO_STORAGE_DIR = join(process.cwd(), 'uploads/course-videos');
// 新增：封面图存储目录
export const COVER_IMAGE_STORAGE_DIR = join(process.cwd(), 'uploads/course-covers');

// 确保目录存在
[VIDEO_STORAGE_DIR, COVER_IMAGE_STORAGE_DIR].forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
});

// 视频上传配置（原有）
export const videoUploadOptions = {
  storage: diskStorage({
    destination: VIDEO_STORAGE_DIR,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      const filename = `course-video-${uniqueSuffix}${ext}`;
      cb(null, filename);
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['video/mp4', 'video/mpeg', 'video/avi', 'video/webm', 'video/quicktime'];
    allowedMimeTypes.includes(file.mimetype) ? cb(null, true) : cb(new Error('仅支持视频文件'), false);
  },
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
};

// 新增：封面图上传配置
export const coverImageUploadOptions = {
  storage: diskStorage({
    destination: COVER_IMAGE_STORAGE_DIR,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      const filename = `course-cover-${uniqueSuffix}${ext}`;
      cb(null, filename);
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    allowedMimeTypes.includes(file.mimetype) ? cb(null, true) : cb(new Error('仅支持JPG/PNG/WebP/GIF格式图片'), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
};