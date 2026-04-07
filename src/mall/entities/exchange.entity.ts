// src/modules/mall/entities/exchange.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { MallGoods } from './goods.entity';

export enum ExchangeStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('mall_exchange')
export class MallExchange {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', comment: '用户ID' })
  userId: number;

  @Column({ type: 'bigint', comment: '商品ID' })
  goodsId: number;

  // ✅ 新增：多对一关联到商品表
  @ManyToOne(() => MallGoods)
  @JoinColumn({ name: 'goodsId' }) // 关联字段为 goodsId
  goods: MallGoods;

  @Column({ type: 'int', comment: '消耗积分' })
  points: number;

  @Column({ type: 'enum', enum: ExchangeStatus, default: ExchangeStatus.PENDING, comment: '状态' })
  status: ExchangeStatus;

  @CreateDateColumn({ comment: '兑换时间' })
  createdAt: Date;
}