import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OddsOptionDto {
  @IsString()
  optionId: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsInt()
  @Min(1)
  @Max(100)
  percentage: number;
}

export class SetOddsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OddsOptionDto)
  options: OddsOptionDto[];
}
