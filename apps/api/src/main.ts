import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import {
  HttpExceptionFilter,
  LoggingInterceptor,
  PrismaExceptionFilter,
} from './common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  // Global exception filters (Prisma first — more specific than HttpException)
  app.useGlobalFilters(new PrismaExceptionFilter(), new HttpExceptionFilter());

  // Request logging
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger / OpenAPI
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Booking Platform API')
    .setDescription('Events Venue Discovery & Booking Platform — Phase 1 MVP')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

void bootstrap();
