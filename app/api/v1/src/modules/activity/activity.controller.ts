import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@Query('limit') limit?: string) {
    const parsedLimit = limit ? Number(limit) : undefined;
    return this.activityService.list(parsedLimit);
  }
}
