import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { customerController } from 'src/controllers/customers.controller';
import { Customer } from 'src/entities/customer.entity';
import { CustomerService } from 'src/services/customer.service';

@Module({
  imports: [TypeOrmModule.forFeature([Customer]), HttpModule],
  controllers: [customerController],
  exports: [CustomerService],
  providers: [CustomerService],
})
export class CustomersModule {}
