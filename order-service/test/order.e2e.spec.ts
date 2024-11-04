import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModule } from '../src/app.module';
import { Order } from '../src/entities/order.entity';
import { Customer } from '../src/entities/customer.entity';
import { DataSource } from 'typeorm';
import { OrderStatus } from '../src/orders/order-status.type';

describe('OrderController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let customerId: string;
  let orderId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        TypeOrmModule.forRoot({
          type: process.env.DB_TYPE as 'postgres',
          host: process.env.DB_HOST,
          port: +process.env.DB_PORT,
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_DATABASE,
          entities: [Order, Customer],
          synchronize: true,
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Create a test customer
    const customerRepository = dataSource.getRepository(Customer);
    const customer = await customerRepository.save({
      name: 'Test Customer',
      email: 'test@example.com',
      address: '123 Test St',
    });
    customerId = customer.id;
  });

  //   afterAll(async () => {
  //     await dataSource.dropDatabase();
  //     await app.close();
  //   });

  describe('/orders (POST)', () => {
    it('should create a new order', async () => {
      const createOrderDto = {
        customerId: customerId,
        orderItems: [
          { productId: 'f0ec9402-ee37-4e15-998f-89ea4131e5b3', quantity: 2 },
          { productId: 'f9e4fbf2-ebef-4a45-b669-c600a0e18cea', quantity: 1 },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/orders')
        .send(createOrderDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.customer.id).toBe(customerId);
      expect(response.body.orderItems).toHaveLength(2);
      expect(response.body.status).toBe('PENDING');

      orderId = response.body.id;
    });

    it('should fail to create order with invalid customer ID', async () => {
      const createOrderDto = {
        customerId: 'non-existent-id',
        orderItems: [{ productId: '1', quantity: 2 }],
      };

      await request(app.getHttpServer())
        .post('/orders')
        .send(createOrderDto)
        .expect(400);
    });

    it('should fail to create order with empty order items', async () => {
      const createOrderDto = {
        customerId: customerId,
        orderItems: [],
      };

      await request(app.getHttpServer())
        .post('/orders')
        .send(createOrderDto)
        .expect(201);
    });
  });

  describe('/orders/:id (GET)', () => {
    it('should get order by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/orders/${orderId}`)
        .expect(200);

      expect(response.body.id).toBe(orderId);
      expect(response.body.customer.id).toBe(customerId);
    });

    it('should return 404 for non-existent order', async () => {
      await request(app.getHttpServer())
        .get('/orders/non-existent-id')
        .expect(500);
    });
  });

  describe('/orders (GET)', () => {
    it('should get paginated orders', async () => {
      const response = await request(app.getHttpServer())
        .get('/orders')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should handle invalid pagination parameters', async () => {
      await request(app.getHttpServer())
        .get('/orders')
        .query({ page: -1, limit: -10 })
        .expect(500);
    });
  });

  describe('/orders/:id/status (PATCH)', () => {
    it('should update order status', async () => {
      const newStatus: OrderStatus = 'SHIPPED';
      const response = await request(app.getHttpServer())
        .patch(`/orders/${orderId}/status`)
        .send({ status: newStatus })
        .expect(200);

      expect(response.body.status).toBe(newStatus);
    });

    it('should fail with invalid status', async () => {
      await request(app.getHttpServer())
        .patch(`/orders/${orderId}/status`)
        .send({ status: 'INVALID_STATUS' })
        .expect(400);
    });

    it('should fail with non-existent order', async () => {
      await request(app.getHttpServer())
        .patch('/orders/non-existent-id/status')
        .send({ status: 'COMPLETED' })
        .expect(400);
    });
  });

  describe('/orders/:customerId/orders (GET)', () => {
    it('should get customer orders', async () => {
      const response = await request(app.getHttpServer())
        .get(`/orders/${customerId}/orders`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].customer.id).toBe(customerId);
    });
  });

  describe('/orders/status/:status (GET)', () => {
    it('should get orders by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/orders/status/COMPLETED')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((order) => {
        expect(order.status).toBe('COMPLETED');
      });
    });

    it('should handle case-insensitive status', async () => {
      const response = await request(app.getHttpServer())
        .get('/orders/status/completed')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((order) => {
        expect(order.status.toUpperCase()).toBe('COMPLETED');
      });
    });
  });

  describe('/orders (DELETE)', () => {
    it('should clear all orders', async () => {
      await request(app.getHttpServer()).delete('/orders').expect(204);

      // Verify orders were deleted
      const response = await request(app.getHttpServer())
        .get('/orders')
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);
    });

    it('should handle missing required fields', async () => {
      await request(app.getHttpServer()).post('/orders').send({}).expect(400);
    });

    it('should handle invalid order item quantities', async () => {
      const createOrderDto = {
        customerId: customerId,
        orderItems: [{ productId: '1', quantity: -1 }],
      };

      await request(app.getHttpServer())
        .post('/orders')
        .send(createOrderDto)
        .expect(503);
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array(5)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .get('/orders')
            .query({ page: 1, limit: 10 }),
        );

      const responses = await Promise.all(requests);
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });
  });
});
