import { IsInt, IsString, Min } from 'class-validator';

export class RedeemRewardDto {
  @IsString()
  userId: string;

  @IsString()
  rewardName: string;

  @IsInt()
  @Min(1)
  pointsSpent: number;
}
