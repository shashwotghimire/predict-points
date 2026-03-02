import { Controller, Get, Query } from '@nestjs/common';
import { ActivityService } from './activity.service';

@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  list(@Query('limit') limit?: string) {
    const parsedLimit = limit ? Number(limit) : undefined;
    return this.activityService.list(parsedLimit);
  }
}
