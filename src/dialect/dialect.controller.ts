import { Body, Controller, Get, Param, Post, Query, UploadedFile, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { DialectService } from './dialect.service';
import { JwtAuthGuard } from '../common/guards/jwt.guards';
import { CreateDialectDto } from './dto/createDialect.dto';
import { multerConfig } from 'src/config/multer.config';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('dialect')
export class DialectController {
  constructor(private readonly dialectService: DialectService) {}

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('document', multerConfig))
  @Post(':id/upload')
  async uploadDocument(@Param('id') dialectId: String, @UploadedFile() document: Express.Multer.File) {
    console.log('进入上传');
    return this.dialectService.uploadDocument(Number(dialectId), document);
    
  }

  /**
   * 新增方言资源
   * @param body 方言信息
   * @returns 新增的方言信息
   */
  @UseGuards(JwtAuthGuard)
  @Post('create')
  async createDialect(@Body() createDialectDto: CreateDialectDto) {
    return this.dialectService.createDialect(createDialectDto);
  }

  /**
   * 获取方言信息列表
   * @param page 页码，默认为1
   * @param pageSize 每页数量，默认为10
   * @returns 方言信息列表
   */
  @UseGuards(JwtAuthGuard) // 如果需要认证，取消注释
  @Get('list')
  async getDialectList() {
    return this.dialectService.getDialectList();
  }
}
