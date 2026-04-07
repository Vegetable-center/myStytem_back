// src/modules/mall/entities/goods.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum GoodsType {
  COURSE = 'course',
  COUPON = 'coupon',
  GIFT = 'gift',
}

@Entity('mall_goods')
export class MallGoods {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 100, comment: '商品名称' })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '商品描述' })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '商品图片URL' })
  image: string;

  @Column({ type: 'int', comment: '所需积分' })
  points: number;

  @Column({ type: 'enum', enum: GoodsType, comment: '商品类型' })
  type: GoodsType;

  @Column({ type: 'int', default: 0, comment: '库存数量' })
  stock: number;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}