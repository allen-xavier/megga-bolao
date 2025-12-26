import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { SuitpayConfigService } from "./suitpay-config.service";

type SuitpayResponse<T> = T;

export type SuitpayPixInResponse = {
  idTransaction: string;
  paymentCode: string;
  response: string;
  paymentCodeBase64: string;
};

export type SuitpayPixOutResponse = {
  idTransaction: string;
  response: string;
};

export type SuitpayReceiptResponse = {
  pdfBase64: string;
};

@Injectable()
export class SuitpayClientService {
  constructor(
    private readonly http: HttpService,
    private readonly configService: SuitpayConfigService,
  ) {}

  private async request<T>(
    method: "get" | "post",
    path: string,
    body?: Record<string, unknown>,
    params?: Record<string, string>,
  ): Promise<SuitpayResponse<T>> {
    const config = await this.configService.getConfig();
    const url = `${config.apiUrl}${path}`;
    const headers = {
      ci: config.clientId,
      cs: config.clientSecret,
    };
    const response$ = this.http.request<T>({
      method,
      url,
      headers,
      data: body,
      params,
    });
    const response = await firstValueFrom(response$);
    return response.data;
  }

  async requestPixIn(payload: Record<string, unknown>) {
    return this.request<SuitpayPixInResponse>("post", "/api/v1/gateway/request-qrcode", payload);
  }

  async requestPixOut(payload: Record<string, unknown>) {
    return this.request<SuitpayPixOutResponse>("post", "/api/v1/gateway/pix-payment", payload);
  }

  async getPixOutReceipt(idTransaction: string) {
    return this.request<SuitpayReceiptResponse>("get", "/api/v1/gateway/get-receipt-pix-cashout", undefined, {
      idTransaction,
    });
  }

  async testConnection() {
    const config = await this.configService.getConfig();
    if (!config.apiUrl || !config.clientId || !config.clientSecret) {
      return {
        ok: false,
        status: 400,
        message: "Configuracao da SuitPay incompleta.",
      };
    }

    try {
      const response = await firstValueFrom(
        this.http.request({
          method: "get",
          url: `${config.apiUrl}/api/v1/gateway/get-receipt-pix-cashout`,
          headers: { ci: config.clientId, cs: config.clientSecret },
          params: { idTransaction: "00000000-0000-0000-0000-000000000000" },
          validateStatus: () => true,
        }),
      );

      const status = response.status ?? 0;
      const data = response.data;
      const detail =
        typeof data === "string"
          ? data
          : data?.response ?? data?.message ?? JSON.stringify(data ?? {});

      if (status === 401 || status === 403) {
        return { ok: false, status, message: detail || "Access Denied", data };
      }
      if (status === 404) {
        return { ok: true, status, message: "Credenciais validas (id nao encontrado).", data };
      }
      if (status >= 200 && status < 300) {
        return { ok: true, status, message: detail || "Conexao ok.", data };
      }
      return { ok: false, status, message: detail || "Erro ao conectar.", data };
    } catch (err: any) {
      return {
        ok: false,
        status: err?.response?.status ?? 0,
        message: err?.response?.data?.response ?? err?.response?.data?.message ?? err?.message ?? "Falha ao conectar.",
        data: err?.response?.data,
      };
    }
  }
}
