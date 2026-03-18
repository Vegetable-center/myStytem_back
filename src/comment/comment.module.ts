// src/modules/comment/comment.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { PostComment } from './entities/comment.entity';
import { Content } from '../content/entities/content.entity';
import { User } from '../user/entities/user.entity'; // 需导入用户实体

@Module({
  imports: [TypeOrmModule.forFeature([PostComment, Content, User])],
  controllers: [CommentController],
  providers: [CommentService],
})
export class CommentModule {}