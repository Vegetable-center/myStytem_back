// src/modules/checkin/entities/checkin.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Unique } from 'typeorm';

// 联合唯一索引：用户+日期 确保每日仅打卡1次
@Unique(['userId', 'checkinDate'])
@Entity('user_checkin')
export class UserCheckin {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number; // 打卡记录ID

  @Column({ type: 'bigint', comment: '用户ID' })
  userId: number; // 打卡用户ID

  @Column({ type: 'date', comment: '打卡日期（YYYY-MM-DD）' })
  checkinDate: string; // 核心：按日期维度存储，用于多天数筛选

  @Column({ type: 'int', default: 10, comment: '本次打卡积分' })
  points: number; // 单次积分

  @Column({ type: 'int', default: 1, comment: '连续打卡天数（打卡时自动计算）' })
  continuousDays: number; // 扩展：连续打卡天数（多天数核心字段）

  @CreateDateColumn({ type: 'datetime', name: 'created_at', comment: '具体打卡时间' })
  createdAt: Date; // 精确到秒的打卡时间（用于区分同一天多次打卡尝试）

  @Column({ type: 'varchar', length: 50, nullable: true, comment: '打卡备注（如"早起打卡""运动打卡"）' })
  remark: string; // 扩展：支持多类型打卡
}