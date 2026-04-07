// src/modules/mall/mall.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { MallGoods, GoodsType } from './entities/goods.entity';
import { MallExchange, ExchangeStatus } from './entities/exchange.entity';
import { UserPoints } from '../point/entities/user-points.entity';
import { CreateGoodsDto } from './dto/create-goods.dto';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

@Injectable()
export class MallService {
  constructor(
    @InjectRepository(MallGoods)
    private readonly goodsRepository: Repository<MallGoods>,
    @InjectRepository(MallExchange)
    private readonly exchangeRepository: Repository<MallExchange>,
    @InjectRepository(UserPoints)
    private readonly pointsRepository: Repository<UserPoints>,
    private dataSource: DataSource, // 注入 DataSource
  ) {}

  // 创建商品
  // 新增：创建商品
  async createGoods(createGoodsDto: CreateGoodsDto) {
    // 1. 检查商品名称是否重复（可选，根据业务需求）
    const existGoods = await this.goodsRepository.findOne({
      where: { name: createGoodsDto.name },
    });
    if (existGoods) {
      throw new BadRequestException('商品名称已存在');
    }

    // 2. 创建商品
    const goods = this.goodsRepository.create(createGoodsDto);
    await this.goodsRepository.save(goods);

    return {
      success: true,
      message: '商品创建成功',
      goodsId: goods.id,
      goods: {
        id: goods.id,
        name: goods.name,
        points: goods.points,
        type: goods.type,
        stock: goods.stock,
        image: goods.image,
      },
    };
  }

  async deleteGoods(goodsId: number) {
    // 1. 检查商品是否存在
    const goods = await this.goodsRepository.findOne({
      where: { id: goodsId },
    });
    if (!goods) {
      throw new NotFoundException('商品不存在');
    }

    // 2. 【可选优化】删除商品对应的本地图片文件，避免垃圾文件堆积
    if (goods.image) {
      const imagePath = join(process.cwd(), goods.image);
      if (existsSync(imagePath)) {
        try {
          unlinkSync(imagePath);
        } catch (error) {
          console.error('删除商品图片失败:', error);
          // 注意：图片删除失败不要阻断商品删除的主流程，只打日志即可
        }
      }
    }

    // 3. 执行删除
    await this.goodsRepository.delete(goodsId);

    // 4. 返回和创建接口风格一致的响应
    return {
      success: true,
      message: '商品删除成功',
    };
  }
  // 获取商品列表
  async getGoodsList(type?: GoodsType) {
    const where: any = {};
    if (type) where.type = type;

    // 1. 查询商品基础列表
    const goodsList = await this.goodsRepository.find({
      where,
      order: { points: 'ASC' },
    });
    const goodsIds = goodsList.map(item => item.id);

    // 2. 统计每个商品的兑换次数（按 goodsId 分组）
    const exchangeCountList = await this.dataSource
      .createQueryBuilder()
      .select('goodsId', 'goodsId')
      .addSelect('COUNT(*)', 'count')
      .from(MallExchange, 'exchange')
      .where('exchange.goodsId IN (:...goodsIds)', { goodsIds })
      .groupBy('goodsId')
      .getRawMany();

    // 3. 构建兑换次数Map
    const exchangeCountMap = new Map<number, number>();
    exchangeCountList.forEach(item => {
      exchangeCountMap.set(Number(item.goodsId), Number(item.count));
    });

    // 4. 组装最终数据（新增 exchangeCount 字段）
    return {
      list: goodsList.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        image: item.image,
        points: item.points,
        type: item.type,
        stock: item.stock,
        exchangeCount: exchangeCountMap.get(item.id) || 0, // 新增：兑换次数，默认0
      })),
    };
  }

  // 获取用户积分
  async getUserPoints(userId: number) {
    const points = await this.pointsRepository.findOne({ where: { userId } });
    return { totalPoints: points?.totalPoints || 0 };
  }

  // 兑换商品（事务保证一致性）
  async exchangeGoods(userId: number, goodsId: number) {
    return this.dataSource.transaction(async (manager) => {
      // 1. 查询商品
      const goods = await manager.findOne(MallGoods, { where: { id: goodsId } });
      if (!goods) throw new NotFoundException('商品不存在');
      if (goods.stock <= 0) throw new BadRequestException('库存不足');

      // 2. 查询用户积分
      const userPoints = await manager.findOne(UserPoints, { where: { userId } });
      if (!userPoints || userPoints.totalPoints < goods.points) {
        throw new BadRequestException('积分不足');
      }

      // 3. 扣减积分
      userPoints.totalPoints -= goods.points;
      await manager.save(UserPoints, userPoints);

      // 4. 扣减库存
      goods.stock -= 1;
      await manager.save(MallGoods, goods);

      // 5. 生成兑换记录
      const exchange = new MallExchange();
      exchange.userId = userId;
      exchange.goodsId = goodsId;
      exchange.points = goods.points;
      exchange.status = ExchangeStatus.COMPLETED;
      await manager.save(MallExchange, exchange);

      return {
        success: true,
        message: '兑换成功',
        exchangeId: exchange.id,
        remainingPoints: userPoints.totalPoints,
      };
    });
  }

  // 获取兑换记录
  async getExchangeRecords(userId: number) {
    // 移除分页参数，直接查询所有记录并关联 goods
    const list = await this.exchangeRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['goods'], // 现在可以正常关联了
    });

    return {
      list: list.map(item => ({
        id: item.id,
        goodsName: item.goods?.name || '未知商品',
        description: item.goods?.description || '无商品描述', // 新增：商品描述字段
        image: item.goods?.image || '无商品图片', // 新增：商品图片字段
        points: item.points,
        status: item.status,
        createdAt: item.createdAt,
      })),
    };
  }
}