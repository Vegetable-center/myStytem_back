// src/modules/like/like.controller.ts
import { Controller, Post, Delete, Get, Param, Query, Request, UseGuards, BadRequestException } from '@nestjs/common';
import { LikeService } from './like.service';
import { JwtAuthGuard } from '../common/guards/jwt.guards'; // 登录守卫

@Controller('like')
@UseGuards(JwtAuthGuard) // 所有接口需登录
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  // 1. 点赞接口：POST /like/:postId
  @Post(':postId')
  async likePost(@Param('postId') postIdStr: string, @Request() req) {
    const postId = Number(postIdStr);
    if (isNaN(postId)) throw new BadRequestException('帖子ID无效');
    return this.likeService.toggleLike(req.user.id, postId, 'like');
  }

  // 2. 取消点赞接口：DELETE /like/:postId
  @Delete(':postId')
  async cancelLike(@Param('postId') postIdStr: string, @Request() req) {
    const postId = Number(postIdStr);
    if (isNaN(postId)) throw new BadRequestException('帖子ID无效');
    return this.likeService.toggleLike(req.user.id, postId, 'cancel');
  }

  // 3. 查询点赞列表：GET /like/list
  @Get('list')
  async getLikedList(@Request() req) {
    return this.likeService.getLikedList(req.user.id);
  }

  // 4. 检查是否点赞：GET /like/check/:postId
  @Get('check/:postId')
  async checkIsLiked(@Param('postId') postIdStr: string, @Request() req) {
    const postId = Number(postIdStr);
    if (isNaN(postId)) throw new BadRequestException('帖子ID无效');
    return this.likeService.checkIsLiked(req.user.id, postId);
  }
}