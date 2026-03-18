// src/modules/like/like.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { UserPostLike } from './entities/like.entity';
import { LikeListVO } from './dto/like-list.vo';
import { Content } from '../content/entities/content.entity'; // 导入帖子实体
import { ResponseDto } from 'src/common/dto/response.dto';

@Injectable()
export class LikeService {
  constructor(
    @InjectRepository(UserPostLike)
    private readonly likeRepository: Repository<UserPostLike>,
    @InjectRepository(Content)
    private readonly postRepository: Repository<Content>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 1. 点赞/取消点赞（原子操作，保证数据一致）
   * @param userId 当前登录用户ID
   * @param postId 帖子ID
   * @param action like=点赞，cancel=取消
   */
  async toggleLike(userId: number, postId: number, action: 'like' | 'cancel') {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 校验帖子是否存在
      const post = await queryRunner.manager.findOne(Content, { where: { id: postId } });
      if (!post) throw new NotFoundException('帖子不存在');

      if (action === 'like') {
        // 检查是否已点赞（避免重复）
        const exists = await queryRunner.manager.findOne(UserPostLike, {
          where: { userId, postId },
        });
        if (exists) throw new BadRequestException('已点赞，无需重复操作');

        // 新增点赞记录
        const likeRecord = new UserPostLike();
        likeRecord.userId = userId;
        likeRecord.postId = postId;
        await queryRunner.manager.save(likeRecord);

        // 原子更新帖子点赞数（+1）
        await queryRunner.manager
          .createQueryBuilder()
          .update(Content)
          .set({ likeCount: () => 'likeCount + 1' })
          .where('id = :id', { id: postId })
          .execute();
      } else {
        // 取消点赞：删除点赞记录
        const likeRecord = await queryRunner.manager.findOne(UserPostLike, {
          where: { userId, postId },
        });
        if (!likeRecord) throw new BadRequestException('未点赞，无法取消');

        await queryRunner.manager.remove(likeRecord);

        // 原子更新帖子点赞数（-1，保证≥0）
        await queryRunner.manager
          .createQueryBuilder()
          .update(Content)
          .set({ likeCount: () => 'CASE WHEN likeCount > 0 THEN likeCount - 1 ELSE 0 END' })
          .where('id = :id', { id: postId })
          .execute();
      }

      await queryRunner.commitTransaction();
      return new ResponseDto(
        200,
        `${action === 'like' ? '点赞' : '取消点赞'}成功`,
        { 
          postId,
          ikeCount: action === 'like' ? post.likeCount + 1 : Math.max(0, post.likeCount - 1)  
        }
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 2. 查询当前用户的点赞列表（分页）
   * @param userId 当前登录用户ID
   * @param page 页码
   * @param limit 每页条数
   */
  /**
 * 2. 查询当前用户的点赞列表（无分页，返回所有）
 * @param userId 当前登录用户ID
 */
async getLikedList(userId: number) {
  // 联表查询：点赞记录 + 帖子信息（移除分页相关的 skip/take）
  const likeRecords = await this.likeRepository
    .createQueryBuilder('like')
    // 联表查询帖子表，获取帖子详情
    .leftJoinAndSelect('like.post', 'post', 'post.id = like.postId')
    .where('like.userId = :userId', { userId })
    .orderBy('like.createdAt', 'DESC') // 仍保留按点赞时间倒序
    .getMany(); // 改用 getMany()，返回所有匹配的记录（无分页）

  // 格式化返回数据（逻辑不变）
  const list = likeRecords.map((record: any) => ({
    postId: record.postId,
    title: record.post.title,
    coverImage: record.post.coverImage,
    category: record.post.category,
    createdAt: record.post.createdAt,
    likeTime: record.createdAt,
  }));

  // 调整返回结构：total 为列表总长度，page/limit 置为 null 或省略（根据你的VO定义）
  return new ResponseDto(200,'获取点赞列表成功',{ list,total: list.length });
}

  /**
   * 3. 检查用户是否给某帖子点赞（供前端标记状态）
   * @param userId 当前登录用户ID
   * @param postId 帖子ID
   */
  async checkIsLiked(userId: number, postId: number) {
    const exists = await this.likeRepository.exists({
      where: { userId, postId },
    });
    return new ResponseDto(200,'获取点赞状态成功',{ isLiked: exists });
  }
}