import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);
    app.setGlobalPrefix('api/v1');
    app.enableShutdownHooks();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    const port = configService.get('app.port');
    await app.listen(port ?? 3000, '0.0.0.0');
}
await bootstrap();
//# sourceMappingURL=main.js.map