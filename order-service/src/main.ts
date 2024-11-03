import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('OrderService');

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  // Set up a RabbitMQ transport for asynchronous communication
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: 'order_queue',
      queueOptions: {
        durable: true,
      },
    },
  });

  // Start both the HTTP server and the microservice
  await app.startAllMicroservices();
  await app.listen(3001, () => {
    logger.log('Order Service HTTP server running on http://localhost:3001');
  });
}

bootstrap();
