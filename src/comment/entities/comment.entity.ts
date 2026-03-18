// src/modules/comment/entities/comment.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Content } from '../../content/entities/content.entity'; // 帖子实体
import { User } from '../../user/entities/user.entity'; // 用户实体

@Entity('post_comment') // 帖子评论表（所有评论平铺存储）
export class PostComment {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number; // 评论ID（按时间递增，天然排序）

  @Column({ type: 'bigint', comment: '所属帖子ID' })
  postId: number; // 帖子ID（关联到具体帖子）

  @Column({ type: 'bigint', comment: '评论用户ID' })
  userId: number; // 评论者ID

  @Column({ type: 'text', comment: '评论内容' })
  content: string; // 评论内容

  @Column({ type: 'bigint', nullable: true, comment: '回复的目标评论ID（null=普通评论，非null=回复某条评论）' })
  replyCommentId: number | null; // 回复的目标评论ID（比如回复ID=10的评论）

  @Column({ type: 'bigint', nullable: true, comment: '回复的目标用户ID（null=普通评论）' })
  replyToUserId: number | null; // 回复的目标用户ID（比如回复@张三）

  @CreateDateColumn({ type: 'datetime', name: 'created_at', comment: '评论时间' })
  createdAt: Date; // 评论时间（按这个字段排序）

  // 关联评论者信息（联表查询用）
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  // 关联回复的目标用户（显示“回复@XXX”用）
  @ManyToOne(() => User)
  @JoinColumn({ name: 'replyToUserId' })
  replyToUser: User;

  // 关联帖子表（可选）
  @ManyToOne(() => Content)
  @JoinColumn({ name: 'postId' })
  post: Content;
}