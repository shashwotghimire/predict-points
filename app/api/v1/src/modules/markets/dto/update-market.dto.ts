import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateMarketDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  closesAt?: string;

  @IsOptional()
  @IsString()
  eventIconUrl?: string;
}
