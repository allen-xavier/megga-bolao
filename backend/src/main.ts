import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  // Garante fuso horário de São Paulo para toda a aplicação Node
  process.env.TZ = 'America/Sao_Paulo';

  const app = await NestFactory.create(AppModule, { cors: false });

  // Log básico de requests para facilitar diagnóstico em produção
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      // eslint-disable-next-line no-console
      console.log(`[req] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    });
    next();
  });

  app.enableCors({
    origin: process.env.WEB_ORIGIN?.split(',') ?? '*',
    credentials: true,
  });

  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.setGlobalPrefix('api');

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Megga Bolão backend listening on port ${port}`);
}

bootstrap();
