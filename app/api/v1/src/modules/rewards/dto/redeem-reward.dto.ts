import { IsEmail, IsOptional, IsString } from 'class-validator';

export class RedeemRewardDto {
  @IsString()
  rewardId: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
