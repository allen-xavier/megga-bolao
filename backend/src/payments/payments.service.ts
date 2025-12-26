import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentStatus, PaymentType, Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';
import { PassThrough } from 'stream';
import PDFDocument = require('pdfkit');
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { RequestDepositDto } from './dto/request-deposit.dto';
import { RequestWithdrawDto } from './dto/request-withdraw.dto';
import { SuitpayConfigService } from './suitpay-config.service';
import { SuitpayClientService } from './suitpay-client.service';

@Injectable()
export class PaymentsService {
  private readonly storageRoot = join(process.cwd(), 'storage');
  private readonly receiptsDir = join(this.storageRoot, 'receipts');

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly suitpayConfig: SuitpayConfigService,
    private readonly suitpay: SuitpayClientService,
  ) {}

  private getWebhookBaseUrl() {
    const explicit = process.env.SUITPAY_WEBHOOK_BASE;
    const origin = process.env.WEB_ORIGIN?.split(',')[0];
    const base = explicit || origin || '';
    return base.replace(/\/$/, '');
  }

  private getCallbackUrl(path: string) {
    const base = this.getWebhookBaseUrl();
    if (!base) return undefined;
    return `${base}${path}`;
  }

  private formatSuitpayDate(value: Date) {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(value);
  }

  private async saveReceiptBuffer(paymentId: string, buffer: Buffer, prefix: string) {
    await fs.mkdir(this.receiptsDir, { recursive: true });
    const filename = `${prefix}-${paymentId}.pdf`;
    const relativePath = join('receipts', filename).replace(/\\/g, '/');
    const absolutePath = join(this.storageRoot, relativePath);
    await fs.writeFile(absolutePath, buffer);
    return {
      path: relativePath,
      mime: 'application/pdf',
      filename,
    };
  }

  private decodeBase64(payload: string) {
    const cleaned = payload.includes(',')
      ? payload.slice(payload.indexOf(',') + 1)
      : payload;
    return Buffer.from(cleaned, 'base64');
  }

  private async fetchCepInfo(cep: string) {
    const normalized = String(cep ?? '').replace(/\D/g, '');
    if (normalized.length !== 8) return null;
    try {
      const response = await fetch(`https://viacep.com.br/ws/${normalized}/json/`);
      if (!response.ok) return null;
      const data = (await response.json()) as {
        erro?: boolean;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
        ibge?: string;
      };
      if (data.erro) return null;
      return data;
    } catch {
      return null;
    }
  }

  private async buildDepositReceiptPdf(params: {
    paymentId: string;
    amount: number;
    userName: string;
    userCpf: string;
    paymentCode: string;
    paymentCodeBase64: string;
    generatedAt: Date;
  }) {
    const doc = new PDFDocument({ size: 'A4', margin: 36 });
    const stream = new PassThrough();
    doc.pipe(stream);

    const logoPath = join(process.cwd(), 'assets', 'megga-logo.png');
    let logoBuffer: Buffer | null = null;
    try {
      logoBuffer = await fs.readFile(logoPath);
    } catch {
      logoBuffer = null;
    }

    if (logoBuffer) {
      doc.image(logoBuffer, doc.page.margins.left, 24, { height: 36 });
    }

    doc.font('Helvetica-Bold').fontSize(18).text('MEGGA BOLAO', { align: 'center' });
    doc.moveDown(0.2);
    doc.font('Helvetica').fontSize(12).text('Comprovante de deposito PIX', { align: 'center' });
    doc.moveDown(1);

    doc.font('Helvetica-Bold').fontSize(12).text('Dados do deposito');
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(11);
    doc.text(`Pagamento: ${params.paymentId}`);
    doc.text(`Nome: ${params.userName}`);
    doc.text(`CPF: ${params.userCpf}`);
    doc.text(`Valor: R$ ${params.amount.toFixed(2)}`);
    doc.text(`Gerado em: ${params.generatedAt.toLocaleString('pt-BR')}`);
    doc.moveDown(1);

    const qrBuffer = this.decodeBase64(params.paymentCodeBase64);
    const qrSize = 200;
    const qrX = (doc.page.width - qrSize) / 2;
    doc.image(qrBuffer, qrX, doc.y, { fit: [qrSize, qrSize] });
    doc.moveDown(1);

    doc.font('Helvetica-Bold').fontSize(11).text('Codigo de pagamento');
    doc.font('Helvetica').fontSize(9).text(params.paymentCode, { width: doc.page.width - doc.page.margins.left * 2 });

    const output = new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });

    doc.end();
    return output;
  }

  private buildSuitpayHash(values: Array<string | number | undefined>, secret: string) {
    const combined = values.map((value) => String(value ?? '')).join('') + secret;
    return createHash('sha256').update(combined).digest('hex');
  }

  private async sendWithdrawToSuitpay(
    payment: { id: string; userId: string; amount: Prisma.Decimal; metadata?: any; providerId?: string | null },
    user: { cpf: string; pixKey: string; pixKeyType: string },
    approvedBy?: string,
  ) {
    if (payment.providerId) {
      if (approvedBy) {
        return this.prisma.payment.update({
          where: { id: payment.id },
          data: { approvedBy },
        });
      }
      return payment;
    }
    const callbackUrl = this.getCallbackUrl('/api/payments/webhooks/suitpay/cash-out');
    try {
      const response = await this.suitpay.requestPixOut({
        value: Number(payment.amount),
        key: user.pixKey,
        typeKey: user.pixKeyType,
        callbackUrl,
        documentValidation: user.cpf,
        externalId: payment.id,
      });
      return this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          provider: 'SUITPAY',
          providerId: response.idTransaction,
          externalId: payment.id,
          approvedBy,
          metadata: {
            ...((payment.metadata ?? {}) as any),
            sentToSuitpay: true,
            suitpayResponse: response.response,
          },
        },
      });
    } catch (err: any) {
      const reason = err?.response?.data?.response ?? err?.response?.data?.message ?? err?.message ?? 'Falha ao enviar saque';
      await this.failWithdraw(payment.id, String(reason));
      throw new BadRequestException(String(reason));
    }
  }

  async requestDeposit(userId: string, dto: RequestDepositDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        fullName: true,
        cpf: true,
        phone: true,
        email: true,
        cep: true,
        address: true,
        addressNumber: true,
        addressComplement: true,
        city: true,
        state: true,
      },
    });
    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }
    if (!user.email) {
      throw new BadRequestException('Email obrigatorio para gerar PIX.');
    }

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        amount: dto.amount,
        type: PaymentType.DEPOSIT,
        status: PaymentStatus.PENDING,
        provider: 'SUITPAY',
        metadata: { reference: dto.reference, method: 'PIX' },
      },
    });

    const requestNumber = payment.id;
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { externalId: requestNumber },
    });
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1);

    const cpfDigits = String(user.cpf ?? '').replace(/\D/g, '');
    const phoneDigitsRaw = String(user.phone ?? '').replace(/\D/g, '');
    const phoneDigits =
      phoneDigitsRaw.startsWith('55') && phoneDigitsRaw.length > 11
        ? phoneDigitsRaw.slice(2)
        : phoneDigitsRaw;

    const cepInfo = user.cep ? await this.fetchCepInfo(user.cep) : null;
    const addressPayload =
      cepInfo?.ibge
        ? {
            codIbge: cepInfo.ibge,
            zipCode: String(user.cep ?? '').replace(/\D/g, ''),
            street: cepInfo.logradouro ?? user.address ?? '',
            number: user.addressNumber ?? 'S/N',
            complement: user.addressComplement ?? '',
            neighborhood: cepInfo.bairro ?? '',
            city: cepInfo.localidade ?? user.city ?? '',
            state: cepInfo.uf ?? user.state ?? '',
          }
        : undefined;

    const callbackUrl = this.getCallbackUrl('/api/payments/webhooks/suitpay/cash-in');

    try {
      const response = await this.suitpay.requestPixIn({
        requestNumber,
        dueDate: this.formatSuitpayDate(dueDate),
        amount: dto.amount,
        shippingAmount: 0,
        discountAmount: 0,
        usernameCheckout: 'megga-bolao',
        callbackUrl,
        client: {
          name: user.fullName,
          document: cpfDigits,
          phoneNumber: phoneDigits,
          email: user.email,
          ...(addressPayload ? { address: addressPayload } : {}),
        },
      });

      const receiptBuffer = await this.buildDepositReceiptPdf({
        paymentId: payment.id,
        amount: Number(payment.amount),
        userName: user.fullName,
        userCpf: user.cpf,
        paymentCode: response.paymentCode,
        paymentCodeBase64: response.paymentCodeBase64,
        generatedAt: new Date(),
      });
      const receipt = await this.saveReceiptBuffer(payment.id, receiptBuffer, 'deposito');

      const updated = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          providerId: response.idTransaction,
          externalId: requestNumber,
          receiptPath: receipt.path,
          receiptMime: receipt.mime,
          receiptFilename: receipt.filename,
          metadata: {
            reference: dto.reference,
            method: 'PIX',
            requestNumber,
            paymentCode: response.paymentCode,
          },
        },
      });

      return {
        id: updated.id,
        amount: updated.amount,
        status: updated.status,
        paymentCode: response.paymentCode,
        paymentCodeBase64: response.paymentCodeBase64,
        receiptAvailable: true,
      };
    } catch (err: any) {
      const reason =
        err?.response?.data?.response ??
        err?.response?.data?.message ??
        err?.message ??
        'Falha ao gerar PIX.';
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          metadata: { ...((payment.metadata ?? {}) as any), error: reason },
        },
      });
      throw new BadRequestException(String(reason));
    }
  }

  async confirmDeposit(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.type !== PaymentType.DEPOSIT) {
      throw new NotFoundException('Deposito nao encontrado');
    }
    if (payment.status === PaymentStatus.COMPLETED) {
      return payment;
    }
    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.COMPLETED, processedAt: new Date() },
    });
    await this.walletService.credit(updated.userId, Number(updated.amount), 'Deposito confirmado', updated.id);
    return updated;
  }

  async requestWithdraw(userId: string, dto: RequestWithdrawDto) {
    if (dto.amount < 50) {
      throw new BadRequestException('Saque minimo de R$ 50,00');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { cpf: true, pixKey: true, pixKeyType: true },
    });
    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }
    const cpfDigits = String(user.cpf ?? '').replace(/\D/g, '');
    const pixDigits = String(user.pixKey ?? '').replace(/\D/g, '');
    if (user.pixKeyType !== 'document' || !pixDigits || pixDigits !== cpfDigits) {
      throw new BadRequestException('O saque deve ser para o CPF cadastrado.');
    }
    const wallet = await this.walletService.getWallet(userId);
    if (!wallet || Number(wallet.balance) < dto.amount) {
      throw new BadRequestException('Saldo insuficiente para saque');
    }
    const config = await this.suitpayConfig.getConfig();
    const autoLimit = Number(config.autoApprovalLimit ?? 0);
    const shouldAutoApprove = autoLimit > 0 && dto.amount <= autoLimit;
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        amount: dto.amount,
        type: PaymentType.WITHDRAW,
        status: PaymentStatus.PROCESSING,
        provider: 'SUITPAY',
        metadata: {
          note: dto.note,
          auto: shouldAutoApprove,
          requiresApproval: !shouldAutoApprove,
        },
      },
    });

    await this.walletService.reserve(userId, dto.amount, 'Saque solicitado', payment.id);
    if (shouldAutoApprove) {
      const updated = await this.sendWithdrawToSuitpay(
        payment,
        { cpf: cpfDigits, pixKey: user.pixKey ?? '', pixKeyType: user.pixKeyType ?? 'document' },
      );
      return updated;
    }
    return payment;
  }

  async completeWithdraw(paymentId: string, approvedBy?: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.type !== PaymentType.WITHDRAW) {
      throw new NotFoundException('Saque nao encontrado');
    }
    if (payment.status === PaymentStatus.COMPLETED) {
      return payment;
    }
    if (payment.status === PaymentStatus.CANCELED || payment.status === PaymentStatus.FAILED) {
      throw new BadRequestException('Saque ja finalizado');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: payment.userId },
      select: { cpf: true, pixKey: true, pixKeyType: true },
    });
    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }
    return this.sendWithdrawToSuitpay(
      payment,
      { cpf: String(user.cpf ?? '').replace(/\D/g, ''), pixKey: user.pixKey ?? '', pixKeyType: user.pixKeyType ?? 'document' },
      approvedBy,
    );
  }

  async failWithdraw(paymentId: string, reason?: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.type !== PaymentType.WITHDRAW) {
      throw new NotFoundException('Saque nao encontrado');
    }
    if (payment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Saque ja concluido');
    }
    if (payment.status === PaymentStatus.CANCELED || payment.status === PaymentStatus.FAILED) {
      return payment;
    }
    await this.walletService.release(payment.userId, Number(payment.amount), 'Saque estornado', payment.id);
    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.FAILED,
        processedAt: new Date(),
        metadata: { ...((payment.metadata ?? {}) as any), reason },
      },
    });
  }

  async handleSuitpayCashIn(payload: Record<string, any>) {
    const config = await this.suitpayConfig.getConfig();
    const expected = this.buildSuitpayHash(
      [
        payload.idTransaction,
        payload.typeTransaction,
        payload.statusTransaction,
        payload.value,
        payload.payerName,
        payload.payerTaxId,
        payload.paymentDate,
        payload.paymentCode,
        payload.requestNumber,
      ],
      config.clientSecret,
    );
    if (!payload.hash || expected !== payload.hash) {
      throw new BadRequestException('Hash invalido');
    }

    const requestNumber = String(payload.requestNumber ?? '');
    const payment = await this.prisma.payment.findFirst({
      where: {
        type: PaymentType.DEPOSIT,
        OR: [
          { externalId: requestNumber },
          { metadata: { path: ['requestNumber'], equals: requestNumber } },
        ],
      },
    });
    if (!payment) {
      throw new NotFoundException('Deposito nao encontrado');
    }

    const status = String(payload.statusTransaction ?? '').toUpperCase();
    if (status === 'PAID_OUT') {
      if (payment.status !== PaymentStatus.COMPLETED) {
        await this.prisma.$transaction(async (tx) => {
          const updated = await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.COMPLETED,
              processedAt: new Date(),
              providerId: payload.idTransaction ?? payment.providerId,
              metadata: {
                ...((payment.metadata ?? {}) as any),
                suitpayStatus: status,
              },
            },
          });
          await this.walletService.credit(
            updated.userId,
            Number(updated.amount),
            'Deposito confirmado',
            updated.id,
            tx,
          );
        });
      }
      return { ok: true };
    }

    if (status === 'CHARGEBACK') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          processedAt: new Date(),
          metadata: { ...((payment.metadata ?? {}) as any), suitpayStatus: status },
        },
      });
      return { ok: true };
    }

    return { ok: true };
  }

  async handleSuitpayCashOut(payload: Record<string, any>) {
    const config = await this.suitpayConfig.getConfig();
    const expected = this.buildSuitpayHash(
      [
        payload.idTransaction,
        payload.typeTransaction,
        payload.statusTransaction,
        payload.value,
        payload.destinationName,
        payload.destinationTaxId,
        payload.destinationBank,
      ],
      config.clientSecret,
    );
    if (!payload.hash || expected !== payload.hash) {
      throw new BadRequestException('Hash invalido');
    }

    const payment = await this.prisma.payment.findFirst({
      where: {
        type: PaymentType.WITHDRAW,
        providerId: String(payload.idTransaction ?? ''),
      },
    });
    if (!payment) {
      throw new NotFoundException('Saque nao encontrado');
    }

    const status = String(payload.statusTransaction ?? '').toUpperCase();
    if (status === 'PAID_OUT') {
      if (payment.status !== PaymentStatus.COMPLETED) {
        await this.prisma.$transaction(async (tx) => {
          const updated = await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.COMPLETED,
              processedAt: new Date(),
              metadata: { ...((payment.metadata ?? {}) as any), suitpayStatus: status },
            },
          });
          await this.walletService.finalizeWithdraw(updated.userId, Number(updated.amount), tx);
        });
      }

      try {
        const receipt = await this.suitpay.getPixOutReceipt(String(payload.idTransaction ?? ''));
        if (receipt?.pdfBase64 && !payment.receiptPath) {
          const buffer = this.decodeBase64(receipt.pdfBase64);
          const saved = await this.saveReceiptBuffer(payment.id, buffer, 'saque');
          await this.prisma.payment.update({
            where: { id: payment.id },
            data: {
              receiptPath: saved.path,
              receiptMime: saved.mime,
              receiptFilename: saved.filename,
            },
          });
        }
      } catch {
        // ignora erro de comprovante
      }

      return { ok: true };
    }

    if (status === 'CANCELED') {
      await this.failWithdraw(payment.id, 'Saque cancelado pelo provedor');
      return { ok: true };
    }

    return { ok: true };
  }

  async getReceipt(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) {
      throw new NotFoundException('Pagamento nao encontrado');
    }
    if (!payment.receiptPath) {
      throw new NotFoundException('Comprovante nao disponivel');
    }
    const absolutePath = join(this.storageRoot, payment.receiptPath);
    try {
      await fs.access(absolutePath);
    } catch {
      throw new NotFoundException('Comprovante nao encontrado');
    }
    return {
      absolutePath,
      filename: payment.receiptFilename ?? `comprovante-${payment.id}.pdf`,
      mime: payment.receiptMime ?? 'application/pdf',
      payment,
    };
  }

  async listWithdraws(
    status?: PaymentStatus,
    userId?: string,
    search?: string,
    from?: Date,
    to?: Date,
    page?: number,
    perPage?: number,
  ) {
    const where: Prisma.PaymentWhereInput = { type: PaymentType.WITHDRAW };
    if (status) {
      where.status = status;
    }
    if (userId) {
      where.userId = userId;
    }
    if (from || to) {
      where.createdAt = {};
      if (from) {
        where.createdAt.gte = from;
      }
      if (to) {
        where.createdAt.lte = to;
      }
    }
    const trimmed = search?.trim();
    if (trimmed) {
      const digits = trimmed.replace(/\D/g, "");
      const or: Prisma.PaymentWhereInput[] = [
        { user: { fullName: { contains: trimmed, mode: "insensitive" } } },
        { user: { pixKey: { contains: trimmed, mode: "insensitive" } } },
      ];
      if (digits) {
        or.push({ user: { cpf: { contains: digits } } });
      }
      where.OR = or;
    }
    const shouldPaginate = Boolean(perPage && perPage > 0);
    const safePage = Math.max(1, page ?? 1);
    const safePerPage = shouldPaginate ? Math.max(1, perPage ?? 1) : undefined;
    return this.prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: shouldPaginate ? (safePage - 1) * (safePerPage ?? 0) : undefined,
      take: safePerPage,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            cpf: true,
            pixKey: true,
            phone: true,
            email: true,
          },
        },
      },
    });
  }

  async listUserPayments(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
