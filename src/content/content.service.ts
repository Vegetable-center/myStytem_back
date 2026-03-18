// src/modules/post/post.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Content } from './entities/content.entity';
import { ContentAllVO, ContentItemVO } from './dto/content.vo';
import { CreateContentDto } from './dto/content-create.dto';
import { ResponseDto } from 'src/common/dto/response.dto';


@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Content)
    private readonly postRepository: Repository<Content>,
  ) {}

  // 1. 创建帖子
  async create(userId: number, createPostDto: CreateContentDto) {
    const post = this.postRepository.create({
      ...createPostDto,
      userId,
    });
    return await this.postRepository.save(post);
  }

  // 2. 获取所有帖子
  async findAll() {
    // 构建查询：关联用户表 + 筛选字段（排除userId）
    const posts = await this.postRepository
      .createQueryBuilder('content')
      .leftJoin('content.user', 'user') // 关联用户表
      .select([
        // 帖子所有字段（排除userId）
        'content.id',
        'content.title',
        'content.content',
        'content.category',
        'content.coverImage',
        'content.viewCount',
        'content.likeCount',
        'content.commentCount',
        'content.createdAt',
        'content.updatedAt',
        // 关联用户的字段
        'user.id',
        'user.username',
        'user.avatar',
      ])
      .orderBy('content.createdAt', 'DESC') // 可选：按发布时间倒序
      .getMany(); // 直接查询所有，无分页

    // 格式化数据（剔除userId，整合用户名/头像）
    const list: ContentItemVO[] = posts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      coverImage: post.coverImage,
      viewCount: post.viewCount,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      userId: post.user.id,
      userName: post.user.username,
      avatar: post.user.avatar,
    }));

    return new ResponseDto(200, '获取帖子列表成功', { list: list });
  }

  // 根据id获取帖子信息
  async getContentById(id: number){
    // 构建查询：关联用户表 + 筛选字段（排除userId）
    const post = await this.postRepository
      .createQueryBuilder('content')
      .leftJoin('content.user', 'user') // 关联用户表
      .select([
        // 帖子所有字段（排除userId）
        'content.id',
        'content.title',
        'content.content',
        'content.category',
        'content.coverImage',
        'content.viewCount',
        'content.likeCount',
        'content.commentCount',
        'content.createdAt',
        'content.updatedAt',
        // 关联用户的字段
        'user.id',
        'user.username',
        'user.avatar',
      ])
      .where('content.id = :id', { id })
      .orderBy('content.createdAt', 'DESC') // 可选：按发布时间倒序
      .getOne(); // 直接查询所有，无分页

    if(!post) {
        throw new NotFoundException('帖子不存在');
    }
    post.viewCount += 1;
    await this.postRepository.save(post);
    // 格式化数据（剔除userId，整合用户名/头像）
    const detail: ContentItemVO = {
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      coverImage: post.coverImage,
      viewCount: post.viewCount,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      userId: post.user.id,
      userName: post.user.username,
      avatar: post.user.avatar,
    };

    return new ResponseDto(200, '获取帖子详情成功', { detail });
  }

  // 获取同类型帖子列表
  async getContentByCategory(currentPostId: number) {
    // 第一步：先查询当前帖子的分类（category）
    const currentPost = await this.postRepository.findOne({
      where: { id: currentPostId },
      select: ['category'] // 只查分类字段，提升性能
    });

    // 校验当前帖子是否存在
    if (!currentPost) {
      return new ResponseDto(404, '当前帖子不存在', { list: [] });
    }

    // 构建查询：关联用户表 + 筛选字段（排除userId）
    const sameCategoryPosts = await this.postRepository
      .createQueryBuilder('content')
      .leftJoin('content.user', 'user') // 关联用户表
      .select([
        // 帖子所有字段（排除userId）
        'content.id',
        'content.title',
        'content.content',
        'content.category',
        'content.coverImage',
        'content.viewCount',
        'content.likeCount',
        'content.commentCount',
        'content.createdAt',
        'content.updatedAt',
        // 关联用户的字段
        'user.id',
        'user.username',
        'user.avatar',
      ])
      .where('content.category = :category', { category: currentPost.category })
      .andWhere('content.id != :currentId', { currentId: currentPostId })
      .orderBy('content.createdAt', 'DESC') // 可选：按发布时间倒序
      .getMany(); // 直接查询所有，无分页

    // 格式化数据（剔除userId，整合用户名/头像）
    const list: ContentItemVO[] = sameCategoryPosts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      coverImage: post.coverImage,
      viewCount: post.viewCount,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      userId: post.user.id,
      userName: post.user.username,
      avatar: post.user.avatar,
    }));

    return new ResponseDto(200, '获取同类型帖子列表成功', { list: list });
  }

  // 用户点赞和取消点赞
  async updateLikeCount(postId: number, action: string): Promise<ResponseDto> {
  // 1. 查帖子
  const post = await this.postRepository.findOne({ where: { id: postId } });
  if (!post) throw new NotFoundException('帖子不存在');

  // 2. 更新点赞数（前端保证不重复点赞/取消）
  if (action === 'like') {
    post.likeCount += 1;
  } else {
    post.likeCount = Math.max(0, post.likeCount - 1); // 防止负数
  }
  await this.postRepository.save(post);

  return new ResponseDto(200, `${action === 'like' ? '点赞' : '取消点赞'}成功`, { likeCount: post.likeCount });
}

}