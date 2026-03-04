import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreatePredictionDto {
  @IsString()
  @IsNotEmpty()
  marketId: string;

  @IsString()
  @IsNotEmpty()
  optionId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000000)
  pointsStaked?: number;
}
