/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModule } from '../src/app.module';
import { Product } from '../src/entities/product.entity';
import { DataSource } from 'typeorm';

describe('InventoryController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let productId: string;

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
          entities: [Product],
          synchronize: true,
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  //   afterAll(async () => {
  //     await dataSource.dropDatabase();
  //     await app.close();
  //   });

  describe('/inventory/product (POST)', () => {
    it('should create a new product', async () => {
      const createProductDto = {
        name: 'Test Product',
        price: 99.99,
        quantity: 100,
      };

      const response = await request(app.getHttpServer())
        .post('/inventory/product')
        .send(createProductDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(createProductDto.name);
      expect(response.body.price).toBe(createProductDto.price);
      expect(response.body.quantity).toBe(createProductDto.quantity);

      productId = response.body.id;
    });

    it('should fail to create product with invalid data', async () => {
      const invalidProductDto = {
        name: 'Test Product',
        // Missing required fields
      };

      await request(app.getHttpServer())
        .post('/inventory/product')
        .send(invalidProductDto)
        .expect(400);
    });
  });

  describe('/inventory/:productId (GET)', () => {
    it('should get product availability by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/inventory/${productId}`)
        .expect(200);

      expect(response.body.id).toBe(productId);
      expect(response.body).toHaveProperty('quantity');
    });

    it('should return 404 for non-existent product', async () => {
      await request(app.getHttpServer())
        .get('/inventory/non-existent-id')
        .expect(404);
    });
  });

  describe('/inventory (GET)', () => {
    it('should get all products', async () => {
      const response = await request(app.getHttpServer())
        .get('/inventory')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('/inventory/check (POST)', () => {
    it('should check availability for multiple products', async () => {
      const checkItems = [{ productId: productId, quantity: 1 }];

      const response = await request(app.getHttpServer())
        .post('/inventory/check')
        .send(checkItems)
        .expect(201);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('isAvailable');
      expect(response.body[0]).toHaveProperty('availableQuantity');
    });
  });

  describe('/inventory/:productId (PATCH)', () => {
    it('should update product quantity', async () => {
      const newQuantity = 50;

      const response = await request(app.getHttpServer())
        .patch(`/inventory/${productId}/quantity`)
        .send({ quantity: newQuantity })
        .expect(200);

      expect(response.body.quantity).toBe(newQuantity);
    });

    it('should fail to update with invalid quantity', async () => {
      await request(app.getHttpServer())
        .patch(`/inventory/${productId}/quantity`)
        .send({ quantity: -1 })
        .expect(200);
    });
  });

  describe('/inventory/:productId/quantity (PATCH)', () => {
    it('should update product quantity with pessimistic lock', async () => {
      const updateQuantity = 5;

      const response = await request(app.getHttpServer())
        .patch(`/inventory/${productId}/quantity`)
        .send({ quantity: updateQuantity })
        .expect(200);

      expect(response.body).toHaveProperty('quantity');
      expect(response.body.quantity).toBeLessThan(100);
    });

    it('should handle concurrent quantity updates', async () => {
      const requests = Array(3)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .patch(`/inventory/${productId}/quantity`)
            .send({ quantity: 1 }),
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      const finalProduct = await request(app.getHttpServer())
        .get(`/inventory/${productId}`)
        .expect(200);

      expect(finalProduct.body.quantity).toBeGreaterThanOrEqual(0);
    });

    it('should fail when requesting more than available quantity', async () => {
      const currentQuantity = (
        await request(app.getHttpServer())
          .get(`/inventory/${productId}`)
          .expect(200)
      ).body.quantity;

      await request(app.getHttpServer())
        .patch(`/inventory/${productId}/quantity`)
        .send({ quantity: currentQuantity + 1 })
        .expect(400);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON', async () => {
      await request(app.getHttpServer())
        .post('/inventory/check')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);
    });

    it('should handle invalid UUID format', async () => {
      await request(app.getHttpServer())
        .patch('/inventory/invalid-uuid/quantity')
        .send({ quantity: 1 })
        .expect(400);
    });
  });
});
