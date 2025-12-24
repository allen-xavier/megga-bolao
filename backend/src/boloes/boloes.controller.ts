import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Delete,
  UseGuards,
  ForbiddenException,
  Res,
  NotFoundException,
} from "@nestjs/common";
import { Response } from "express";
import { BoloesService } from "./boloes.service";
import { CreateBolaoDto } from "./dto/create-bolao.dto";
import { UpdateBolaoDto } from "./dto/update-bolao.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../users/decorators/current-user.decorator";
import { UserProfile, UserRole } from "../users/entities/user.entity";
import { TransparencyService } from "../transparency/transparency.service";

@Controller("boloes")
export class BoloesController {
  constructor(
    private readonly boloesService: BoloesService,
    private readonly transparencyService: TransparencyService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@CurrentUser() user: UserProfile) {
    return this.boloesService.list(user);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  findOne(@Param("id") id: string, @CurrentUser() user: UserProfile) {
    return this.boloesService.findOne(id, user);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateBolaoDto, @CurrentUser() user: UserProfile) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Apenas administradores podem criar boloes");
    }
    return this.boloesService.create(dto, user.id);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard)
  update(@Param("id") id: string, @Body() dto: UpdateBolaoDto, @CurrentUser() user: UserProfile) {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPERVISOR) {
      throw new ForbiddenException("Usuario sem permissao");
    }
    return this.boloesService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  async remove(@Param("id") id: string, @CurrentUser() user: UserProfile) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Apenas administradores podem excluir boloes");
    }
    return this.boloesService.remove(id);
  }

  @Get(":id/transparency")
  async downloadTransparency(@Param("id") id: string, @Res() res: Response) {
    const bolao = await this.boloesService.getSchedule(id);
    if (!bolao) {
      throw new NotFoundException("Bolao nao encontrado");
    }
    const startsAt = new Date(bolao.startsAt);
    const hasStarted = !Number.isNaN(startsAt.getTime()) && startsAt.getTime() <= Date.now();
    const isClosed = Boolean(bolao.closedAt);
    if (!hasStarted && !isClosed) {
      throw new NotFoundException("Arquivo de transparência só fica disponível quando o bolão inicia");
    }
    const pdf = await this.transparencyService.buildPdfForBolao(id);
    if (!pdf) {
      throw new NotFoundException("Arquivo de transparência não disponível");
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${pdf.filename}"`);
    return res.end(pdf.buffer);
  }
}
