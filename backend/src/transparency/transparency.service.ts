import { Injectable } from '@nestjs/common';
import { Prisma, TransparencyFile } from '@prisma/client';
import { promises as fs } from 'fs';
import { access } from 'fs/promises';
import { join, dirname } from 'path';
import { PrismaService } from '../prisma/prisma.service';

interface TransparencySnapshot {
  betId: string;
  firstName: string;
  city?: string | null;
  state?: string | null;
  mode: 'manual' | 'surpresinha';
  numbers: number[];
  createdAt: Date;
}

@Injectable()
export class TransparencyService {
  private readonly storageRoot = join(process.cwd(), 'storage');
  private readonly transparencyDir = join(this.storageRoot, 'transparency');

  constructor(private readonly prisma: PrismaService) {}

  async ensureRecord(
    tx: Prisma.TransactionClient,
    bolaoId: string,
  ): Promise<TransparencyFile> {
    const existing = await tx.transparencyFile.findUnique({ where: { bolaoId } });
    if (existing) {
      return existing;
    }

    await fs.mkdir(this.transparencyDir, { recursive: true });
    const filePath = join('transparency', `bolao-${bolaoId}.csv`).replace(/\\/g, '/');

    return tx.transparencyFile.create({
      data: {
        bolaoId,
        filePath,
      },
    });
  }

  async appendSnapshot(filePath: string, snapshot: TransparencySnapshot) {
    await fs.mkdir(dirname(join(this.storageRoot, filePath)), { recursive: true });

    const absolutePath = join(this.storageRoot, filePath);
    const header = 'bet_id;primeiro_nome;cidade;estado;modo;numeros;registrado_em\n';

    try {
      await access(absolutePath);
    } catch {
      await fs.writeFile(absolutePath, header, 'utf8');
    }

    const formattedNumbers = [...snapshot.numbers]
      .sort((a, b) => a - b)
      .map((value) => value.toString().padStart(2, '0'))
      .join(' ');

    const line = [
      snapshot.betId,
      snapshot.firstName,
      snapshot.city ?? 'N/I',
      snapshot.state ?? 'N/I',
      snapshot.mode,
      formattedNumbers,
      snapshot.createdAt.toISOString(),
    ].join(';');

    await fs.appendFile(absolutePath, `${line}\n`, 'utf8');
  }

  async getFileForBolao(bolaoId: string) {
    const transparency = await this.prisma.transparencyFile.findUnique({ where: { bolaoId } });
    if (!transparency) {
      return null;
    }

    const absolutePath = join(this.storageRoot, transparency.filePath);
    try {
      await access(absolutePath);
    } catch {
      return null;
    }

    const filename = `transparencia-bolao-${bolaoId}.csv`;
    return {
      absolutePath,
      filename,
      transparency,
    };
  }
}
