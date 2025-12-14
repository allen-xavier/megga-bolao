import { Body, Controller, Get, Post, UseGuards, ForbiddenException, Query, Delete, Param, NotFoundException } from '@nestjs/common';
import { DrawsService } from './draws.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateDrawDto } from './dto/create-draw.dto';
import { CurrentUser } from '../users/decorators/current-user.decorator';
import { UserProfile, UserRole } from '../users/entities/user.entity';
import { ListDrawsDto } from './dto/list-draws.dto';

@Controller('draws')
export class DrawsController {
  constructor(private readonly drawsService: DrawsService) {}

  @Get()
  list(@Query() query: ListDrawsDto) {
    return this.drawsService.list(query);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateDrawDto, @CurrentUser() user: UserProfile) {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPERVISOR) {
      throw new ForbiddenException('Apenas administradores ou supervisores podem lançar sorteios');
    }
    return this.drawsService.create(dto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string, @CurrentUser() user: UserProfile) {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPERVISOR) {
      throw new ForbiddenException('Apenas administradores ou supervisores podem excluir sorteios');
    }
    try {
      return await this.drawsService.delete(id);
    } catch (error) {
      throw new NotFoundException('Sorteio não encontrado');
    }
  }
}
