import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { DialectModule } from './dialect/dialect.module';
import { ContentModule } from './content/content.module';
import { LikeModule } from './like/like.module';
import { CommentModule } from './comment/comment.module';
import { PointsModule } from './point/point.module';
import { CheckinModule } from './checkin/checkin.module';
import { MallModule } from './mall/mall.module';
import { CourseModule } from './course/course.module';
import { MessageModule } from './message/message.module';
import { AuthModule } from './common/module/auth/auth.module';
import { RedisUseModule } from './common/module/redis/redis.module'; // 导入 Redis 模块

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'caixin2580', // 请替换为你的MySQL密码
      database: 'langauge_platform', // 请替换为你的数据库名
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // 开发环境可以设为true，生产环境建议设为false
    }),
    RedisUseModule, // 全局 Redis 模块（关键）
    // 2. 公共认证模块
    AuthModule,
    UserModule,
    DialectModule,
    LikeModule,
    CommentModule,
    PointsModule,
    CheckinModule,
    MallModule,
    CourseModule,
    MessageModule,
    ContentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
