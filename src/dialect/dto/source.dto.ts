import { IsNotEmpty, IsString } from 'class-validator';

export class ResourceDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  sourceType: string; // "音频"/"视频"/"文档"
}