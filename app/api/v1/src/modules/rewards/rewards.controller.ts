import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { RedeemRewardDto } from './dto/redeem-reward.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Post('redeem')
  @UseGuards(JwtAuthGuard)
  redeem(@Body() dto: RedeemRewardDto) {
    return this.rewardsService.redeem(dto);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  listByUser(
    @Param('userId') userId: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.rewardsService.listUserRewards(userId, {
      search,
      sort,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 10,
    });
  }
}
