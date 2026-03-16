
import { Controller, Post, Body, HttpCode, HttpStatus, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
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
}
