import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { CourseStatus } from '../enum';

@Entity('course')
export class Course {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 100, comment: '课程名称' })
  name: string;

  @Column({ type: 'varchar', length: 50, comment: '授课教师' })
  teacher: string;

  @Column({ type: 'int', comment: '课程总课时数' })
  totalLessons: number;

  @Column({ type: 'text', comment: '课程简介' })
  description: string;

  // ✅ 新增：课程状态字段，默认封禁
  @Column({
    type: 'enum',
    enum: CourseStatus,
    default: CourseStatus.BANNED, // 新创建的课程默认封禁
    comment: '课程状态：normal-正常，banned-封禁',
  })
  status: CourseStatus;

  // 新增：课程封面图存储路径
  @Column({ type: 'varchar', length: 255, nullable: true, comment: '课程封面图路径' })
  coverImageUrl: string;
}