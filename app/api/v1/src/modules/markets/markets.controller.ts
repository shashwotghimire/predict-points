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
import { MarketsService } from './markets.service';
import { CreateMarketDto } from './dto/create-market.dto';
import { UpdateMarketDto } from './dto/update-market.dto';
import { SetOddsDto } from './dto/set-odds.dto';
import { DeclareMarketDto } from './dto/declare-market.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('markets')
export class MarketsController {
  constructor(private readonly marketsService: MarketsService) {}

  @Get()
  listMarkets(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.marketsService.listMarkets({ category, search, status });
  }

  @Get(':id')
  getMarket(@Param('id') id: string) {
    return this.marketsService.getMarket(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  createMarket(
    @Body() dto: CreateMarketDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.marketsService.createMarket(dto, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  updateMarket(@Param('id') id: string, @Body() dto: UpdateMarketDto) {
    return this.marketsService.updateMarket(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  deleteMarket(@Param('id') id: string) {
    return this.marketsService.deleteMarket(id);
  }

  @Patch(':id/odds')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  setOdds(@Param('id') id: string, @Body() dto: SetOddsDto) {
    return this.marketsService.setOdds(id, dto);
  }

  @Post(':id/declare')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  declareMarket(@Param('id') id: string, @Body() dto: DeclareMarketDto) {
    return this.marketsService.declare(id, dto);
  }

  @Get(':id/comments')
  getComments(@Param('id') id: string) {
    return this.marketsService.getComments(id);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  createComment(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.marketsService.createComment(id, {
      ...dto,
      userId,
    });
  }
}
