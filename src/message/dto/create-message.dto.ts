import { IsInt, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateMessageDto {
  @IsInt({ message: '接收者ID必须是数字' })
  receiverId: number;

  @IsString({ message: '消息内容不能为空' })
  @MinLength(1, { message: '消息内容不能为空' })
  @MaxLength(1000, { message: '消息内容不能超过1000字' })
  content: string;
}