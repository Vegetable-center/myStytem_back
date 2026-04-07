// src/modules/points/points.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPoints } from './entities/user-points.entity';

@Injectable()
export class PointsService {
  constructor(
    @InjectRepository(UserPoints)
    private readonly pointsRepository: Repository<UserPoints>,
  ) {}

  /**
   * 给用户增加积分
   * @param userId 用户ID
   * @param points 要增加的积分
   * @returns 更新后的总积分
   */
  async addPoints(userId: number, points: number): Promise<number> {
    // 1. 查询用户积分记录（不存在则创建）
    let userPoints = await this.pointsRepository.findOne({ where: { userId } });
    if (!userPoints) {
      userPoints = new UserPoints();
      userPoints.userId = userId;
      userPoints.totalPoints = 0;
    }

    // 2. 增加积分
    userPoints.totalPoints += points;
    await this.pointsRepository.save(userPoints);

    return userPoints.totalPoints;
  }

  /**
   * 查询用户总积分
   * @param userId 用户ID
   * @returns 总积分
   */
  async getUserPoints(userId: number){
    const userPoints = await this.pointsRepository.findOne({ where: { userId } });
    return {
      userId,
      totalPoints: userPoints ? userPoints.totalPoints : 0,
      updatedAt: userPoints ? userPoints.updatedAt : new Date(),
    };
  }
}