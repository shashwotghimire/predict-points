import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class RedeemRewardDto {
  @IsString()
  @MaxLength(64)
  rewardId: string;

  @IsOptional()
  @Matches(/^\+?[0-9][0-9\s-]{6,15}$/)
  phoneNumber?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
