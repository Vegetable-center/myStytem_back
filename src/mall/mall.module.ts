// src/modules/mall/mall.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MallController } from './mall.controller';
import { MallService } from './mall.service';
import { MallGoods } from './entities/goods.entity';
import { MallExchange } from './entities/exchange.entity';
import { UserPoints } from '../point/entities/user-points.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MallGoods, MallExchange, UserPoints]),
  ],
  controllers: [MallController],
  providers: [MallService],
})
export class MallModule {}