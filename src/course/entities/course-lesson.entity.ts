import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Course } from './course.entity';

@Entity('course_lesson')
export class CourseLesson {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', comment: '所属课程ID' })
  courseId: number;

  @ManyToOne(() => Course)
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column({ type: 'int', comment: '课时序号（如第1课=1，第2课=2）' })
  lessonNum: number;

  @Column({ type: 'varchar', length: 100, comment: '课时名称' })
  lessonName: string;

  @Column({ type: 'varchar', length: 255, comment: '视频资源URL' })
  videoUrl: string;

  @Column({ nullable: true, comment: '课时视频封面图' })
  coverImageUrl: string;


  @Column({ type: 'int', default: 0, comment: '视频时长（秒）' })
  duration: number;
}