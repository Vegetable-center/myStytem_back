
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResponseDto } from '../common/dto/response.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RedisBlacklistService } from '../common/module/redis/redis-blacklist.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly redisBlacklistService: RedisBlacklistService, // 注入黑名单服务
  ) {}

  async register(registerDto: RegisterDto): Promise<ResponseDto> {
    // 检查用户名是否已存在
    const existingUser = await this.userRepository.findOne({
      where: { username: registerDto.username },
    });
    
    if (existingUser) {
      return new ResponseDto(400, '用户名已存在');
    }

    // 检查邮箱是否已存在
    const existingEmail = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });
    
    if (existingEmail) {
      return new ResponseDto(400, '邮箱已被注册');
    }

    // 密码加密（加盐）
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(registerDto.password, salt);

    // 创建用户
    const newUser = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    await this.userRepository.save(newUser);
    
    return new ResponseDto(200, '注册成功', { userId: newUser.id });
  }

  async login(loginDto: LoginDto): Promise<ResponseDto> {
    // 查找用户
    const user = await this.userRepository.findOne({
      where: { username: loginDto.username },
    });
    
    if (!user) {
      return new ResponseDto(401, '用户名或密码错误');
    }
    
    // 验证密码
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new ResponseDto(401, '用户名或密码错误');
    }

    // 生成 JWT Token（包含用户 ID/用户名）
    const token = this.jwtService.sign({
      sub: user.id, // JWT 标准字段：subject（用户ID）
      username: user.username,
    });
    
    return new ResponseDto(200, '登录成功', { userId: user.id, username: user.username, token: token });
  }

  // 【新增】退出登录核心逻辑
  async logout(token: string) {
    try {
      // 1. 验证 Token 有效性（避免无效 Token 加入黑名单）
      const decodedToken = this.jwtService.verify(token);
      
      // 2. 计算 Token 剩余过期时间（秒）
      const now = Math.floor(Date.now() / 1000); // 当前时间戳（秒）
      const expireSeconds = decodedToken.exp - now; // 剩余有效期

      // 3. 剩余时间>0 时，将 Token 加入黑名单
      if (expireSeconds > 0) {
        await this.redisBlacklistService.addTokenToBlacklist(token, expireSeconds);
      }

      return { code: 200, message: '退出登录成功' };
    } catch (error) {
      // Token 已过期/无效，直接返回成功（无需加入黑名单）
      if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
        return { code: 200, message: '退出登录成功' };
      }
      throw new UnauthorizedException('退出登录失败：Token 无效');
    }
  }

  // 3. 根据用户名查找用户（供守卫鉴权使用）
  async findByUsername(username: string) {
    return await this.userRepository.findOne({ where: { username } });
  }
}
