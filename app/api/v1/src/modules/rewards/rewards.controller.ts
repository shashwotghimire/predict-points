import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { RedeemRewardDto } from './dto/redeem-reward.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';

@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get('catalog')
  @UseGuards(JwtAuthGuard)
  listCatalog(
    @CurrentUser('role') role: string,
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.rewardsService.listCatalog({
      role,
      search,
      includeInactive: includeInactive === 'true',
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  createReward(@Body() dto: CreateRewardDto) {
    return this.rewardsService.createReward(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  updateReward(@Param('id') id: string, @Body() dto: UpdateRewardDto) {
    return this.rewardsService.updateReward(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  deleteReward(@Param('id') id: string) {
    return this.rewardsService.deleteReward(id);
  }

  @Post('redeem')
  @UseGuards(JwtAuthGuard)
  redeem(@Body() dto: RedeemRewardDto, @CurrentUser('id') userId: string) {
    return this.rewardsService.redeem(userId, dto);
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
