import { Controller, Get, Param, Request, UseGuards, Post, Body, BadRequestException, UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt.guards'; // 假设JWT守卫在auth模块
import { AnyFilesInterceptor } from '@nestjs/platform-express'; // 导入文件拦截器
import { CourseService } from './course.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { VIDEO_STORAGE_DIR, COVER_IMAGE_STORAGE_DIR } from '../config/file-upload.config';
import { AdminGuard } from 'src/common/guards/admin.guards';

@Controller('course')
@UseGuards(JwtAuthGuard) // 登录验证
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

 // 新增：创建课程（支持批量上传视频文件）
  @Post()
  @UseInterceptors(AnyFilesInterceptor({
    storage: diskStorage({
      // 动态选择存储目录：新增 lessonCovers 处理
      destination: (req, file, cb) => {
        if (file.fieldname === 'coverImage' || file.fieldname === 'lessonCovers') {
          cb(null, COVER_IMAGE_STORAGE_DIR); // 课时封面也存到 course-covers
        } else if (file.fieldname === 'videos') {
          cb(null, VIDEO_STORAGE_DIR);
        } else {
          cb(new Error(`未知文件类型: ${file.fieldname}`), "null"); // 修正错误参数
        }
      },
      // 动态生成文件名：新增 lessonCovers 命名
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        
        let filename = '';
        if (file.fieldname === 'coverImage') {
          filename = `course-cover-${uniqueSuffix}${ext}`;
        } else if (file.fieldname === 'lessonCovers') {
          filename = `lesson-cover-${uniqueSuffix}${ext}`; // 课时封面命名
        } else if (file.fieldname === 'videos') {
          filename = `course-video-${uniqueSuffix}${ext}`;
        } else {
          cb(new Error(`未知文件类型: ${file.fieldname}`), "null"); // 修正错误参数
          return;
        }
        cb(null, filename);
      },
    }),
    // 完善文件类型校验：新增 lessonCovers 校验
    fileFilter: (req, file, cb) => {
      let allowedMimeTypes: string[] = [];
      let errorMsg = '';

      if (file.fieldname === 'coverImage' || file.fieldname === 'lessonCovers') {
        allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        errorMsg = '仅支持JPG/PNG/WebP/GIF格式图片';
      } else if (file.fieldname === 'videos') {
        allowedMimeTypes = ['video/mp4', 'video/mpeg', 'video/avi', 'video/webm', 'video/quicktime'];
        errorMsg = '仅支持MP4/MPEG/AVI/WebM/QuickTime格式视频';
      } else {
        cb(new Error(`未知文件字段: ${file.fieldname}`), false);
        return;
      }

      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`${file.fieldname}: ${errorMsg}`), false);
      }
    },
    // 补充文件大小校验：封面5MB / 视频100MB
    limits: {
      fileSize: 100 * 1024 * 1024, // 视频最大100MB
    },
  }))
  async createCourse(
    @UploadedFiles() files: {
    [fieldname: string]: Express.Multer.File[];
  },
    @Body() body: any
  ) {
    const coverImage = (files as any).find(file => file.fieldname === 'coverImage');
    const videos = (files as any).filter(file => file.fieldname === 'videos');
    const lessonCovers = (files as any).filter(file => file.fieldname === 'lessonCovers');

    console.log('文件',files);

    console.log('课程信息',body.course, body.lessons);
    console.log('封面图',coverImage);
    console.log('视频文件',videos)

    const lessonsData = JSON.parse(body.lessons); // 解析课时信息

    // 1. 基础校验
    if (!body.course) throw new BadRequestException('课程基础信息不能为空');
    if (lessonsData.length !== videos.length) throw new BadRequestException('课时数量必须和视频文件数量一致');
    if (lessonsData.length !== videos.length || videos.length !== lessonCovers.length) {
      throw new BadRequestException('课时数量、视频数量、封面数量必须一致');
    }


    // 2. 处理封面图路径
    let coverImageUrl = '';
    if (coverImage) {
      coverImageUrl = `/uploads/course-covers/${coverImage.filename}`; // 封面图访问路径
    }
    // 组合「视频 + 封面」为一个数组，传给 Service
    const lessonFiles = videos.map((video, index) => ({
      videoFile: video,
      coverFile: lessonCovers[index], // 按索引一一对应
    }));

    // 3. 补充封面图路径到课程信息
    const courseData = {
      ...JSON.parse(body.course), // 解析JSON字符串
      coverImageUrl,
    };

    // 4. 调用服务层
    return this.courseService.createCourse(courseData, lessonsData, lessonFiles);
  }

  // 新增：获取所有课程基础信息（无分页）
  @Get('list/all')
  async getAllCourses() {
    return this.courseService.getAllCourses();
  }

  // 获取课程详情（基础信息+学习进度）
  @Get(':courseId/detail')
  async getCourseDetail(
    @Param('courseId') courseId: string,
    @Request() req
  ) {
    // 校验courseId为数字
    if (isNaN(Number(courseId))) {
      throw new BadRequestException('课程ID必须为数字');
    }
    return this.courseService.getCourseDetail(Number(courseId), req.user.id);
  }

  // 获取课程课时列表（含视频资源）
  @Get(':courseId/lessons')
  async getCourseLessons(@Param('courseId') courseId: string) {
    if (isNaN(Number(courseId))) {
      throw new BadRequestException('课程ID必须为数字');
    }
    return this.courseService.getCourseLessons(Number(courseId));
  }

  @Get('list/admin')
  @UseGuards(AdminGuard)
  async findAllForAdmin() {
    return this.courseService.findAllForAdmin();
  }

  // -------------------------------------------------------------------------
  // ✅ 新增：封禁课程
  // -------------------------------------------------------------------------
  @Post(':id/ban')
  @UseGuards(AdminGuard)
  async banCourse(@Param('id') id: number) {
    return this.courseService.banCourse(id);
  }

  // -------------------------------------------------------------------------
  // ✅ 新增：解封课程
  // -------------------------------------------------------------------------
  @Post(':id/unban')
  @UseGuards(AdminGuard)
  async unbanCourse(@Param('id') id: number) {
    return this.courseService.unbanCourse(id);
  }

  @Get('banned/count')
  @UseGuards(AdminGuard)
  async getBannedCount() {
    return this.courseService.getBannedCount();
  }
}