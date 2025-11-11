import { Body, Controller, Get, Post, UseGuards, ForbiddenException } from '@nestjs/common';
import { DrawsService } from './draws.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateDrawDto } from './dto/create-draw.dto';
import { CurrentUser } from '../users/decorators/current-user.decorator';
import { UserProfile, UserRole } from '../users/entities/user.entity';

@Controller('draws')
export class DrawsController {
  constructor(private readonly drawsService: DrawsService) {}

  @Get()
  list() {
    return this.drawsService.list();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateDrawDto, @CurrentUser() user: UserProfile) {
    if (![UserRole.ADMIN, UserRole.SUPERVISOR].includes(user.role)) {
      throw new ForbiddenException('Apenas administradores ou supervisores podem lançar sorteios');
    }
    return this.drawsService.create(dto, user.id);
  }
}
