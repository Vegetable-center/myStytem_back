// src/modules/points/points.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointsService } from './point.service';
import { UserPoints } from './entities/user-points.entity'; // 积分实体

@Module({
  // 1. 注册TypeORM实体（让Repository可用）
  imports: [TypeOrmModule.forFeature([UserPoints])],
  // 2. 注册Service（业务逻辑层）
  providers: [PointsService],
  // 3. 导出Service（让其他模块如CheckinModule可以注入使用）
  exports: [PointsService],
})
export class PointsModule {}