
import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateDto } from './dto/update.dto'
import { UserFollow } from './entities/user-follow.entity';
import { Content } from '../content/entities/content.entity';
import { ContentItemVO } from 'src/content/dto/content.vo';
import { SimpleUserVO } from './dto/user-info.vo';
import { ResponseDto } from '../common/dto/response.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RedisBlacklistService } from '../common/module/redis/redis-blacklist.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserFollow)
    private readonly followRepository: Repository<UserFollow>,
    @InjectRepository(Content)
    private readonly postRepository: Repository<Content>,
    private readonly jwtService: JwtService,
    private readonly redisBlacklistService: RedisBlacklistService, // 注入黑名单服务
  ) {}

  async register(registerDto: RegisterDto): Promise<ResponseDto> {
    // 检查用户名是否已存在
    const existingUser = await this.userRepository.findOne({
      where: { username: registerDto.username },
    });
    
    if (existingUser) {
      return new ResponseDto(400, '用户名已存在');
    }

    // 检查邮箱是否已存在
    const existingEmail = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });
    
    if (existingEmail) {
      return new ResponseDto(400, '邮箱已被注册');
    }

    // 密码加密（加盐）
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(registerDto.password, salt);

    // 创建用户
    const newUser = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    await this.userRepository.save(newUser);
    
    return new ResponseDto(200, '注册成功', { userId: newUser.id });
  }

  async login(loginDto: LoginDto): Promise<ResponseDto> {
    // 查找用户
    const user = await this.userRepository.findOne({
      where: { username: loginDto.username },
    });
    
    if (!user) {
      return new ResponseDto(401, '用户名或密码错误');
    }
    
    // 验证密码
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new ResponseDto(401, '用户名或密码错误');
    }

    // 生成 JWT Token（包含用户 ID/用户名）
    const token = this.jwtService.sign({
      sub: user.id, // JWT 标准字段：subject（用户ID）
      username: user.username,
    });
    
    return new ResponseDto(200, '登录成功', { userId: user.id, username: user.username, token: token });
  }

  // 【新增】退出登录核心逻辑
  async logout(token: string) {
    try {
      // 1. 验证 Token 有效性（避免无效 Token 加入黑名单）
      const decodedToken = this.jwtService.verify(token);
      
      // 2. 计算 Token 剩余过期时间（秒）
      const now = Math.floor(Date.now() / 1000); // 当前时间戳（秒）
      const expireSeconds = decodedToken.exp - now; // 剩余有效期

      // 3. 剩余时间>0 时，将 Token 加入黑名单
      if (expireSeconds > 0) {
        await this.redisBlacklistService.addTokenToBlacklist(token, expireSeconds);
      }

      return { code: 200, message: '退出登录成功' };
    } catch (error) {
      // Token 已过期/无效，直接返回成功（无需加入黑名单）
      if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
        return { code: 200, message: '退出登录成功' };
      }
      throw new UnauthorizedException('退出登录失败：Token 无效');
    }
  }

  // 修改用户信息
  async updateUser(userId: number, updateUserDto: UpdateDto) {
    // 1. 检查用户是否存在
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 2. 合并更新字段（仅更新DTO中传入的字段）
    Object.assign(user, updateUserDto);

    // 3. 保存更新
    const data = await this.userRepository.save(user);
    return new ResponseDto(200, '获取用户信息成功', { ...data });
  }
  // 根据id查用户信息
  async findUserById(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    // 隐藏密码字段（返回给前端时不要暴露）
    const { password, ...userInfo } = user;
    return new ResponseDto(200, '获取用户信息成功', { ...userInfo });
  }

  // 查询用户的详细信息
  async getUserInfo(userId: number) {
    // 1. 查询用户基本信息
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'username', 'avatar', 'signature', 'createdAt'],
    });
    if (!user) throw new NotFoundException('用户不存在');

    // 2. 查询该用户发布的帖子（复用你已有的帖子查询逻辑）
    const userPosts = await this.postRepository
      .createQueryBuilder('post')
      .leftJoin('post.user', 'user') // 关联用户表（获取用户名/头像）
      .select([
        'post.id',
        'post.title',
        'post.content',
        'post.category',
        'post.coverImage',
        'post.viewCount',
        'post.likeCount',
        'post.commentCount',
        'post.createdAt',
        'post.updatedAt',
        'user.id',
        'user.username',
        'user.avatar',
      ])
      .where('post.userId = :userId', { userId })
      .orderBy('post.createdAt', 'DESC')
      .getMany();
    // 格式化帖子数据（和你原有逻辑一致）
    const posts: ContentItemVO[] = userPosts.map(post => ({
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

    // 3. 查询用户关注的人（followings）
    // 步骤1：查询关注关联记录
    const followRecords = await this.followRepository.find({
      where: { userId },
      select: ['followedUserId'],
    });
    // 步骤2：提取被关注的用户ID列表
    const followedUserIds = followRecords.map(record => record.followedUserId);
    // 步骤3：查询这些用户的基本信息
    const followings: SimpleUserVO[] = followedUserIds.length
      ? await this.userRepository
          .createQueryBuilder('user')
          .select(['user.id', 'user.username', 'user.avatar', 'user.nickname'])
          .where('user.id IN (:...ids)', { ids: followedUserIds })
          .getMany()
      : [];

    // 4. 查询用户的粉丝（followers）
    // 步骤1：查询所有关注当前用户的关联记录
    const followerRecords = await this.followRepository.find({
      where: { followedUserId: userId },
      select: ['userId'],
    });
    // 步骤2：提取粉丝的用户ID列表
    const followerUserIds = followerRecords.map(record => record.userId);
    // 步骤3：查询粉丝的基本信息
    const followers: SimpleUserVO[] = followerUserIds.length
      ? await this.userRepository
          .createQueryBuilder('user')
          .select(['user.id', 'user.username', 'user.avatar', 'user.nickname'])
          .where('user.id IN (:...ids)', { ids: followerUserIds })
          .getMany()
      : [];

    // 组装最终返回数据
    return {
      id: user.id,
      userName: user.username,
      avatar: user.avatar,
      signature: user.signature,
      createdAt: user.createdAt,
      posts,
      followings,
      followers,
    };
  }

  /**
   * 可选：关注/取消关注用户
   * @param currentUserId 当前操作的用户ID
   * @param targetUserId 要关注/取消的用户ID
   * @param action follow=关注，unfollow=取消
   */
  async toggleFollow(currentUserId: number, targetUserId: number, action: 'follow' | 'unfollow') {
    // 禁止关注自己
    if (currentUserId === targetUserId) throw new Error('不能关注自己');

    if (action === 'follow') {
      // 检查是否已关注
      const exists = await this.followRepository.findOne({
        where: { userId: currentUserId, followedUserId: targetUserId },
      });
      if (exists) throw new Error('已关注该用户');

      // 创建关注记录
      const follow = new UserFollow();
      follow.userId = currentUserId;
      follow.followedUserId = targetUserId;
      await this.followRepository.save(follow);
      return { code: 200, message: '关注成功' };
    } else {
      // 取消关注：删除关联记录
      await this.followRepository.delete({
        userId: currentUserId,
        followedUserId: targetUserId,
      });
      return { code: 200, message: '取消关注成功' };
    }
  }

  // 根据用户名查找用户（供守卫鉴权使用）
  async findByUsername(username: string) {
    return await this.userRepository.findOne({ where: { username } });
  }
}
