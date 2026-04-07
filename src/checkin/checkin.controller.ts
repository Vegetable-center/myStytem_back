// src/modules/checkin/checkin.controller.ts
import { Controller, Post, Get, Query, Request, UseGuards } from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { PointsService } from '../point/point.service';
import { JwtAuthGuard } from '../common/guards/jwt.guards'; // 登录守卫
import { UserPointsVO } from './dto/checkin.vo';
import { ResponseDto } from 'src/common/dto/response.dto';

@Controller('checkin')
@UseGuards(JwtAuthGuard) // 打卡需登录
export class CheckinController {
  constructor(
    private readonly checkinService: CheckinService,
    private readonly pointsService: PointsService,
  ) {}

  // 1. 用户打卡接口：POST /checkin
  @Post('get')
  async checkin(@Request() req) {
    // req.user.id 是登录用户ID（从JWT解析）
    const result = await this.checkinService.checkin(req.user.id);
    return new ResponseDto(200, '打卡成功',{ result });
  }

  // 新增：获取月度打卡日历
  @Get('calendar')
  async getCheckinCalendar(
    @Request() req,
    @Query('year') year: string, // 年份（如2026）
    @Query('month') month: string, // 月份（如3）
  ) {
    // 处理默认值：默认当前年月
    const currentYear = year ? Number(year) : new Date().getFullYear();
    const currentMonth = month ? Number(month) : new Date().getMonth() + 1;
    const calendar = await this.checkinService.getCheckinCalendar(req.user.id, currentYear, currentMonth);
    
    return new ResponseDto(200, '获取日历数据成功',{ calendar });
  }

  // 新增：获取连续打卡统计
  @Get('continuousStats')
  async getContinuousCheckinStats(
    @Request() req,
  ) {
    const stats = await this.checkinService.getContinuousCheckinStats(req.user.id);
    
    return new ResponseDto(200, '获取打卡数据成功',{ stats });
  }

  // 3. 查询用户今日是否打卡：GET /checkin/today
  @Get('today')
  async isCheckinToday(@Request() req) {
    const isCheckin = await this.checkinService.isCheckinToday(req.user.id);
    return new ResponseDto(200, '获取今日是否打卡成功',{ isCheckin });
  }

  // 4. 查询用户总积分：GET /checkin/points
  @Get('points')
  async getUserPoints(@Request() req) {
    const points = await this.pointsService.getUserPoints(req.user.id);
    return new ResponseDto(200, '获取用户积分数据成功',{ points });
  }

  @Get('ranking')
  async getCheckinRanking() {
    const ranking = await this.checkinService.getCheckinRanking();
    return new ResponseDto(200, '获取排行榜数据成功',{ ranking });
  }
}