// src/modules/post/post.controller.ts
import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards, Request, BadRequestException, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { ContentService } from './content.service';
import { CreateContentDto } from './dto/content-create.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guards';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'fs';
import { AdminGuard } from 'src/common/guards/admin.guards';

// 帖子封面存储目录
const POST_COVER_DIR = join(process.cwd(), 'uploads/post-covers');
// 确保目录存在
if (!existsSync(POST_COVER_DIR)) {
  mkdirSync(POST_COVER_DIR, { recursive: true });
}

@Controller('content')
@UseGuards(JwtAuthGuard)
export class ContentController {
  constructor(private readonly postService: ContentService) {}

  // 创建帖子
  
  @Post('create')
  @UseInterceptors(FileInterceptor('coverImage', {
    storage: diskStorage({
      destination: POST_COVER_DIR,
      filename: (req, file, cb) => {
        // 生成唯一文件名：post-时间戳-随机数.后缀
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        const filename = `post-${uniqueSuffix}${ext}`;
        cb(null, filename);
      },
    }),
    // 文件校验：仅允许图片，最大5MB
    fileFilter: (req, file, cb) => {
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('仅支持JPG/PNG/WebP/GIF格式封面图'), false);
      }
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  }))
  async create(
    @Req() req,
    @Body() createPostDto: CreateContentDto,
    @UploadedFile() coverImage?: Express.Multer.File, // 封面图文件（可选）
  ) {
    const userId = req.user.id;
  
    // ✅ 关键：如果上传了封面图，把访问路径赋值给 DTO
    if (coverImage) {
      createPostDto.coverImage = `/uploads/post-covers/${coverImage.filename}`;
    }
  
    // 调用 Service 层创建帖子
    return this.postService.create(userId, createPostDto);
  }

  // 获取帖子列表
  @Get('list')
  findAll(){
    return this.postService.findAll();
  }

  // 根据id获取帖子详情
  @Get('list/:id')
  findOne(@Param('id') id: string) {
    return this.postService.getContentById(+id);
  }

  // 根据id获取同类型帖子列表
  @Get('list/same/:id')
  findSame(@Param('id') id: string) {
    return this.postService.getContentByCategory(+id);
  }

  // 点赞接口
  @Post(':id/like/:type')
  changeLikeNum(@Param('id') id: string, @Param('type') type: string){
    const postId = Number(id);
    if(isNaN(postId)) throw new BadRequestException('id参数错误');
    
    return this.postService.updateLikeCount(postId, type);
  }
  // 管理员获取帖子列表
  @Get('admin')
  @UseGuards(AdminGuard)
  async findAllAdmin(){
    return this.postService.findAllAdmin();
  }

  // 根据id获取帖子详情
  @UseGuards(AdminGuard)
  @Get('list/:id/admin')
  findOneAdmin(@Param('id') id: string) {
    return this.postService.getContentByIdAdmin(+id);
  }

  @Post(':id/ban')
  @UseGuards(AdminGuard)
  // @UseGuards(JwtAuthGuard, AdminGuard) // 可选：加上管理员守卫
  async banPost(@Param('id') id: string) {
    await this.postService.banPost(+id);
    return {
      code: 200,
      message: '帖子封禁成功',
    };
  }

  // ✅ 新增：解封帖子
  @Post(':id/unban')
  @UseGuards(AdminGuard)
  // @UseGuards(JwtAuthGuard, AdminGuard) // 可选：加上管理员守卫
  async unbanPost(@Param('id') id: string) {
    await this.postService.unbanPost(+id);
    return {
      code: 200,
      message: '帖子解封成功',
    };
  }

  @Get('banned/count')
  @UseGuards(AdminGuard)
  async getBannedCount() {
    return this.postService.getBannedCount();
  }

}
