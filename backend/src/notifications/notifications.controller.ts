import { Body, Controller, Post } from '@nestjs/common';
import { IsString } from 'class-validator';
import { NotificationsService } from './notifications.service';

class SendCodeDto {
  @IsString()
  phone: string;

  @IsString()
  code: string;
}

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post('whatsapp-code')
  send(@Body() body: SendCodeDto) {
    return this.notifications.sendWhatsappCode(body.phone, body.code);
  }
}
