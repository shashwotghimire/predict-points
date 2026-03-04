import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Max,
  Min,
  ArrayMaxSize,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MarketCategory, MarketType } from '../../../../generated/prisma/enums';

export class CreateMarketOptionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  label: string;

  @IsInt()
  @Min(1)
  @Max(100)
  percentage: number;
}

export class CreateMarketDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description: string;

  @IsEnum(MarketCategory)
  category: MarketCategory;

  @IsEnum(MarketType)
  type: MarketType;

  @IsDateString()
  closesAt: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  eventIconUrl?: string;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => CreateMarketOptionDto)
  options: CreateMarketOptionDto[];
}
