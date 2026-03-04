import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { RewardType } from '../../../../generated/prisma/enums';

export class UpdateRewardDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsEnum(RewardType)
  type?: RewardType;

  @IsOptional()
  @IsInt()
  @Min(1)
  pointsRequired?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  iconKey?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
