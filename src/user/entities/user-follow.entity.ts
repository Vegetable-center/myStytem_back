// src/modules/user/entities/user-follow.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Unique } from 'typeorm';

// 联合唯一索引：避免重复关注（一个用户不能重复关注同一个人）
@Unique(['userId', 'followedUserId'])
@Entity('user_follow') // 用户关注表
export class UserFollow {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number; // 主键ID

  @Column({ type: 'bigint', comment: '当前用户ID（关注者）' })
  userId: number; // 比如：用户A关注了B → userId=A的ID

  @Column({ type: 'bigint', comment: '被关注的用户ID' })
  followedUserId: number; // 比如：用户A关注了B → followedUserId=B的ID

  @CreateDateColumn({ type: 'datetime', name: 'created_at', comment: '关注时间' })
  createdAt: Date; // 关注时间
}