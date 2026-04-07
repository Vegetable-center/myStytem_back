// src/modules/post/entities/post.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { PostStatus } from '../enum';

@Entity('contents')
export class Content {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 100, comment: '帖子标题' })
  title: string;

  @Column({ type: 'text', comment: '帖子内容' })
  content: string;

  @Column({ type: 'varchar', length: 20, default: '经验分享', comment: '帖子分类' })
  category: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '封面图URL' })
  coverImage: string;

  @Column({ type: 'int', default: 0, comment: '浏览量' })
  viewCount: number;

  @Column({ type: 'int', default: 0, comment: '点赞数' })
  likeCount: number;

  @Column({ type: 'int', default: 0, comment: '评论数' })
  commentCount: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'bigint', name: 'user_id' })
  userId: number;

  @Column({
    type: 'enum',
    enum: PostStatus,
    default: PostStatus.BANNED, // 新创建的帖子默认封禁
    comment: '帖子状态：normal-正常，banned-封禁',
  })
  status: PostStatus;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;
}