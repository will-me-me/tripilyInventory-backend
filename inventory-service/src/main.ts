import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const logger = new Logger('InventoryService');
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  // Set up a RabbitMQ transport for asynchronous communication
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: 'inventory_queue',
      queueOptions: {
        durable: true,
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(3002, () => {
    logger.log(
      'Inventory Service HTTP server running on http://localhost:3002',
    );
  });
}
bootstrap();
