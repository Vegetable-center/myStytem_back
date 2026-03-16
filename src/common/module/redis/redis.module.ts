// src/common/modules/redis/redis.module.ts
import { Module, Global } from '@nestjs/common';
import { RedisModule } from '@nestjs-modules/ioredis';
import { RedisBlacklistService } from './redis-blacklist.service';

// 全局模块，所有模块可直接使用，无需重复导入
@Global()
@Module({
  imports: [
    // 配置 Redis 连接（本地 Redis 默认配置，按需修改）
    RedisModule.forRoot({
      type: 'single',
      url: 'redis://localhost:6379', // Redis 地址
      options: {
        db: 0, // 使用第0个数据库
        keyPrefix: 'nest_jwt_', // 键前缀，避免冲突
      },
    }),
  ],
  providers: [RedisBlacklistService],
  exports: [RedisBlacklistService], // 导出黑名单服务供其他模块使用
})
export class RedisUseModule {}