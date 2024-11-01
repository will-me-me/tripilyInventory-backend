import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateCustomerDto } from 'src/customers/dto/create-customer.dto';
import { CustomerService } from 'src/services/customer.service';

@Controller('/customers')
export class customerController {
  constructor(private readonly customerServive: CustomerService) {}

  @Post()
  async CreateCustomer(@Body() createCustomerdto: CreateCustomerDto) {
    return this.customerServive.createCustomer(createCustomerdto);
  }

  @Get()
  async GetallCustomers() {
    return this.customerServive.getAllCustomers();
  }

  @Get(':id')
  async getCustomer(@Param('id') id: string) {
    return this.customerServive.getCustomerById(id);
  }
}
