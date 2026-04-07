// src/modules/points/entities/user-points.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn, CreateDateColumn } from 'typeorm';

@Entity('user_points') // 用户积分表
export class UserPoints {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', comment: '用户ID', unique: true })
  userId: number; // 唯一用户ID

  @Column({ type: 'int', default: 0, comment: '总积分' })
  totalPoints: number; // 总积分

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at', comment: '更新时间' })
  updatedAt: Date; // 积分更新时间

  @CreateDateColumn({ type: 'datetime', name: 'created_at', comment: '创建时间' })
  createdAt: Date; // 首次获得积分时间
}