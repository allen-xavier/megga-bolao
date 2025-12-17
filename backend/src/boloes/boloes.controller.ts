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
    const file = await this.transparencyService.getFileForBolao(id);
    if (!file) {
      throw new NotFoundException("Arquivo de transparencia nao disponivel");
    }

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);
    return res.download(file.absolutePath, file.filename);
  }
}
