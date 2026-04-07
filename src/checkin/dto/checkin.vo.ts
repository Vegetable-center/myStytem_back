// src/modules/checkin/dto/checkin.vo.ts
// 打卡返回结果
export interface CheckinVO {
  success: boolean; // 是否打卡成功
  message: string; // 提示信息（如"打卡成功，获得10积分"）
  todayPoints: number; // 本次获得积分
  totalPoints: number; // 打卡后总积分
  checkinDate: string; // 打卡日期
}

// 用户打卡记录VO
export interface CheckinRecordVO {
  id: number;
  checkinDate: string;
  points: number;
  createdAt: Date;
}

// 用户积分VO
export interface UserPointsVO {
  userId: number;
  totalPoints: number;
  updatedAt: Date;
}