import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('message')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'sender_id', comment: '发送者ID' })
  senderId: number;

  @Column({ name: 'receiver_id', comment: '接收者ID' })
  receiverId: number;

  @Column({ comment: '消息内容' })
  content: string;

  @Column({ name: 'is_read', default: 0, comment: '是否已读：0-未读，1-已读' })
  isRead: number;

  @CreateDateColumn({ name: 'created_at', comment: '发送时间' })
  createdAt: Date;
}