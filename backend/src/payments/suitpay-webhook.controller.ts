import { Body, Controller, HttpCode, Post, Req } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { Request } from "express";

@Controller("payments/webhooks/suitpay")
export class SuitpayWebhookController {
  constructor(private readonly paymentsService: PaymentsService) {}

  private readonly debug = process.env.SUITPAY_WEBHOOK_DEBUG === "true";

  private maskValue(value?: string) {
    if (!value) return "";
    const text = String(value);
    if (text.length <= 6) return text;
    return `${text.slice(0, 2)}***${text.slice(-2)}`;
  }

  private sanitizePayload(payload: Record<string, any>) {
    return {
      ...payload,
      payerTaxId: this.maskValue(payload.payerTaxId),
      destinationTaxId: this.maskValue(payload.destinationTaxId),
      paymentCode: payload.paymentCode ? `${String(payload.paymentCode).slice(0, 10)}...` : undefined,
      hash: payload.hash ? `${String(payload.hash).slice(0, 10)}...` : undefined,
    };
  }

  private getHeaderValue(req: Request, name: string) {
    const raw = req.headers[name.toLowerCase()];
    if (Array.isArray(raw)) return raw[0];
    if (typeof raw === "string") return raw;
    return undefined;
  }

  private getForwardedIps(req: Request) {
    const forwarded = req.headers["x-forwarded-for"];
    const raw =
      typeof forwarded === "string"
        ? forwarded
        : Array.isArray(forwarded)
        ? forwarded.join(",")
        : "";
    if (!raw) return [] as string[];
    return raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private getSourceIp(req: Request) {
    const forwardedIps = this.getForwardedIps(req);
    return forwardedIps[0] || req.ip || req.socket?.remoteAddress || "";
  }

  @Post("cash-in")
  @HttpCode(200)
  async cashIn(@Body() payload: Record<string, any>, @Req() req: Request) {
    const forwardedIps = this.getForwardedIps(req);
    if (forwardedIps.length) {
      payload.__sourceIpChain = forwardedIps.join(",");
    }
    payload.__sourceIp = this.getSourceIp(req);
    if (!payload.hash) {
      payload.hash =
        this.getHeaderValue(req, "hash") ??
        this.getHeaderValue(req, "x-suitpay-hash") ??
        this.getHeaderValue(req, "x-hash");
    }
    try {
      return await this.paymentsService.handleSuitpayCashIn(payload);
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.warn("[SuitPay cash-in] erro:", err?.response?.message ?? err?.message ?? "Falha");
      if (this.debug) {
        // eslint-disable-next-line no-console
        console.warn("[SuitPay cash-in] payload:", this.sanitizePayload(payload));
      }
      throw err;
    }
  }

  @Post("cash-out")
  @HttpCode(200)
  async cashOut(@Body() payload: Record<string, any>, @Req() req: Request) {
    const forwardedIps = this.getForwardedIps(req);
    if (forwardedIps.length) {
      payload.__sourceIpChain = forwardedIps.join(",");
    }
    payload.__sourceIp = this.getSourceIp(req);
    if (!payload.hash) {
      payload.hash =
        this.getHeaderValue(req, "hash") ??
        this.getHeaderValue(req, "x-suitpay-hash") ??
        this.getHeaderValue(req, "x-hash");
    }
    try {
      return await this.paymentsService.handleSuitpayCashOut(payload);
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.warn("[SuitPay cash-out] erro:", err?.response?.message ?? err?.message ?? "Falha");
      if (this.debug) {
        // eslint-disable-next-line no-console
        console.warn("[SuitPay cash-out] payload:", this.sanitizePayload(payload));
      }
      throw err;
    }
  }
}
