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

export class CreateRewardDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsEnum(RewardType)
  type: RewardType;

  @IsInt()
  @Min(1)
  pointsRequired: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  iconKey?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
