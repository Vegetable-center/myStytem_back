// src/modules/checkin/checkin.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository, In } from 'typeorm';
import { UserCheckin } from './entities/checkin.entity';
import { User } from '../user/entities/user.entity';
import { UserPoints } from '../point/entities/user-points.entity';
import { PointsService } from '../point/point.service';
import { CheckinVO, CheckinRecordVO } from './dto/checkin.vo';

@Injectable()
export class CheckinService {
  constructor(
    @InjectRepository(UserCheckin)
    private readonly checkinRepository: Repository<UserCheckin>,
    private readonly pointsService: PointsService, // 注入积分Service
    @InjectRepository(UserPoints)
    private readonly pointsRepository: Repository<UserPoints>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * 用户每日打卡
   * @param userId 用户ID
   * @param points 本次打卡积分（默认10分）
   * @returns 打卡结果
   */
  async checkin(userId: number, points: number = 10): Promise<CheckinVO> {
    // 1. 获取今日日期（格式：YYYY-MM-DD）
    const today = new Date();
    const checkinDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // 2. 检查今日是否已打卡（通过联合唯一索引+查询双重校验）
    const hasCheckinToday = await this.checkinRepository.findOne({
      where: { userId, checkinDate },
    });
    if (hasCheckinToday) {
      // 查询当前总积分
      const userPoints = await this.pointsService.getUserPoints(userId);
      return {
        success: false,
        message: '今日已打卡，无需重复打卡',
        todayPoints: 0,
        totalPoints: userPoints.totalPoints,
        checkinDate,
      };
    }

    // 3. 创建打卡记录
    const checkinRecord = new UserCheckin();
    checkinRecord.userId = userId;
    checkinRecord.checkinDate = checkinDate;
    checkinRecord.points = points;
    await this.checkinRepository.save(checkinRecord);

    // 4. 增加用户积分
    const totalPoints = await this.pointsService.addPoints(userId, points);

    // 5. 返回打卡结果
    return {
      success: true,
      message: `打卡成功，获得${points}积分`,
      todayPoints: points,
      totalPoints,
      checkinDate,
    };
  }

  /**
   * 查询用户打卡记录
   * @param userId 用户ID
   * @param page 页码（可选，默认1）
   * @param limit 每页条数（可选，默认30）
   * @returns 打卡记录列表+总数
   */
  async getCheckinCalendar(userId: number, year: number, month: number) {
  // 1. 构建当月日期范围（如2026-03-01 至 2026-03-31）
  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).toISOString().split('T')[0]; // 当月最后一天

  // 2. 查询当月所有打卡记录
  const monthCheckins = await this.checkinRepository.find({
    where: {
      userId,
      checkinDate: Between(firstDay, lastDay),
    },
    select: ['checkinDate', 'points', 'continuousDays'],
  });

  // 3. 构建当月所有日期的打卡状态
  const days: any = [];
  const totalDays = new Date(year, month, 0).getDate(); // 当月总天数
  for (let day = 1; day <= totalDays; day++) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const checkinRecord = monthCheckins.find(item => item.checkinDate === date);
    days.push({
      day,
      date,
      isCheckin: !!checkinRecord,
      points: checkinRecord?.points,
      continuousDays: checkinRecord?.continuousDays,
    });
  }

  // 4. 统计月度数据
  const checkinDays = monthCheckins.length;
  const totalPoints = monthCheckins.reduce((sum, item) => sum + item.points, 0);
  // 计算当月最大连续天数（核心逻辑）
  let maxContinuous = 0;
  let currentContinuous = 0;
  days.forEach(day => {
    if (day.isCheckin) {
      currentContinuous++;
      maxContinuous = Math.max(maxContinuous, currentContinuous);
    } else {
      currentContinuous = 0;
    }
  });

