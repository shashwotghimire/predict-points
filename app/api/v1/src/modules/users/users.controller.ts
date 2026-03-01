import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Query } from '@nestjs/common';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  listUsers() {
    return this.usersService.listUsers();
  }

  @Get('leaderboard')
  @UseGuards(JwtAuthGuard)
  getLeaderboard(@Query('limit') limit?: string) {
    const parsedLimit = limit ? Number(limit) : 20;
    return this.usersService.getLeaderboard(
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
    );
  }

  @Get(':id/points')
  @UseGuards(JwtAuthGuard)
  getPoints(@Param('id') id: string) {
    return this.usersService.getUserPoints(id);
  }
}
