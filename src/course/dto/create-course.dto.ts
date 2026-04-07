import { IsString, IsNumber, Min, MaxLength, IsOptional } from 'class-validator';

export class CreateCourseDto {
  @IsString({ message: '课程名称不能为空' })
  @MaxLength(100, { message: '课程名称不能超过100个字符' })
  name: string;

  @IsString({ message: '授课教师不能为空' })
  @MaxLength(50, { message: '授课教师名称不能超过50个字符' })
  teacher: string;

  @IsNumber({}, { message: '总课时数必须是数字' })
  @Min(1, { message: '总课时数不能小于1' })
  totalLessons: number;

  @IsOptional()
  @IsString({ message: '课程简介必须是字符串' })
  description?: string;

  // 新增：封面图字段（非必填，DTO仅做参数校验，文件由上传接口处理）
  @IsOptional()
  @IsString({ message: '封面图路径必须是字符串' })
  coverImageUrl?: string;
}

export class LessonMetaDto {
  @IsNumber({}, { message: '课时序号必须是数字' })
  @Min(1, { message: '课时序号不能小于1' })
  lessonNum: number;

  @IsString({ message: '课时名称不能为空' })
  @MaxLength(100, { message: '课时名称不能超过100个字符' })
  lessonName: string;

  @IsOptional()
  @IsNumber({}, { message: '视频时长必须是数字' })
  @Min(0, { message: '视频时长不能小于0' })
  duration?: number;
}