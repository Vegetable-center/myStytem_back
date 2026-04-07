
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserRole, UserStatus } from '../enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'varchar', length: 200, default: '', comment: '个性签名' })
  signature: string;

  @Column({ type: 'varchar', length: 255, default: '', comment: '头像URL' })
  avatar: string;

  // ✅ 新增：用户状态字段，默认正常
  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.NORMAL, // 注册默认正常状态
    comment: '用户状态：normal-正常，banned-封禁',
  })
  status: UserStatus;

  // ✅ 新增：用户角色字段，默认普通用户
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER, // 注册默认普通用户
    comment: '用户角色：user-普通用户，admin-管理员',
  })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
