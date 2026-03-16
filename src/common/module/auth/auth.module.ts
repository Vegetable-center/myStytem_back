// src/common/modules/auth/auth.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategies';
import { UserModule } from '../../../user/user.module';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../../constant/jwt.constant';

/**
 * 认证公共模块：封装 JWT 相关配置，供全项目复用
 */
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }), // 默认 JWT 策略
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: JWT_EXPIRES_IN },
    }),
    forwardRef(() => UserModule),
  ],
  providers: [JwtStrategy],
  exports: [JwtModule, PassportModule], // 导出供其他模块使用
})
export class AuthModule {}