  return {
    year,
    month,
    days,
    summary: {
      checkinDays,
      totalPoints,
      continuousDays: maxContinuous,
    },
  };
}
// checkin.service.ts
async getContinuousCheckinStats(userId: number) {
  // 1. 查询所有打卡记录（按日期倒序）
  const allCheckins = await this.checkinRepository.find({
    where: { userId },
    order: { checkinDate: 'DESC' },
  });

  if (allCheckins.length === 0) {
    return {
      currentContinuousDays: 0,
      maxContinuousDays: 0,
      lastCheckinDate: '',
      checkinRate: 0,
      totalCheckinDays: 0,
    };
  }

  // 2. 统计总打卡天数和最后打卡日期
  const totalCheckinDays = allCheckins.length;
  const lastCheckinDate = allCheckins[0].checkinDate;

  // 3. 计算当前连续打卡天数
  let currentContinuousDays = 1;
  const sortedDates = allCheckins.map(item => item.checkinDate).sort(); // 按日期升序
  for (let i = sortedDates.length - 1; i > 0; i--) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);
    const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      currentContinuousDays++;
    } else {
      break; // 断签，停止统计
    }
  }

  // 4. 计算历史最大连续天数
  let maxContinuousDays = 1;
  let tempContinuous = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);
    const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      tempContinuous++;
      maxContinuousDays = Math.max(maxContinuousDays, tempContinuous);
    } else {
      tempContinuous = 1;
    }
  }

  const recentCheckins = allCheckins.slice(0, 10).map(item => ({
    checkinDate: item.checkinDate, // 打卡日期（YYYY-MM-DD）
    checkinTime: item.createdAt,   // 具体打卡时间（DateTime格式，如2026-03-19 08:30:25）
    points: item.points            // 可选：本次打卡获得的积分，增强数据完整性
  }));
  
  return {
    currentContinuousDays,
    maxContinuousDays,
    lastCheckinDate,
    totalCheckinDays,
    recentCheckins,
  };
}

  /**
   * 查询用户今日是否打卡
   * @param userId 用户ID
   * @returns 是否打卡
   */
  async isCheckinToday(userId: number): Promise<boolean> {
    const today = new Date();
    const checkinDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const record = await this.checkinRepository.findOne({ where: { userId, checkinDate } });
    return !!record;
  }

  /**
   * 获取打卡排行榜（无分页，返回所有用户）
   * 按当前连续打卡天数降序，天数相同按总积分降序
   */
  async getCheckinRanking() {
    // 1. 查询所有有打卡记录的用户ID（去重）
    const userIds = await this.checkinRepository
      .createQueryBuilder('uc')
      .select('uc.userId', 'userId')
      .distinct(true)
      .getRawMany();
    const userIdList = userIds.map(item => item.userId);

    if (userIdList.length === 0) {
      return { list: [] };
    }

    // 2. 批量计算所有用户的当前连续打卡天数
    const userContinuousMap = new Map<number, number>();
    for (const userId of userIdList) {
      const continuousDays = await this.calcUserCurrentContinuousDays(userId);
      userContinuousMap.set(userId, continuousDays);
    }

    // 3. 查询所有用户的总积分
    const userPointsList = await this.pointsRepository.find({
      where: { userId: In(userIdList) },
      select: ['userId', 'totalPoints'],
    });
    const userPointsMap = new Map<number, number>();
    userPointsList.forEach(item => {
      userPointsMap.set(item.userId, item.totalPoints || 0);
    });

    // 4. 查询所有用户的基本信息（用户名、头像）
    const userList = await this.userRepository.find({
      where: { id: In(userIdList) },
      select: ['id', 'username', 'avatar'],
    });
    const userInfoMap = new Map();
    userList.forEach(item => {
      userInfoMap.set(item.id, {
        username: item.username,
        avatar: item.avatar || null,
      });
    });

    // 5. 组装排行榜数据并排序
    const rankingList = userIdList.map(userId => {
      const userInfo = userInfoMap.get(Number(userId)) || { username: '未知用户', avatar: null };
      return {
        userId,
        username: userInfo.username,
        avatar: userInfo.avatar,
        currentContinuousDays: userContinuousMap.get(userId) || 0,
        totalPoints: userPointsMap.get(userId) || 0,
      };
    });

    // 核心排序：先按连续天数降序，再按总积分降序
    rankingList.sort((a, b) => {
      if (b.currentContinuousDays !== a.currentContinuousDays) {
        return b.currentContinuousDays - a.currentContinuousDays;
      }
      return b.totalPoints - a.totalPoints;
    });

    return { list: rankingList };
  }

  /**
   * 辅助方法：计算单个用户的当前连续打卡天数
   */
  private async calcUserCurrentContinuousDays(userId: number): Promise<number> {
    const userCheckins = await this.checkinRepository.find({
      where: { userId },
      order: { checkinDate: 'DESC' },
    });

    if (userCheckins.length === 0) return 0;

    // 校验最后一次打卡是否在有效期内（今天/昨天），否则连续天数为0
    const lastCheckinDate = new Date(userCheckins[0].checkinDate);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const formatDate = (date: Date) => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    const lastDateStr = formatDate(lastCheckinDate);
    const todayStr = formatDate(today);
    const yesterdayStr = formatDate(yesterday);

    if (lastDateStr !== todayStr && lastDateStr !== yesterdayStr) {
      return 0;
    }

    // 计算连续天数
    let continuousDays = 1;
    const sortedDates = userCheckins.map(item => item.checkinDate).sort();
    for (let i = sortedDates.length - 1; i > 0; i--) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        continuousDays++;
      } else {
        break;
      }
    }

    return continuousDays;
  }
}