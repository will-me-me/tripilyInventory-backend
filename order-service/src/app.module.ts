import { Module } from '@nestjs/common';
// import { OrderModule } from '../src/order.module';
import { OrdersModule } from './orders/orders.module';
import { Order } from './entities/order.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersModule } from './customers/customers.module';
import { Customer } from './entities/customer.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'root',
      password: 'root',
      database: 'db',
      entities: [Order, Customer],
      synchronize: true,
    }),
    OrdersModule,
    CustomersModule,
  ],
})
export class AppModule {}
