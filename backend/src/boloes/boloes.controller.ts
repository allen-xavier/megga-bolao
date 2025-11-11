import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  ForbiddenException,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { BoloesService } from './boloes.service';
import { CreateBolaoDto } from './dto/create-bolao.dto';
import { UpdateBolaoDto } from './dto/update-bolao.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../users/decorators/current-user.decorator';
import { UserProfile, UserRole } from '../users/entities/user.entity';
import { Response } from 'express';
import { TransparencyService } from '../transparency/transparency.service';

@Controller('boloes')
export class BoloesController {
  constructor(
    private readonly boloesService: BoloesService,
    private readonly transparencyService: TransparencyService,
  ) {}

  @Get()
  list() {
    return this.boloesService.list();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.boloesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateBolaoDto, @CurrentUser() user: UserProfile) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Apenas administradores podem criar bolões');
    }
    return this.boloesService.create(dto, user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateBolaoDto, @CurrentUser() user: UserProfile) {
    if (![UserRole.ADMIN, UserRole.SUPERVISOR].includes(user.role)) {
      throw new ForbiddenException('Usuário sem permissão');
    }
    return this.boloesService.update(id, dto);
  }

  @Get(':id/transparency')
  async downloadTransparency(@Param('id') id: string, @Res() res: Response) {
    const file = await this.transparencyService.getFileForBolao(id);
    if (!file) {
      throw new NotFoundException('Arquivo de transparência não disponível');
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    return res.download(file.absolutePath, file.filename);
  }
}
