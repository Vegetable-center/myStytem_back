import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateDialectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  region?: string;

  @IsString()
  @IsNotEmpty()
  userNumber: string;

  @IsString()
  @IsOptional()
  languageFamily?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  documentUrl?: string;

  @IsString()
  @IsOptional()
  documentName?: string;

  resourceCount?: number;
}
