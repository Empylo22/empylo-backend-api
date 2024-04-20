import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from './config/config.service';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const httpPort = new ConfigService().get('httpPort');
  // const gatewayPort = new ConfigService().get('gatewayPort');
  const ipAddress = JSON.parse(process.env.IS_DEVMODE)
    ? `localhost`
    : new ConfigService().get('baseIp');

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  // app.setGlobalPrefix('/user-and-auth');
  app.enableCors({
    origin: '*',
  });

  const config = new DocumentBuilder()
    .setTitle('Employ Project')
    .setDescription('The Employ API description.')
    .setVersion('1.0')
    .addServer(`http://${ipAddress}:${httpPort}`)
    .addBearerAuth({
      in: 'header',
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'jwt',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app
    .listen(httpPort)
    .then(async () =>
      console.log(`Application is running on port: ${httpPort}`),
    );
}
bootstrap();
