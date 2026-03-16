import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dialect, DocumentItem } from './entities/dialect.entity';
import { CreateDialectDto } from './dto/createDialect.dto';

@Injectable()
export class DialectService {
  constructor(
    @InjectRepository(Dialect)
    private readonly dialectRepository: Repository<Dialect>,
  ) {}

  async uploadDocument(dialectId: number, document?: Express.Multer.File) {
    // 根据id查询已有方言
    const dialect = await this.dialectRepository.findOne({
      where: { id: dialectId },
    });
    console.log('进入文件')

    if (!dialect) {
      return {
        success: false,
        data: '方言不存在',
        code: 401,
        message: '新增方言资源成功',
      };
    }
    const newDocument: DocumentItem = {
      url: `/uploads/${document?.filename}`, // 文档访问路径
      name: (document as any).originalName || document?.originalname || '', // 修复乱码后的名称
      size: document?.size || 0, // 文件大小（字节）
      uploadTime: new Date(), // 上传时间
    };

    const existingDocuments = dialect.documents || [];
    const newDocumentsList = [...existingDocuments, newDocument]; // 追加新文档
    dialect.documents = newDocumentsList;

    dialect.resourceCount = newDocumentsList.length;

    const updatedDialect = await this.dialectRepository.save(dialect);
    return {
      success: true,
      code: 200,
      message: '文件上传并绑定成功',
      data: updatedDialect,
    }
  }

  async createDialect(createDialectDto: CreateDialectDto) {
    const dialect = new Dialect();
    dialect.name = createDialectDto.name;
    dialect.region = createDialectDto.region || '';
    dialect.userNumber = createDialectDto.userNumber || '0';
    dialect.languageFamily = createDialectDto.languageFamily || '';
    dialect.description = createDialectDto.description || '';
    dialect.documents = [];
    dialect.resourceCount = createDialectDto.resourceCount || 0;

    const savedDialect = await this.dialectRepository.save(dialect);
    
    return {
      success: true,
      data: savedDialect,
      code: 200,
      message: '新增方言资源成功',
    };
  }

  async getDialectList() {
    const data = await this.dialectRepository.find();
    return {
      success: true,
      data,
      code: 200,
      message: '获取方言列表成功',
    };
  }
}
