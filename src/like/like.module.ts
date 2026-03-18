// src/modules/like/like.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LikeService } from './like.service';
import { LikeController } from './like.controller';
import { UserPostLike } from './entities/like.entity';
import { Content } from '../content/entities/content.entity'; // 导入帖子实体

@Module({
  imports: [TypeOrmModule.forFeature([UserPostLike, Content])],
  controllers: [LikeController],
  providers: [LikeService],
})
export class LikeModule {}