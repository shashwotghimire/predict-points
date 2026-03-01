import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreatePredictionDto {
  @IsString()
  marketId: string;

  @IsString()
  optionId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  pointsStaked?: number;
}
