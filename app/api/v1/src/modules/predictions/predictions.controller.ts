import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PredictionsService } from './predictions.service';
import { CreatePredictionDto } from './dto/create-prediction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('predictions')
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreatePredictionDto, @CurrentUser('id') userId: string) {
    return this.predictionsService.create({
      ...dto,
      userId,
    });
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  getByUser(
    @Param('userId') userId: string,
    @CurrentUser('id') currentUserId: string,
    @CurrentUser('role') currentUserRole: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(currentUserRole);
    if (!isAdmin && userId !== currentUserId) {
      throw new ForbiddenException('You can only view your own predictions');
    }

    return this.predictionsService.getByUser(userId, {
      status,
      search,
      sort,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 10,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getById(
    @Param('id') id: string,
    @CurrentUser('id') currentUserId: string,
    @CurrentUser('role') currentUserRole: string,
  ) {
    return this.predictionsService.getById(id, {
      currentUserId,
      currentUserRole,
    });
  }
}
