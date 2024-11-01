// order.controller.ts
import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrderService } from '../services/orders.service';
import { CreateOrderDto } from '../orders/dto/create-order.dto';
import { OrderStatus } from 'src/orders/order-status.type';

@Controller('/orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.createNewOrder(createOrderDto);
  }

  @Get(':id')
  async getOrder(@Param('id') id: string) {
    return this.orderService.getOrderById(id);
  }

  @Get()
  async listOrders(@Query('page') page = 1, @Query('limit') limit = 10) {
    const orders = await this.orderService.getOrders(page, limit);
    return orders;
  }

  @Patch(':id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
  ) {
    return this.orderService.updateOrderStatus(id, status);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearAll(): Promise<void> {
    await this.orderService.DeleteAll();
  }
}
