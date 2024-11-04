/* eslint-disable @typescript-eslint/no-unused-vars */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { CustomerService } from '../src/services/customer.service';
import { Repository } from 'typeorm';
import { Customer } from '../src/entities/customer.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('CustomerController (e2e)', () => {
  let app: INestApplication;
  let customerService: CustomerService;
  let customerRepository: Repository<Customer>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    customerService = moduleFixture.get<CustomerService>(CustomerService);
    customerRepository = moduleFixture.get<Repository<Customer>>(
      getRepositoryToken(Customer),
    );
  });

  //   afterAll(async () => {
  //     await app.close();
  //   });

  it('POST /customers - Create a new customer', async () => {
    const newCustomer = {
      name: 'John Doe',
      email: 'john@example.com',
      address: 'kilimani 123 st',
    };

    const response = await request(app.getHttpServer())
      .post('/customers')
      .send(newCustomer)
      .expect(201);

    expect(response.body).toMatchObject(newCustomer);
  });

  it('GET /customers - Get all customers', async () => {
    const response = await request(app.getHttpServer())
      .get('/customers')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  it('GET /customers/:id - Get a single customer by ID', async () => {
    const newCustomer = await customerService.createCustomer({
      name: 'Jane Doe',
      email: 'jane@example.com',
      address: 'kilimani 123 st',
    });

    const response = await request(app.getHttpServer())
      .get(`/customers/${newCustomer.id}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: newCustomer.id,
      name: 'Jane Doe',
      email: 'jane@example.com',
      address: 'kilimani 123 st',
    });
  });

  it('GET /customers/:id - Return 404 for non-existing customer', async () => {
    const response = await request(app.getHttpServer())
      .get('/customers/non-existing-id')
      .expect(400);

    expect(response.body.message).toBe('Invalid customer ID format');
  });
});
