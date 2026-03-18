// src/modules/comment/comment.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostComment } from './entities/comment.entity';
import { Content } from '../content/entities/content.entity'; // 帖子实体
import { CommentVO, PostCommentListVO } from './dto/comment.vo';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(PostComment)
    private readonly commentRepository: Repository<PostComment>,
    @InjectRepository(Content)
    private readonly postRepository: Repository<Content>,
  ) {}

  /**
   * 1. 新增评论/回复（所有评论都push到表中，仅记录回复关系）
   * @param userId 当前登录用户ID
   * @param postId 帖子ID
   * @param content 评论内容
   * @param replyCommentId 回复的目标评论ID（null=普通评论）
   * @param replyToUserId 回复的目标用户ID（null=普通评论）
   */
  async createComment(
    userId: number,
    postId: number,
    content: string,
    replyCommentId: number | null = null,
    replyToUserId: number | null = null,
  ) {
    // 1. 校验帖子是否存在
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('帖子不存在');

    // 2. 校验评论内容
    if (!content.trim()) throw new BadRequestException('评论内容不能为空');

    // 3. 校验回复的目标评论是否存在（如果是回复）
    if (replyCommentId) {
      const targetComment = await this.commentRepository.findOne({ where: { id: replyCommentId } });
      if (!targetComment) throw new BadRequestException('回复的评论不存在');
    }

    // 4. 创建评论（直接push到数据表）
    const comment = new PostComment();
    comment.postId = postId;
    comment.userId = userId;
    comment.content = content.trim();
    comment.replyCommentId = replyCommentId;
    comment.replyToUserId = replyToUserId;

    await this.commentRepository.save(comment);

    return {
      code: 200,
      message: '评论成功',
      data: { commentId: comment.id },
    };
  }

  /**
   * 2. 查询帖子下所有评论（平铺展示，按时间正序）
   * @param postId 帖子ID
   */
  async getPostComments(postId: number): Promise<{ code: number; data: PostCommentListVO }> {
    // 查询该帖子下所有评论，联表获取用户信息
    const [allComments, total] = await this.commentRepository
      .createQueryBuilder('comment')
      // 联表查询评论者信息
      .leftJoinAndSelect('comment.user', 'user', 'user.id = comment.userId')
      // 联表查询回复的目标用户信息
      .leftJoinAndSelect('comment.replyToUser', 'replyToUser', 'replyToUser.id = comment.replyToUserId')
      .where('comment.postId = :postId', { postId })
      .orderBy('comment.createdAt', 'ASC') // 按评论时间正序（先评论的在前）
      .getManyAndCount();

    // 格式化数据（平铺，只标注回复关系）
    const list: CommentVO[] = allComments.map(comment => ({
      id: comment.id,
      postId: comment.postId,
      content: comment.content,
      createdAt: comment.createdAt,
      replyCommentId: comment.replyCommentId,
      user: {
        id: comment.user.id,
        userName: comment.user.username,
        avatar: comment.user.avatar || '', // 兜底：无头像置空
      },
      // 有回复目标用户才返回
      ...(comment.replyToUser && {
        replyToUser: {
          id: comment.replyToUser.id,
          username: comment.replyToUser.username,
        },
      }),
    }));

    return {
      code: 200,
      data: {
        list,
        total,
      },
    };
  }
}