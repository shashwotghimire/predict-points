import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMarketDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsDateString()
  closesAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  eventIconUrl?: string;
}
