// src/common/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

// 装饰器：标记接口为公开（无需 JWT 认证）
export const Public = () => SetMetadata('isPublic', true);