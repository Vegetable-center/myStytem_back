import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Course } from './entities/course.entity';
import { CourseLesson } from './entities/course-lesson.entity';
import { CreateCourseDto, LessonMetaDto } from './dto/create-course.dto';
import { ResponseDto } from 'src/common/dto/response.dto';
import { CourseStatus } from './enum';

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(CourseLesson)
    private readonly lessonRepository: Repository<CourseLesson>,
    private dataSource: DataSource, // ✅ 新增：注入 DataSource
  ) {}

  async createCourse(
    createCourseDto: CreateCourseDto,
    lessons: LessonMetaDto[],
    lessonFiles: Array<{
      videoFile: Express.Multer.File;
      coverFile: Express.Multer.File;
    }>
  ) {
    return this.dataSource.transaction(async (manager) => {
      // 1. 检查课程名称重复
      const existCourse = await manager.findOne(Course, {
        where: { name: createCourseDto.name },
      });
      if (existCourse) throw new BadRequestException('课程名称已存在');

      // 2. 创建课程（包含封面图路径）
      const course = manager.create(Course, {
        ...createCourseDto,
        coverImageUrl: createCourseDto.coverImageUrl || '', // 保存封面图路径
        status: CourseStatus.BANNED,
      });
      const savedCourse = await manager.save(course);

      // 3. 处理视频 + 课时（新增封面逻辑）
      const lessonEntities: any = [];
      for (let i = 0; i < lessons.length; i++) {
        const lessonMeta = lessons[i];
        const { videoFile, coverFile } = lessonFiles[i]; // 取出当前课时的视频和封面
      
        if (lessonMeta.lessonNum > savedCourse.totalLessons) {
          throw new BadRequestException(`第${lessonMeta.lessonNum}课时：序号超过总课时数`);
        }
      
        // 视频路径（不变）
        const videoRelativePath = `/uploads/course-videos/${videoFile.filename}`;
        // 新增：课时封面路径
        const lessonCoverRelativePath = `/uploads/course-covers/${coverFile.filename}`;
      
        // 创建课时实体（新增 coverImageUrl 字段）
        const lesson = manager.create(CourseLesson, {
          courseId: savedCourse.id,
          lessonNum: lessonMeta.lessonNum,
          lessonName: lessonMeta.lessonName,
          videoUrl: videoRelativePath,
          coverImageUrl: lessonCoverRelativePath, // ✅ 新增课时封面字段
          duration: lessonMeta.duration || 0,
        });
        lessonEntities.push(lesson);
      }
    
      await manager.save(lessonEntities);

      // 4. 返回结果（新增封面图字段）
      return {
        success: true,
        message: '课程创建成功',
        courseId: savedCourse.id,
        course: {
          id: savedCourse.id,
          name: savedCourse.name,
          teacher: savedCourse.teacher,
          totalLessons: savedCourse.totalLessons,
          description: savedCourse.description,
          coverImageUrl: savedCourse.coverImageUrl, // 返回封面图路径
          status: savedCourse.status,
        },
        lessons: lessonEntities.map(item => ({
          lessonNum: item.lessonNum,
          lessonName: item.lessonName,
          videoPath: item.videoUrl,
          duration: item.duration,
        })),
      };
    });
  }

  // 新增：获取所有课程基础信息
  async getAllCourses() {
    // 1. 查询所有课程（仅查基础字段，提升性能）
    const courses = await this.courseRepository.find({
      select: ['id', 'name', 'teacher', 'description', 'totalLessons', 'coverImageUrl'],
      where: { status: CourseStatus.NORMAL },
      order: { id: 'DESC' }, // 按课程ID倒序（最新创建的在前）
    });

    // 2. 格式化返回数据（仅返回前端需要的字段）
    return {
      success: true,
      data: courses.map(course => ({
        courseId: course.id, // 课程ID
        title: course.name, // 课程标题
        teacher: course.teacher, // 授课老师
        description: course.description, // 课程简介
        totalLessons: course.totalLessons, // 总课时数
        coverImageUrl: course.coverImageUrl, // 封面图路径（前端可直接访问）
      })),
    };
  }


  // 获取课程详情（基础信息 + 学习进度）
  async getCourseDetail(courseId: number, userId: number) {
    // 1. 查询课程基础信息
    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('课程不存在');

    if (course.status === CourseStatus.BANNED) {
      throw new NotFoundException('课程不存在或已被封禁');
    }

    return {
      courseInfo: {
        id: course.id,
        name: course.name,
        teacher: course.teacher,
        totalLessons: course.totalLessons,
        description: course.description,
        coverImageUrl: course.coverImageUrl, // 新增返回封面图
      }
    };
  }

  // 获取课程课时列表（含视频资源）
  async getCourseLessons(courseId: number) {
    // 校验课程存在
    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('课程不存在');

    if (course.status === CourseStatus.BANNED) { // ✅ 关键：校验状态
      throw new NotFoundException('课程不存在或已被封禁');
    }

    // 查询课时列表（按序号排序）
    const lessons = await this.lessonRepository.find({
      where: { courseId },
      order: { lessonNum: 'ASC' },
    });

    return {
      list: lessons.map(item => ({
        id: item.id,
        lessonNum: item.lessonNum,
        lessonName: item.lessonName,
        videoUrl: item.videoUrl,
        coverImageUrl: item.coverImageUrl, // ✅ 新增：课时视频封面地址
        duration: item.duration,
      })),
    };
  }

  async findAllForAdmin() {
    // 1. 查询所有课程（仅查基础字段，提升性能）
    const courses = await this.courseRepository.find({
      select: ['id', 'name', 'teacher', 'description', 'totalLessons', 'coverImageUrl', 'status'],
      order: { id: 'DESC' }, // 按课程ID倒序（最新创建的在前）
    });

    // 2. 格式化返回数据（仅返回前端需要的字段）
    return {
      success: true,
      data: courses.map(course => ({
        courseId: course.id, // 课程ID
        title: course.name, // 课程标题
        status: course.status, // 课程状态
        teacher: course.teacher, // 授课老师
        description: course.description, // 课程简介
        totalLessons: course.totalLessons, // 总课时数
        coverImageUrl: course.coverImageUrl, // 封面图路径（前端可直接访问）
      })),
    };
  }


  // ✅ 新增：封禁课程
  // -------------------------------------------------------------------------
  async banCourse(courseId: number) {
    if (isNaN(courseId) || !Number.isInteger(courseId) || courseId <= 0) {
      throw new BadRequestException('无效的课程ID');
    }

    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('课程不存在');
    }
    if (course.status === CourseStatus.BANNED) {
      throw new ForbiddenException('课程已经是封禁状态');
    }

    course.status = CourseStatus.BANNED;
    await this.courseRepository.save(course);
    return new ResponseDto(200, '课程封禁成功', null);
  }

  // -------------------------------------------------------------------------
  // ✅ 新增：解封课程
  // -------------------------------------------------------------------------
  async unbanCourse(courseId: number) {
    if (isNaN(courseId) || !Number.isInteger(courseId) || courseId <= 0) {
      throw new BadRequestException('无效的课程ID');
    }

    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('课程不存在');
    }
    if (course.status === CourseStatus.NORMAL) {
      throw new ForbiddenException('课程已经是正常状态');
    }

    course.status = CourseStatus.NORMAL;
    await this.courseRepository.save(course);
    return new ResponseDto(200, '课程解封成功', null);
  }
  async getBannedCount() {
    const count = await this.courseRepository.count({
      where: { status: CourseStatus.BANNED },
    });
    return {
      success: true,
      data: { count },
    };
  }

}