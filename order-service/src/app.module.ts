import { Module } from '@nestjs/common';
// import { OrderModule } from '../src/order.module';
import { OrdersModule } from './orders/orders.module';
import { Order } from './entities/order.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersModule } from './customers/customers.module';
import { Customer } from './entities/customer.entity';
import { config } from 'dotenv';
import { ConfigModule } from '@nestjs/config';

config();

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [Order, Customer],
      synchronize: true,
    }),
    OrdersModule,
    CustomersModule,
  ],
})
export class AppModule {}
