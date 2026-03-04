import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OddsOptionDto {
  @IsString()
  @IsNotEmpty()
  optionId: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  label?: string;

  @IsInt()
  @Min(1)
  @Max(100)
  percentage: number;
}

export class SetOddsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => OddsOptionDto)
  options: OddsOptionDto[];
}
