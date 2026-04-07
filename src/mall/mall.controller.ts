// src/modules/mall/mall.controller.ts
import { Controller, Get, Post, Query, Request, UseGuards, Param, Body, UseInterceptors, UploadedFile, BadRequestException, Delete, ParseIntPipe  } from '@nestjs/common';
import { MallService } from './mall.service';
import { JwtAuthGuard } from '../common/guards/jwt.guards';
import { GoodsType } from './entities/goods.entity';
import { CreateGoodsDto } from './dto/create-goods.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AdminGuard } from 'src/common/guards/admin.guards';

// 商品图片存储目录
const GOODS_IMAGE_DIR = join(process.cwd(), 'uploads/goods-images');
// 确保目录存在
if (!existsSync(GOODS_IMAGE_DIR)) {
  mkdirSync(GOODS_IMAGE_DIR, { recursive: true });
}

@Controller('mall')
@UseGuards(JwtAuthGuard)
export class MallController {
  constructor(private readonly mallService: MallService) {}

  // 新增：创建商品（可选添加 AdminGuard 限制权限）
  @Post('goods')
  @Post()
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: GOODS_IMAGE_DIR,
      filename: (req, file, cb) => {
        // 生成唯一文件名：goods-时间戳-随机数.后缀
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        const filename = `goods-${uniqueSuffix}${ext}`;
        cb(null, filename);
      },
    }),
    // 文件校验：仅允许图片，最大5MB
    fileFilter: (req, file, cb) => {
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('仅支持JPG/PNG/WebP/GIF格式商品图片'), false);
      }
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  }))
  async create(
    @Body() createGoodsDto: CreateGoodsDto,
    @UploadedFile() image?: Express.Multer.File, // 商品图片文件（可选）
  ) {
    // ✅ 关键：如果上传了图片，把访问路径赋值给 DTO
    if (image) {
      createGoodsDto.image = `/uploads/goods-images/${image.filename}`;
    }

    // 调用 Service 层创建商品
    return this.mallService.createGoods(createGoodsDto);
  }

  // 1. 获取商品列表（支持分类筛选）
  @Get('goods')
  async getGoodsList(
    @Query('type') type?: GoodsType, // 可选：course/coupon/gift，不传则返回全部
  ) {
    return this.mallService.getGoodsList(type);
  }

  @Delete(':id')
  @UseGuards(AdminGuard) // 至少需要登录
  // @UseGuards(JwtAuthGuard, AdminGuard) // 建议：加上管理员守卫，只有管理员能删
  async deleteGoods(@Param('id') id: number) {
    return this.mallService.deleteGoods(id);
  }

  // 2. 获取用户当前积分
  @Get('user-points')
  async getUserPoints(@Request() req) {
    return this.mallService.getUserPoints(req.user.id);
  }

  // 3. 兑换商品
  @Post('exchange/:goodsId')
  async exchangeGoods(
    @Param('goodsId') goodsId: number,
    @Request() req,
  ) {
    return this.mallService.exchangeGoods(req.user.id, Number(goodsId));
  }

  // 4. 获取用户兑换记录
  @Get('exchangeRecords')
  async getExchangeRecords(
    @Request() req,
  ) {
    return this.mallService.getExchangeRecords(req.user.id);
  }
}