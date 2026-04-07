// src/users/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../../../../user/user.service';
import { JWT_SECRET } from '../../../constant/jwt.constant';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // 从 Bearer Token 提取 JWT
      ignoreExpiration: false, // 不忽略 Token 过期
      secretOrKey: JWT_SECRET,
    });
  }

  // 验证 Token 有效后，解析 payload 并返回用户信息（供控制器使用）
  async validate(payload: any) {
    const user = await this.usersService.findByUsername(payload.username);
    if (!user) {
      throw new UnauthorizedException('Token 无效');
    }
    return { id: user.id, username: user.username, email: user.email, role: user.role, status: user.status };
  }
}