import { Controller, Post, Body, Get, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt.guards'; // 你已有的登录守卫
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  async sendMessage(@Req() req, @Body() createMessageDto: CreateMessageDto) {
    const senderId = req.user.id;
    const data = await this.messageService.sendMessage(senderId, createMessageDto);
    return { code: 200, data, message: '发送成功' };
  }

  // ✅ 新增：获取当前用户关注的用户列表（含用户信息）
  @Get('following')
  /**
   * 获取当前用户的关注列表
   * @param req - 包含用户信息的请求对象
   * @returns 返回状态码200和关注列表数据
   */
  async getFollowingList(@Req() req) {
    const userId = req.user.id; // 从JWT获取当前用户ID
    const data = await this.messageService.getFollowingListWithUserInfo(userId);
    return { code: 200, data };
  }

  // 获取历史消息
  @Get(':targetUserId')
  async getHistoryMessages(@Req() req, @Param('targetUserId') targetUserId: string) {
    const currentUserId = req.user.id;
    const data = await this.messageService.getHistoryMessages(currentUserId, +targetUserId);
    return { code: 200, data };
  }
}