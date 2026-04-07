import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { JwtAuthGuard } from './common/guards/jwt.guards'; // 公共守卫
import { RedisBlacklistService } from './common/module/redis/redis-blacklist.service';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { VIDEO_STORAGE_DIR, COVER_IMAGE_STORAGE_DIR } from './config/file-upload.config'; // 新增封面图目录

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(cookieParser());

  // 启用CORS以允许跨域访问
  app.enableCors({
    origin: true, // 允许所有来源
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  // 启用全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // 自动移除未在DTO中定义的属性
    transform: true, // 自动转换类型
  }));
  // 2. 全局序列化（隐藏密码）
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  // 3. 全局 JWT 守卫（核心：所有接口默认需要认证）
  // 修正：从 Nest 容器中获取所有依赖，再创建守卫实例
  const reflector = app.get(Reflector);
  const redisBlacklistService = app.get(RedisBlacklistService);
  app.useGlobalGuards(new JwtAuthGuard(reflector, redisBlacklistService));

  // 配置静态文件目录：uploads 文件夹
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/', // 访问前缀：http://localhost:3000/uploads/xxx.rtf
  });

  // 视频静态资源（原有）
  app.useStaticAssets(VIDEO_STORAGE_DIR, { prefix: '/uploads/course-videos/' });
  // 新增：封面图静态资源
  app.useStaticAssets(COVER_IMAGE_STORAGE_DIR, { prefix: '/uploads/course-covers/' });


  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
