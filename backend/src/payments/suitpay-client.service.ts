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
}
