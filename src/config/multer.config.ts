// src/config/multer.config.ts
import { diskStorage } from 'multer';
import { extname } from 'path';

// 配置文件存储路径和文件名
export const multerConfig = {
  storage: diskStorage({
    // 上传文件保存到项目根目录的 uploads 文件夹（需手动创建）
    destination: './uploads',
    // 自定义文件名：时间戳 + 原扩展名
    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
      callback(null, filename);
    },
  }),
  // 限制文件大小（5MB）
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  // 限制文件类型（可选，仅允许文档类）
  fileFilter: (req, file, callback) => {
    // 1. 修复文件名乱码：手动解码 UTF-8
      const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
      
      // 2. 生成唯一文件名（保留原扩展名）
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(originalName);
      const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
      
      // 3. 把修复后的 originalName 挂载到 file 对象上，方便后续保存到数据库
      (file as any).originalName = originalName;
    // const allowedMimeTypes = [
    //   'application/pdf',
    //   'application/msword',
    //   'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    //   'text/plain',
    // ];
    // if (allowedMimeTypes.includes(file.mimetype)) {
    //   callback(null, true);
    // } else {
    //   callback(new Error('仅支持 PDF/Word/TXT 文档'), false);
    // }
    callback(null, true);
  },
};