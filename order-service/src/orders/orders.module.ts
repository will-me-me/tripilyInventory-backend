import { Module } from '@nestjs/common';
import { OrderController } from 'src/controllers/orders.controller';
import { OrderService } from 'src/services/orders.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from 'src/entities/order.entity';
import { HttpModule } from '@nestjs/axios';
import { CustomersModule } from 'src/customers/customers.module';
import { Customer } from 'src/entities/customer.entity';
import { CustomerService } from 'src/services/customer.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Customer]),
    HttpModule,
    CustomersModule,
  ],
  controllers: [OrderController],
  providers: [OrderService, CustomerService],
})
export class OrdersModule {}
