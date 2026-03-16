
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn} from 'typeorm';

export type DocumentItem = {
  url: string;        // 文档访问路径
  name: string;       // 文档原名称
  size: number;       // 文档大小（字节）
  uploadTime: Date;   // 上传时间
};

@Entity('dialect')
export class Dialect {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100, nullable: true })
  region: string;

  @Column({ length: 100 })
  userNumber: string;

  @Column({ length: 100 })
  languageFamily: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ 
    type: 'json',
    nullable: false,
  })
  documents: DocumentItem[]; 

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  resourceCount: number;
}
