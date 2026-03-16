// src/common/guards/jwt-auth.guard.ts （移到公共目录，供全局使用）
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { RedisBlacklistService } from '../module/redis/redis-blacklist.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // 注入 Reflector 用于读取装饰器元数据
  constructor(
    private reflector: Reflector,
    private redisBlacklistService: RedisBlacklistService, // 注入黑名单服务
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. 检查是否为公开接口（如登录/注册），公开接口直接放行
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    // 2. 提取请求头中的 Token
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('请先登录');
    }
    const token = authHeader.split(' ')[1];

    // 3. 核心：检查 Token 是否在黑名单（已退出登录）
    const isBlacklisted = await this.redisBlacklistService.isTokenInBlacklist(token);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token 已失效（已退出登录）');
    }

    // 4. 执行常规 JWT 校验
    return super.canActivate(context) as Promise<boolean>;
  }
}