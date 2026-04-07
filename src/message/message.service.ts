import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { UserFollow } from '../user/entities/user-follow.entity'
import { User } from '../user/entities/user.entity';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    // ✅ 直接注入你现有的 user_follow 表
    @InjectRepository(UserFollow)
    private readonly userFollowRepository: Repository<UserFollow>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // ✅ 新增：获取当前用户关注的用户列表（含用户信息）
  async getFollowingListWithUserInfo(userId: number) {
  // 1. 查询当前用户的关注关系
    const followRelations = await this.userFollowRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  
    // 2. 提取被关注用户ID
    const followedUserIds = followRelations.map(item => item.followedUserId);
    if (followedUserIds.length === 0) return [];
  
    // 3. 批量查询用户信息（只返回必要字段）
    const followedUsers = await this.userRepository.find({
      where: { id: In(followedUserIds) },
      select: ['id', 'username', 'avatar'],
    });
  
    // 4. 组装返回数据：为每个用户补充最后一条聊天信息
    // 注意：使用 Promise.all 并行查询，提升性能
    const listWithLastMessage = await Promise.all(
      followedUsers.map(async (user) => {
        // 查询当前用户和该用户的最后一条双向消息
        const lastMessage = await this.messageRepository.findOne({
          where: [
            { senderId: userId, receiverId: user.id }, // 我发的
            { senderId: user.id, receiverId: userId }, // 对方发的
          ],
          order: { createdAt: 'DESC' }, // 按时间倒序，取最新的一条
        });
      
        return {
          id: user.id,
          username: user.username,
          avatar: user.avatar || '',
          lastMessage: lastMessage?.content || '', // ✅ 新增：最后一条消息，无则返回空字符串
        };
      })
    );
  
    return listWithLastMessage;
  }


  // ✅ 直接查询你现有的 user_follow 表，检查是否关注
  private async isFollowing(userId: number, followedUserId: number) {
    const relation = await this.userFollowRepository.findOne({
      where: { userId, followedUserId }, // 完全适配你的字段
    });
    return !!relation;
  }

  // 发送私信
  async sendMessage(senderId: number, createMessageDto: CreateMessageDto) {
    const { receiverId, content } = createMessageDto;

    if (senderId === receiverId) {
      throw new BadRequestException('不能给自己发送私信');
    }

    // ✅ 权限校验：直接查询你现有的关注表
    const isFollowing = await this.isFollowing(senderId, receiverId);
    if (!isFollowing) {
      throw new BadRequestException('请先关注该用户再发送私信');
    }

    const message = this.messageRepository.create({
      senderId,
      receiverId,
      content,
      isRead: 0,
    });

    return this.messageRepository.save(message);
  }

  // 获取历史消息
  async getHistoryMessages(currentUserId: number, targetUserId: number) {
    // ✅ 权限校验：直接查询你现有的关注表
    const isFollowing = await this.isFollowing(currentUserId, targetUserId);
    if (!isFollowing) {
      throw new BadRequestException('请先关注该用户');
    }

    const messages = await this.messageRepository.find({
      where: [
        { senderId: currentUserId, receiverId: targetUserId },
        { senderId: targetUserId, receiverId: currentUserId },
      ],
      order: { createdAt: 'ASC' },
    });

    await this.markAsRead(targetUserId, currentUserId);

    return messages;
  }

  // 标记已读
  async markAsRead(senderId: number, receiverId: number) {
    await this.messageRepository.update(
      { senderId, receiverId, isRead: 0 },
      { isRead: 1 },
    );
  }
}