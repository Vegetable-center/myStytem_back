// src/common/modules/redis/redis-blacklist.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';

@Injectable()
export class RedisBlacklistService {
  // 黑名单键前缀，区分其他 Redis 数据
  private readonly BLACKLIST_PREFIX = 'blacklist:';

  constructor(
    @InjectRedis() private readonly redisClient: Redis, // 注入 Redis 客户端
  ) {}

  /**
   * 将 Token 加入黑名单
   * @param token JWT Token
   * @param expireSeconds 过期时间（与 Token 有效期一致）
   */
  async addTokenToBlacklist(token: string, expireSeconds: number) {
    const key = `${this.BLACKLIST_PREFIX}${token}`;
    // 存入 Redis，值无意义（仅标记），过期后自动删除
    await this.redisClient.setex(key, expireSeconds, 'invalid');
  }

  /**
   * 检查 Token 是否在黑名单中
   * @param token JWT Token
   */
  async isTokenInBlacklist(token: string): Promise<boolean> {
    const key = `${this.BLACKLIST_PREFIX}${token}`;
    const result = await this.redisClient.get(key);
    return !!result; // 存在则返回 true（已退出登录）
  }
}