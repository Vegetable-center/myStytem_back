// src/modules/like/entities/like.entity.ts（独立的点赞关联表）
import { Entity, Column, PrimaryGeneratedColumn, Unique, CreateDateColumn } from 'typeorm';

// 联合唯一索引：一个用户只能给一个帖子点一次赞（杜绝重复点赞）
@Unique(['userId', 'postId'])
@Entity('user_post_like') // 表名：用户-帖子点赞关联表
export class UserPostLike {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number; // 主键ID

  @Column({ type: 'bigint', comment: '用户ID' })
  userId: number; // 点赞用户ID

  @Column({ type: 'bigint', comment: '帖子ID' })
  postId: number; // 被点赞的帖子ID

  @CreateDateColumn({ type: 'datetime', name: 'created_at', comment: '点赞时间' })
  createdAt: Date; // 点赞时间（可选，便于排序/统计）
}