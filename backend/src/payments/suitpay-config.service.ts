import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export type SuitpayConfigState = {
  environment: "sandbox" | "production";
  apiUrl: string;
  clientId: string;
  clientSecret: string;
  webhookSecret?: string | null;
};

@Injectable()
export class SuitpayConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getConfig(): Promise<SuitpayConfigState> {
    const db = await this.prisma.suitpayConfig.findUnique({ where: { id: "current" } });
    if (db) {
      return {
        environment: (db.environment as "sandbox" | "production") ?? "sandbox",
        apiUrl: db.apiUrl,
        clientId: db.clientId,
        clientSecret: db.clientSecret,
        webhookSecret: db.webhookSecret,
      };
    }
    // fallback to env
    return {
      environment: (process.env.SUITPAY_ENV as "sandbox" | "production") ?? "sandbox",
      apiUrl: process.env.SUITPAY_API_URL ?? "https://sandbox.ws.suitpay.app",
      clientId: process.env.SUITPAY_CLIENT_ID ?? "",
      clientSecret: process.env.SUITPAY_CLIENT_SECRET ?? "",
      webhookSecret: process.env.SUITPAY_WEBHOOK_SECRET ?? null,
    };
  }

  async saveConfig(input: Partial<SuitpayConfigState>): Promise<SuitpayConfigState> {
    const current = await this.getConfig();
    const data = {
      environment: input.environment ?? current.environment,
      apiUrl: input.apiUrl ?? current.apiUrl,
      clientId: input.clientId ?? current.clientId,
      clientSecret: input.clientSecret ?? current.clientSecret,
      webhookSecret: input.webhookSecret ?? current.webhookSecret,
    };

    const saved = await this.prisma.suitpayConfig.upsert({
      where: { id: "current" },
      update: data,
      create: { id: "current", ...data },
    });

    return {
      environment: (saved.environment as "sandbox" | "production") ?? "sandbox",
      apiUrl: saved.apiUrl,
      clientId: saved.clientId,
      clientSecret: saved.clientSecret,
      webhookSecret: saved.webhookSecret,
    };
  }
}
