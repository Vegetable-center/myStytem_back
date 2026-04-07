
import { Controller, Post, Get, Body, HttpCode, HttpStatus, Request, Param, BadRequestException, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateDto } from './dto/update.dto';
import { ResponseDto } from '../common/dto/response.dto';
import { Public } from '../common/decorators/public.decorators'; // 公共装饰器
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from './enum';
import { AdminGuard } from 'src/common/guards/admin.guards';

// 头像存储目录
const AVATAR_STORAGE_DIR = join(process.cwd(), 'uploads/avatars');
// 确保目录存在
if (!existsSync(AVATAR_STORAGE_DIR)) {
  mkdirSync(AVATAR_STORAGE_DIR, { recursive: true });
}

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  @Public() // 标记为公开
  async register(@Body() registerDto: RegisterDto): Promise<ResponseDto> {
    return this.userService.register(registerDto);
  }

  @Post('login')
  @Public() // 标记为公开
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<ResponseDto> {
    return this.userService.login(loginDto);
  }

  // 【新增】退出登录接口（需要登录才能访问）
  @Post('logout')
  logout(@Request() req) {
    // 从请求头提取 Token（Bearer xxx.xxx.xxx）
    const token = req.headers.authorization.split(' ')[1];
    return this.userService.logout(token);
  }

  // 获取当前用户信息接
  @Get('profile')
  async getProfile(@Request() req) {
    return this.userService.findUserById(req.user.id);
  }
  
  // 获取当前用户详细信息
  @Get('userInfo/:userId')
  async getUserInfo(@Param('userId') userIdStr: string) {
    const userId = Number(userIdStr);
    if (isNaN(userId)) throw new BadRequestException('用户ID无效');
    const userInfo = await this.userService.getUserInfo(userId);
    return { code: 200, message: '获取用户信息成功', data: userInfo };
  }

  // 2. 关注/取消关注用户
  @Post('follow')
  async toggleFollow(
    @Body() body: { targetUserId: number; action: 'follow' | 'unfollow' },
    @Request() req,
  ) {
    const { targetUserId, action } = body;
    if (!targetUserId || isNaN(targetUserId)) throw new BadRequestException('目标用户ID无效');
    if (!['follow', 'unfollow'].includes(action)) throw new BadRequestException('操作类型无效');
    return this.userService.toggleFollow(req.user.id, targetUserId, action);
  }
  // 修改用户信息接口
  @Post('profile/:id')
  @UseInterceptors(FileInterceptor('avatar', {
    storage: diskStorage({
      destination: AVATAR_STORAGE_DIR,
      filename: (req, file, cb) => {
        // 生成唯一文件名：user-用户ID-时间戳.后缀
        const userId = req.params.id;
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        const filename = `user-${userId}-${uniqueSuffix}${ext}`;
        cb(null, filename);
      },
    }),
    // 限制文件类型和大小
    fileFilter: (req, file, cb) => {
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('仅支持JPG/PNG/WebP/GIF格式头像'), false);
      }
    },
    limits: { fileSize: 2 * 1024 * 1024 }, // 头像最大2MB
  }))
  async updateUser(
    @Param('id') userId: string,
    @Body() updateUserDto: UpdateDto, // 原有用户信息DTO
    @UploadedFile() avatar?: Express.Multer.File, // 头像文件（可选）
  ) {
      // 1. 处理头像路径（如果上传了头像）
      let avatarUrl = '';
      if (avatar) {
        // 生成头像访问路径（和前端代理一致）
        avatarUrl = `/uploads/avatars/${avatar.filename}`;
        // 把头像路径补充到更新DTO中
        updateUserDto.avatar = avatarUrl;
      } 

      // 2. 调用服务层更新
      return this.userService.updateUser(+userId, updateUserDto);
    }

  @Get('admin/all')
  @UseGuards(AdminGuard)
  async findAllForAdmin() {
    return this.userService.findAllForAdmin();
  }

  // -------------------------------------------------------------------------
  // ✅ 新增：封禁用户
  // -------------------------------------------------------------------------
  @Post(':id/ban')
  @UseGuards(AdminGuard)
  async banUser(@Param('id') id: number) {
    return this.userService.banUser(id);
  }

  // -------------------------------------------------------------------------
  // ✅ 新增：解封用户
  // -------------------------------------------------------------------------
  @Post(':id/unban')
  @UseGuards(AdminGuard)
  async unbanUser(@Param('id') id: number) {
    return this.userService.unbanUser(id);
  }

  // -------------------------------------------------------------------------
  // ✅ 新增：设置用户角色
  // -------------------------------------------------------------------------
  @Post(':id/role')
  @UseGuards(AdminGuard)
  async setUserRole(
    @Param('id') id: number,
    @Body('role') role: UserRole,
  ) {
    return this.userService.setUserRole(id, role);
  }
  
  @Get('banned/count')
  @UseGuards(AdminGuard)
  async getBannedCount() {
    return this.userService.getBannedCount();
  }
}
