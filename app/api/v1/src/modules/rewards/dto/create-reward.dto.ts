import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateRewardDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  pointsRequired: number;

  @IsOptional()
  @IsString()
  iconKey?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
