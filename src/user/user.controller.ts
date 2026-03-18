
import { Controller, Post, Get, Body, HttpCode, HttpStatus, Request, Param, BadRequestException } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateDto } from './dto/update.dto';
import { ResponseDto } from '../common/dto/response.dto';
import { Public } from '../common/decorators/public.decorators'; // 公共装饰器

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

  // 修改用户信息接口
  @Post('profile')
  async updateProfile(
    @Request() req, // req.user 由 JWT 守卫解析，包含当前用户ID
    @Body() updateDto: UpdateDto,
  ) {
    // req.user.id 是登录用户的ID（JWT 解析后挂载）
    return this.userService.updateUser(req.user.id, updateDto);
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

}
