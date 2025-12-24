import { Injectable } from '@nestjs/common';
import { Prisma, TransparencyFile } from '@prisma/client';
import { promises as fs } from 'fs';
import { access } from 'fs/promises';
import { PassThrough } from 'stream';
import { join, dirname } from 'path';
import PDFDocument = require('pdfkit');
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

type PrizeCard = {
  title: string;
  description: string;
  value: number;
};

const BRAZIL_TZ = 'America/Sao_Paulo';
const PRIZE_INFO: Record<string, { title: string; description: string }> = {
  PE_QUENTE: { title: '10 PONTOS', description: 'Ganha quem acertar 10 n\u00fameros primeiro.' },
  PE_FRIO: { title: '0 PONTO', description: 'Ganha quem terminar com menos n\u00fameros.' },
  CONSOLACAO: { title: '9 PONTOS', description: 'Ganha quem finalizar com 9 acertos.' },
  SENA_PRIMEIRO: { title: 'SENA 1\u00ba SORTEIO', description: 'Ganha ao acertar 6 ou mais n\u00fameros no 1\u00ba sorteio.' },
  LIGEIRINHO: { title: 'LIGEIRINHO', description: 'Ganha quem tiver mais acertos no 1\u00ba sorteio.' },
  OITO_ACERTOS: { title: '8 PONTOS', description: 'Ganha quem finalizar com 8 acertos.' },
  INDICACAO_DIRETA: { title: 'INDICA\u00c7\u00c3O DIRETA', description: 'Comiss\u00e3o por indica\u00e7\u00e3o direta.' },
  INDICACAO_INDIRETA: { title: 'INDICA\u00c7\u00c3O INDIRETA', description: 'Comiss\u00e3o por indica\u00e7\u00e3o indireta.' },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDateTime = (value: Date) => {
  if (Number.isNaN(value.getTime())) {
    return '--';
  }
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: BRAZIL_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(value);
};

const abbreviateName = (fullName?: string | null) => {
  if (!fullName) return 'N/I';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'N/I';
  const first = parts[0];
  const rest = parts.slice(1).map((part) => `${part.charAt(0).toUpperCase()}.`);
  return [first, ...rest].join(' ');
};

const toNumber = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const chunkNumbers = (numbers: string[], size: number) => {
  const result: string[][] = [];
  for (let i = 0; i < numbers.length; i += size) {
    result.push(numbers.slice(i, i + size));
  }
  return result;
};

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

  async buildPdfForBolao(bolaoId: string) {
    const bolao = await this.prisma.bolao.findUnique({
      where: { id: bolaoId },
      include: {
        prizes: true,
        bets: {
          include: {
            user: { select: { fullName: true, city: true, state: true } },
          },
        },
      },
    });

    if (!bolao) {
      return null;
    }

    const betsSorted = [...(bolao.bets ?? [])].sort((a, b) =>
      (a.user?.fullName ?? '').localeCompare(b.user?.fullName ?? '', 'pt-BR', { sensitivity: 'base' }),
    );
    if (betsSorted.length === 0) {
      return null;
    }

    const pdfBuffer = await this.renderPdf({
      bolao,
      bets: betsSorted,
      generatedAt: new Date(),
    });

    return {
      buffer: pdfBuffer,
      filename: `transparencia-bolao-${bolaoId}.pdf`,
    };
  }

  private async renderPdf(payload: {
    bolao: any;
    bets: Array<{ id: string; numbers: number[]; user?: { fullName?: string | null; city?: string | null; state?: string | null } }>;
    generatedAt: Date;
  }) {
    const { bolao, bets, generatedAt } = payload;
    const stream = new PassThrough();
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 28,
      autoFirstPage: true,
    });

    doc.pipe(stream);

    const margin = doc.page.margins.left;
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const contentWidth = pageWidth - margin * 2;
    const headerHeight = 56;

    const logoPath = process.env.TRANSPARENCIA_LOGO_PATH ?? join(process.cwd(), 'assets', 'megga-logo.png');
    const mascotPath = process.env.TRANSPARENCIA_MASCOTE_PATH ?? join(process.cwd(), 'assets', 'mascote.png');
    let logoBuffer: Buffer | null = null;
    let mascotBuffer: Buffer | null = null;
    try {
      logoBuffer = await fs.readFile(logoPath);
    } catch {
      logoBuffer = null;
    }
    try {
      mascotBuffer = await fs.readFile(mascotPath);
    } catch {
      mascotBuffer = null;
    }

    const ticketPrice = toNumber(bolao.ticketPrice ?? 0);
    const betsCount = bets.length;
    const commissionPercent = toNumber(bolao.commissionPercent ?? 0);
    const totalCollected = betsCount * ticketPrice;
    const netPool = totalCollected * (1 - commissionPercent / 100);
    const guaranteedPrize = toNumber(bolao.guaranteedPrize ?? 0);
    const prizePool = Math.max(netPool, guaranteedPrize);

    const prizeList = bolao.prizes ?? [];
    const totalFixed = prizeList.reduce((acc: number, prize: any) => acc + toNumber(prize.fixedValue), 0);
    const totalPct = prizeList.reduce((acc: number, prize: any) => acc + toNumber(prize.percentage), 0);
    const variablePool = Math.max(prizePool - totalFixed, 0);
    const prizeCards: PrizeCard[] = prizeList.map((prize: any) => {
      const info = PRIZE_INFO[prize.type] ?? { title: prize.type ?? 'PREMIO', description: '' };
      const percentage = toNumber(prize.percentage);
      const pctShare = totalPct > 0 ? percentage / totalPct : 0;
      const value = toNumber(prize.fixedValue) + variablePool * pctShare;
      return {
        title: info.title,
        description: info.description,
        value,
      };
    });

    const bolaoCode = bolao.id?.slice(0, 6)?.toUpperCase?.() ?? bolao.id;
    const startDate = formatDateTime(new Date(bolao.startsAt));
    const site = process.env.TRANSPARENCIA_SITE ?? '--';
    const instagram = process.env.TRANSPARENCIA_INSTAGRAM ?? '--';
    const whatsapp = process.env.TRANSPARENCIA_WHATSAPP ?? '--';

    const drawImage = (
      buffer: Buffer | null,
      x: number,
      y: number,
      options: { width?: number; height?: number; fit?: [number, number] },
    ) => {
      if (!buffer) return;
      try {
        doc.image(buffer, x, y, options);
      } catch {
        // Ignora imagens invalidas para nao falhar o PDF.
      }
    };

    const drawHeader = () => {
      const mascotSize = 46;
      const mascotOffset = mascotBuffer ? mascotSize + 12 : 0;
      doc.save();
      doc.rect(margin, margin, contentWidth, headerHeight).fill('#0b1220');
      drawImage(logoBuffer, margin + 12, margin + 6, { width: 44, height: 44 });
      drawImage(mascotBuffer, margin + contentWidth - mascotSize - 12, margin + (headerHeight - mascotSize) / 2, {
        fit: [mascotSize, mascotSize],
      });
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(20);
      doc.text('MEGGA BOL\u00c3O', margin, margin + 16, { width: contentWidth, align: 'center' });
      doc.font('Helvetica').fontSize(9).fillColor('#ffffff');
      doc.text(`Gerado em ${formatDateTime(generatedAt)}`, margin + contentWidth - 220 - mascotOffset, margin + 20, {
        width: 210,
        align: 'right',
      });
      doc.restore();
    };

    drawHeader();

    let y = margin + headerHeight + 12;

    const infoHeight = 120;
    doc.roundedRect(margin, y, contentWidth, infoHeight, 12).fill('#eef2f6');
    doc.fillColor('#0f1117').font('Helvetica-Bold').fontSize(16);
    doc.text(`${bolao.name}  #${bolaoCode}`, margin + 16, y + 14, { width: contentWidth - 32 });
    doc.font('Helvetica-Oblique').fontSize(10).fillColor('#374151');
    doc.text('V\u00e1rios Sorteios - at\u00e9 sair um ganhador de 10 Pontos!', margin + 16, y + 36, {
      width: contentWidth - 32,
    });

    const infoBoxY = y + 56;
    const infoBoxHeight = 46;
    const infoGap = 10;
    const infoBoxWidth = (contentWidth - infoGap * 3) / 4;
    const infoLabels = [
      { label: 'In\u00edcio', value: startDate },
      { label: 'Valor da aposta', value: formatCurrency(ticketPrice) },
      { label: 'Total em pr\u00eamios', value: `${prizeCards.length} pr\u00eamio${prizeCards.length === 1 ? '' : 's'}` },
      { label: 'Premia\u00e7\u00e3o total', value: formatCurrency(prizePool) },
    ];

    infoLabels.forEach((item, index) => {
      const boxX = margin + index * (infoBoxWidth + infoGap);
      doc.roundedRect(boxX, infoBoxY, infoBoxWidth, infoBoxHeight, 10).fill('#ffffff');
      doc.fillColor('#6b7280').font('Helvetica').fontSize(8);
      doc.text(item.label, boxX + 10, infoBoxY + 8, { width: infoBoxWidth - 20 });
      doc.fillColor('#0f1117').font('Helvetica-Bold').fontSize(11);
      doc.text(item.value, boxX + 10, infoBoxY + 22, { width: infoBoxWidth - 20 });
    });

    y = y + infoHeight + 8;
    doc.fillColor('#0f1117').font('Helvetica').fontSize(9);
    doc.text(`Site: ${site}  |  Instagram: ${instagram}  |  WhatsApp: ${whatsapp}`, margin, y, {
      width: contentWidth,
      align: 'center',
    });

    y += 20;
    doc.fillColor('#0f1117').font('Helvetica-Bold').fontSize(13);
    doc.text('Detalhes das premia\u00e7\u00f5es', margin, y);
    y += 18;

    if (prizeCards.length === 0) {
      doc.fillColor('#6b7280').font('Helvetica').fontSize(10);
      doc.text('Nenhuma premia\u00e7\u00e3o configurada.', margin, y);
      y += 18;
    } else {
      const columns = Math.min(4, prizeCards.length);
      const cardGap = 10;
      const cardWidth = (contentWidth - cardGap * (columns - 1)) / columns;
      const cardHeight = 72;
      prizeCards.forEach((card, index) => {
        const row = Math.floor(index / columns);
        const col = index % columns;
        const cardX = margin + col * (cardWidth + cardGap);
        const cardY = y + row * (cardHeight + cardGap);
        doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 10).fill('#f8fafc');
        doc.rect(cardX, cardY, cardWidth, 6).fill('#f7b500');
        doc.fillColor('#0f1117').font('Helvetica-Bold').fontSize(10);
        doc.text(card.title, cardX + 10, cardY + 12, { width: cardWidth - 20 });
        doc.fillColor('#6b7280').font('Helvetica').fontSize(8);
        doc.text(card.description, cardX + 10, cardY + 26, { width: cardWidth - 20 });
        doc.fillColor('#111827').font('Helvetica-Bold').fontSize(12);
        doc.text(formatCurrency(card.value), cardX + 10, cardY + 48, { width: cardWidth - 20 });
      });

      const rows = Math.ceil(prizeCards.length / columns);
      y += rows * cardHeight + (rows - 1) * cardGap + 16;
    }

    const tableTitleHeight = 24;
    const tableHeaderHeight = 22;
    const tableGap = 8;

    const tableColumns = {
      bilhete: 90,
      apostador: 200,
      cidade: 150,
    };
    const dezenasWidth = contentWidth - tableColumns.bilhete - tableColumns.apostador - tableColumns.cidade;

    const drawTableHeader = (startY: number) => {
      doc.rect(margin, startY, contentWidth, tableHeaderHeight).fill('#1b2a40');
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
      doc.text('BILHETE', margin + 8, startY + 6, { width: tableColumns.bilhete - 12 });
      doc.text('APOSTADOR', margin + tableColumns.bilhete + 8, startY + 6, { width: tableColumns.apostador - 12 });
      doc.text('CIDADE/UF', margin + tableColumns.bilhete + tableColumns.apostador + 8, startY + 6, {
        width: tableColumns.cidade - 12,
      });
      doc.text('DEZENAS JOGADAS', margin + tableColumns.bilhete + tableColumns.apostador + tableColumns.cidade + 8, startY + 6, {
        width: dezenasWidth - 12,
      });
      doc.font('Helvetica');
    };

    const drawTableTitle = (startY: number) => {
      doc.rect(margin, startY, contentWidth, tableTitleHeight).fill('#6d2b2b');
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(12);
      doc.text('TABELA DE CONFER\u00caNCIA (A-Z)', margin, startY + 6, { width: contentWidth, align: 'center' });
      doc.font('Helvetica');
    };

    if (y + tableTitleHeight + tableHeaderHeight + tableGap > pageHeight - margin) {
      doc.addPage();
      drawHeader();
      y = margin + headerHeight + 12;
    }

    drawTableTitle(y);
    y += tableTitleHeight + tableGap;
    drawTableHeader(y);
    y += tableHeaderHeight;

    const baseRowHeight = 22;
    const numberFontSize = 9;
    const lineHeight = 12;

    bets.forEach((bet, index) => {
      const rawNumbers = Array.isArray(bet.numbers) ? bet.numbers : [];
      const numbers = rawNumbers
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value))
        .sort((a, b) => a - b)
        .map((value) => value.toString().padStart(2, '0'));
      const lines = chunkNumbers(numbers, 10).map((line) => line.join(' '));
      const rowHeight = Math.max(baseRowHeight, lines.length * lineHeight + 8);

      if (y + rowHeight > pageHeight - margin) {
        doc.addPage();
        drawHeader();
        y = margin + headerHeight + 12;
        drawTableTitle(y);
        y += tableTitleHeight + tableGap;
        drawTableHeader(y);
        y += tableHeaderHeight;
      }

      const betId = typeof bet.id === 'string' ? bet.id : String(bet.id ?? '');

      doc.rect(margin, y, contentWidth, rowHeight).fill(index % 2 === 0 ? '#ffffff' : '#f3f4f6');
      doc.fillColor('#111827').font('Helvetica').fontSize(9);
      doc.text(betId.slice(0, 8).toUpperCase(), margin + 8, y + 6, { width: tableColumns.bilhete - 12 });
      doc.text(abbreviateName(bet.user?.fullName), margin + tableColumns.bilhete + 8, y + 6, {
        width: tableColumns.apostador - 12,
      });
      const city = bet.user?.city ?? 'N/I';
      const state = bet.user?.state ?? 'N/I';
      doc.text(`${city} - ${state}`, margin + tableColumns.bilhete + tableColumns.apostador + 8, y + 6, {
        width: tableColumns.cidade - 12,
      });
      doc.fontSize(numberFontSize);
      doc.text(lines.join('\n'), margin + tableColumns.bilhete + tableColumns.apostador + tableColumns.cidade + 8, y + 6, {
        width: dezenasWidth - 12,
        lineGap: 2,
      });

      y += rowHeight;
    });

    const output = new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });

    doc.end();
    return output;
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
