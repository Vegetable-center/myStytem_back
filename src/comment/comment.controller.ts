// src/modules/comment/comment.controller.ts
import { Controller, Post, Get, Body, Param, Request, UseGuards, BadRequestException } from '@nestjs/common';
import { CommentService } from './comment.service';
import { JwtAuthGuard } from '../common/guards/jwt.guards'; // 登录守卫

@Controller('comment')
@UseGuards(JwtAuthGuard) // 评论需登录
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  // 1. 新增评论/回复：POST /comment
  @Post('create')
  async createComment(
    @Body() body: { 
      postId: number; 
      content: string; 
      replyCommentId?: number | null; 
      replyToUserId?: number | null 
    },
    @Request() req,
  ) {
    const { postId, content, replyCommentId = null, replyToUserId = null } = body;
    
    // 基础参数校验
    if (!postId || isNaN(postId)) throw new BadRequestException('帖子ID无效');
    
    return this.commentService.createComment(
      req.user.id, 
      postId, 
      content, 
      replyCommentId, 
      replyToUserId
    );
  }

  // 2. 查询帖子下所有评论：GET /comment/post/:postId
  @Get('post/:postId')
  async getPostComments(@Param('postId') postIdStr: string) {
    const postId = Number(postIdStr);
    if (isNaN(postId)) throw new BadRequestException('帖子ID无效');
    
    return this.commentService.getPostComments(postId);
  }
}