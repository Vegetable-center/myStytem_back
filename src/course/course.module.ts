import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';
import { Course } from './entities/course.entity';
import { CourseLesson } from './entities/course-lesson.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Course, CourseLesson]),
  ],
  controllers: [CourseController],
  providers: [CourseService], // DataSource 会被Nest自动注入，无需手动配置
  exports: [CourseService],
})
export class CourseModule {}