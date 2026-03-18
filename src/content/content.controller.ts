// src/modules/post/post.controller.ts
import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ContentService } from './content.service';
import { CreateContentDto } from './dto/content-create.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guards';

@Controller('content')
export class ContentController {
  constructor(private readonly postService: ContentService) {}

  // 创建帖子
  @UseGuards(JwtAuthGuard)
  @Post('create')
  create(@Request() req, @Body() createPostDto: CreateContentDto) {
    return this.postService.create(req.user.id, createPostDto);
  }

  // 获取帖子列表
  @UseGuards(JwtAuthGuard)
  @Get('list')
  findAll(){
    return this.postService.findAll();
  }

  // 根据id获取帖子详情
  @UseGuards(JwtAuthGuard)
  @Get('list/:id')
  findOne(@Param('id') id: string) {
    return this.postService.getContentById(+id);
  }

  // 根据id获取同类型帖子列表
  @UseGuards(JwtAuthGuard)
  @Get('list/same/:id')
  findSame(@Param('id') id: string) {
    return this.postService.getContentByCategory(+id);
  }

  // 点赞接口
  @UseGuards(JwtAuthGuard)
  @Post(':id/like/:type')
  changeLikeNum(@Param('id') id: string, @Param('type') type: string){
    const postId = Number(id);
    if(isNaN(postId)) throw new BadRequestException('id参数错误');
    
    return this.postService.updateLikeCount(postId, type);
  }



}
