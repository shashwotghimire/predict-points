import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

type MarketCategory = 'TRENDING' | 'POLITICS' | 'SPORTS';
type MarketType = 'YES_NO' | 'MULTI_4' | 'OVER_UNDER';

export class CreateMarketOptionDto {
  @IsString()
  label: string;

  @IsInt()
  @Min(1)
  @Max(100)
  percentage: number;
}

export class CreateMarketDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  category: MarketCategory;

  @IsString()
  type: MarketType;

  @IsDateString()
  closesAt: string;

  @IsOptional()
  @IsString()
  eventIconUrl?: string;

  @IsString()
  createdById: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMarketOptionDto)
  options: CreateMarketOptionDto[];
}
