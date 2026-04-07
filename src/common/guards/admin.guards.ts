import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '../../user/enum'; // ✅ 导入你的用户角色枚举

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // 1. 从请求上下文中获取 request 对象
    const request = context.switchToHttp().getRequest();
    
    // 2. 获取 JWT 解析出来的用户信息
    const user = request.user;

    // 3. 校验用户是否登录（双重保险，JwtAuthGuard 已经做了，但这里加个兜底）
    if (!user) {
      throw new UnauthorizedException('请先登录');
    }

    console.log('user',user)
    // 4. 核心校验：判断用户角色是否为管理员
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('只有管理员可执行此操作');
    }

    // 5. 校验通过，放行
    return true;
  }
}