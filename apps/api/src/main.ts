/**
 * apps/api/src/main.ts
 * ─────────────────────────────────────────────────────────────────────────
 * IMPORTANT — DO NOT REORDER THE TOP-LEVEL IMPORTS
 *
 * `CrudConfigService.load()` MUST run BEFORE any module decorated with
 * `@Crud()` is imported. Decorators run at module-import time; if `AppModule`
 * is hoisted above this call, the @dataui/crud defaults silently win and the
 * configuration below is ignored.
 *
 * The `// eslint-disable-next-line import/first` comments are intentional.
 */
import { CrudConfigService } from '@dataui/crud';

CrudConfigService.load({
  query: {
    limit: 25,
    maxLimit: 100,
    cache: 2000,
    alwaysPaginate: true,
  },
  routes: {
    updateOneBase: { allowParamsOverride: false, returnShallow: false },
    deleteOneBase: { returnDeleted: true },
  },
  params: {
    id: { field: 'id', type: 'uuid', primary: true },
  },
});

// eslint-disable-next-line import/first
import 'reflect-metadata';
// eslint-disable-next-line import/first
import { NestFactory } from '@nestjs/core';
// eslint-disable-next-line import/first
import { Logger, ValidationPipe } from '@nestjs/common';
// eslint-disable-next-line import/first
import { AppModule } from './app/app.module';
// eslint-disable-next-line import/first
import { StripPasswordHashInterceptor } from './common/interceptors/strip-password-hash.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalInterceptors(new StripPasswordHashInterceptor());

  app.enableCors({
    origin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(','),
    credentials: false,
  });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  Logger.log(`🚀  API up on http://localhost:${port}/api`, 'Bootstrap');
}

bootstrap();
