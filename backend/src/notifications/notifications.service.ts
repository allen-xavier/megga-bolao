import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  // Temporário para testes: não chama Evolution, apenas loga e retorna sucesso
  async sendWhatsappCode(phone: string, code: string) {
    this.logger.warn(`Envio de WhatsApp desabilitado (teste). Simulando envio para ${phone} com código ${code}.`);
    return { success: true, skipped: true };
  }
}
