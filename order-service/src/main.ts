import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('OrderService');

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  // Construct RabbitMQ URL with error handling
  const rabbitmqUser = process.env.RABBITMQ_USER || 'guest';
  const rabbitmqPass = process.env.RABBITMQ_PASS || 'guest';
  const rabbitmqHost = process.env.RABBITMQ_HOST || 'localhost';
  const rabbitmqPort = process.env.RABBITMQ_PORT || '5672';

  const rabbitmqUrl = `amqp://${rabbitmqUser}:${rabbitmqPass}@${rabbitmqHost}:${rabbitmqPort}`;

  logger.log(
    `Attempting to connect to RabbitMQ at: ${rabbitmqHost}:${rabbitmqPort}`,
  );

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue: 'order_queue',
      queueOptions: {
        durable: true,
      },
    },
  });

  // Start both the HTTP server and the microservice
  await app.startAllMicroservices();
  await app.listen(3000, '0.0.0.0', () => {
    logger.log('Order Service HTTP server running on http://localhost:3001');
    logger.log('RabbitMQ connection established successfully');
  });
}

bootstrap();
