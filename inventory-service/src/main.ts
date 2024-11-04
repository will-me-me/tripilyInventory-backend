import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const logger = new Logger('InventoryService');
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

  // Set up a RabbitMQ transport for asynchronous communication
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue: 'inventory_queue',
      queueOptions: {
        durable: true,
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(3001, '0.0.0.0', () => {
    logger.log(
      'Inventory Service HTTP server running on http://localhost:3002',
    );
    logger.log('RabbitMQ connection established successfully');
  });
}
bootstrap();
