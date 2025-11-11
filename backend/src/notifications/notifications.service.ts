import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly http: HttpService, private readonly config: ConfigService) {}

  async sendWhatsappCode(phone: string, code: string) {
    const url = this.config.get<string>('evolution.url');
    const token = this.config.get<string>('evolution.token');
    if (!url || !token) {
      this.logger.warn('Evolution API não configurada, mensagem não enviada');
      return { success: false };
    }

    try {
      await this.http.axiosRef.post(
        `${url}/messages`,
        {
          to: phone,
          message: `Seu código Megga Bolão é: ${code}`,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return { success: true };
    } catch (error) {
      this.logger.error('Erro ao enviar código via Evolution API', error);
      return { success: false };
    }
  }
}
