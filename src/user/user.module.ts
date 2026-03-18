
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { UserFollow } from './entities/user-follow.entity';
import { Content } from '../content/entities/content.entity';
import { AuthModule } from '../common/module/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserFollow, Content]),
    AuthModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService], // 导出供 JWT 策略使用
})
export class UserModule {}
