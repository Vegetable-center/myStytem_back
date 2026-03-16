import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DialectController } from './dialect.controller';
import { DialectService } from './dialect.service';
import { Dialect } from './entities/dialect.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Dialect])],
  controllers: [DialectController],
  providers: [DialectService],
  exports: [DialectService],
})
export class DialectModule {}
