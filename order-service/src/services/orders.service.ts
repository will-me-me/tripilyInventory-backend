import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { CreateOrderDto } from '../orders/dto/create-order.dto';
import { OrderStatus } from '../orders/order-status.type';
import { CustomerService } from './customer.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private readonly customerService: CustomerService,
    private readonly httpService: HttpService,
    private readonly dataSource: DataSource,
  ) {}

  async createNewOrder(orderData: CreateOrderDto): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { customerId, orderItems } = orderData;

      const customer = await this.customerService.getCustomerById(customerId);
      if (!customer) {
        throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
      }

      let productAvailability;
      try {
        const response = await this.httpService
          .post('http://localhost:3002/api/inventory/check', orderItems)
          .toPromise();
        productAvailability = response.data;
      } catch (inventoryError) {
        console.error('Inventory Service Error:', inventoryError);
        throw new HttpException(
          'Failed to verify stock availability',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      const unavailableItems = productAvailability.filter(
        (item) => !item.isAvailable,
      );
      if (unavailableItems.length > 0) {
        throw new HttpException(
          `Unavailable items: ${unavailableItems.map((i) => i.productId).join(', ')}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const totalAmount = orderItems.reduce((sum, orderItem) => {
        const availabilityItem = productAvailability.find(
          (p) => p.productId === orderItem.productId,
        );

        if (!availabilityItem) {
          throw new HttpException(
            `Product ${orderItem.productId} not found in availability check`,
            HttpStatus.BAD_REQUEST,
          );
        }

        const price = Number(availabilityItem.price);
        const quantity = orderItem.quantity;

        return sum + price * quantity;
      }, 0);

      const newOrder = this.orderRepository.create({
        customer,
        orderItems: orderItems.map((item) => {
          const availabilityItem = productAvailability.find(
            (p) => p.productId === item.productId,
          );
          return {
            productId: item.productId,
            quantity: item.quantity,
            price: Number(availabilityItem?.price || 0),
          };
        }),
        totalAmount,
        status: 'PENDING',
      });

      const savedOrder = await this.orderRepository.save(newOrder);

      await queryRunner.commitTransaction();

      console.log('Order saved successfully:', savedOrder);
      return savedOrder;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      console.error('Order Creation Error:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to create order',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async getOrderById(id: string): Promise<Order> {
    return this.orderRepository.findOneByOrFail({ id });
  }

  async getOrders(page: number, limit: number): Promise<Order[]> {
    const totalOrders = await this.orderRepository.count();

    console.log(`Total number of orders in the database: ${totalOrders}`);
    return this.orderRepository.find({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['customer'],
    });
  }

  async DeleteAll(): Promise<void> {
    return this.orderRepository.clear();
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.getOrderById(id);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    order.status = status;
    return this.orderRepository.save(order);
  }
}
