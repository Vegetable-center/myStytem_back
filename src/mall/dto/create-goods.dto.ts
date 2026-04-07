// src/modules/mall/dto/create-goods.dto.ts
import { IsString, IsNumber, IsEnum, IsOptional, Min, MaxLength, IsInt } from 'class-validator';
import { GoodsType } from '../entities/goods.entity';
import { Type } from 'class-transformer';

export class CreateGoodsDto {
  @IsString({ message: '商品名称不能为空' })
  @MaxLength(100, { message: '商品名称不能超过100个字符' })
  name: string;

  @IsOptional()
  @IsString({ message: '商品描述必须是字符串' })
  description?: string;

  @IsOptional()
  @IsString()
  image?: string;

  // ✅ 关键：自动把字符串转为数字类型
  @Type(() => Number)
  @IsInt({ message: '所需积分必须是数字' })
  @Min(1, { message: '所需积分不能小于1' })
  points: number;

  @IsEnum(GoodsType, { message: '商品类型只能是course/coupon/gift' })
  type: GoodsType;

  @Type(() => Number)
  @IsInt({ message: '库存必须是数字' })
  @Min(0, { message: '库存不能小于0' })
  stock: number;
}