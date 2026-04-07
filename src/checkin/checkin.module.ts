// src/modules/checkin/checkin.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckinController } from './checkin.controller';
import { CheckinService } from './checkin.service';
import { UserCheckin } from './entities/checkin.entity'; // 打卡实体
import { PointsModule } from '../point/point.module'; // 导入积分模块
import { UserPoints } from '../point/entities/user-points.entity'; // 导入积分实体
import { User } from '../user/entities/user.entity'; // 导入用户实体

@Module({
  // 1. 注册依赖模块和实体
  imports: [
    TypeOrmModule.forFeature([UserCheckin, UserPoints, User]), // 注册打卡实体
    PointsModule, // 导入积分模块（才能使用PointsService）
  ],
  // 2. 注册控制器（暴露接口）
  controllers: [CheckinController],
  // 3. 注册服务（业务逻辑）
  providers: [CheckinService],
})
export class CheckinModule {}