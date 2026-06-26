import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger, HttpStatus, HttpException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import * as express from 'express';
import * as path from 'path';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './shared/filters/http-exception.filter';
import { ResponseInterceptor } from './shared/interceptors/response.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3000;
  const clientUrl = configService.get<string>('CLIENT_URL') ?? 'http://localhost:5173';
  const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';

  // Serve uploaded files as static assets
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Increase body size limit for base64 image uploads
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Security headers
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'validator.swagger.io'],
          scriptSrc: ["'self'", "https: 'unsafe-inline'"],
        },
      },
    }),
  );

  // Cookie parser
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      exceptionFactory: (errors) => {
        const messages = errors.flatMap((err) =>
          Object.values(err.constraints ?? {}).map((msg) => msg),
        );
        return new HttpException(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: messages.map((message) => ({ message })),
            },
            meta: {
              timestamp: new Date().toISOString(),
              path: '',
              method: '',
            },
          },
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global response interceptor
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Swagger documentation
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Test Management API')
      .setDescription(
        'Comprehensive Test Management API for managing projects, test suites, test cases, test runs, and reports.',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addCookieAuth('refreshToken')
      .addTag('Authentication', 'User authentication and authorization')
      .addTag('Projects', 'Project management and member operations')
      .addTag('Test Suites', 'Test suite management with nested structure')
      .addTag('Test Cases', 'Test case management with bulk operations')
      .addTag('Test Runs', 'Test execution management and result tracking')
      .addTag('Upload', 'File upload for test case import')
      .addTag('Reports', 'Project statistics and reporting')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
      customSiteTitle: 'Test Management API Docs',
    });

    logger.log(`Swagger documentation available at: http://localhost:${port}/api/docs`);
  }

  await app.listen(port);
  logger.log(`Application running on: http://localhost:${port}`);
  logger.log(`API base URL: http://localhost:${port}/api/v1`);
  logger.log(`Environment: ${nodeEnv}`);
}

bootstrap().catch((err) => {
  new Logger('Bootstrap').error('Failed to start application', err);
  process.exit(1);
});
