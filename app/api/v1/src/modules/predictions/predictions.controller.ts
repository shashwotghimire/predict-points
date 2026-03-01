import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { PredictionsService } from './predictions.service';
import { CreatePredictionDto } from './dto/create-prediction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('predictions')
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreatePredictionDto) {
    return this.predictionsService.create(dto);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.predictionsService.getById(id);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  getByUser(
    @Param('userId') userId: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.predictionsService.getByUser(userId, {
      status,
      search,
      sort,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 10,
    });
  }
}
