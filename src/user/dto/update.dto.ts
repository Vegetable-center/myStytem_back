// src/modules/user/dto/update-user.dto.ts
import { IsOptional, IsString, MaxLength } from 'class-validator'; // NestJS 校验器

export class UpdateDto {
  // 个性签名：可选，字符串，最大200字符
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: '个性签名不能超过200个字符' })
  signature?: string;

  // 头像URL：可选，字符串，最大255字符
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: '头像URL不能超过255个字符' })
  avatar?: string;

  // 注意：username 不建议修改（唯一标识），若要改需单独处理唯一性校验
}