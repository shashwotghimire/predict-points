import { IsString } from 'class-validator';

export class DeclareMarketDto {
  @IsString()
  optionId: string;
}
