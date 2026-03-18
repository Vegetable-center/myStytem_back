// src/modules/post/dto/create-post.dto.ts
import { IsString, MaxLength, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateContentDto {
  @IsNotEmpty({ message: '标题不能为空' })
  @IsString()
  @MaxLength(100, { message: '标题不能超过100个字符' })
  title: string;

  @IsNotEmpty({ message: '内容不能为空' })
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: '封面图URL不能超过255个字符' })
  coverImage?: string;
}