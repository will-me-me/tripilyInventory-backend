import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { CreateOrderDto } from '../orders/dto/create-order.dto';
import { OrderStatus } from '../orders/order-status.type';
import { CustomerService } from './customer.service';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';

@Injectable()
export class OrderService implements OnModuleInit {
  private client: ClientProxy;
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private readonly customerService: CustomerService,
    private readonly httpService: HttpService,
    private readonly dataSource: DataSource,
  ) {}

  onModuleInit() {
    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://localhost:5672'],
        queue: 'inventory_queue',
        queueOptions: {
          durable: true,
        },
      },
    });
  }

  async notifyInventoryService(orderData: any) {
    try {
      const response = await this.client
        .send({ cmd: 'check_stock' }, orderData)
        .toPromise();
      console.log(
        `Order notification sent for customer ${orderData.customerId}`,
        response,
      );
    } catch (error) {
      console.error('Failed to send order notification:', error);
    }
  }

  async notifyInventoryServiceOnOrderUpdate(orderData: any) {
    try {
      const response = await this.client
        .send({ cmd: 'update_order' }, orderData)
        .toPromise();
      console.log(
        `Order notification sent for customer ${orderData.customerId} \n
        The order has been ${orderData.status}`,
        response,
      );
    } catch (error) {
      console.error('Failed to send order notification:', error);
    }
  }

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

      for (const item of orderItems) {
        try {
          await this.httpService
            .patch(
              `http://localhost:3002/api/inventory/${item.productId}/quantity`,
              {
                quantity: item.quantity,
              },
            )
            .toPromise();
        } catch (quantityUpdateError) {
          console.error(
            `Failed to update quantity for product ${item.productId}:`,
            quantityUpdateError,
          );
          throw new HttpException(
            `Failed to update quantity for product ${item.productId}`,
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }
      }

      const savedOrder = await this.orderRepository.save(newOrder);

      await queryRunner.commitTransaction();

      console.log('Order saved successfully:', savedOrder);

      // Inform the inventory service that an order was placed
      try {
        await this.notifyInventoryService({
          customerId,
          totalAmount,
          orderItems: orderItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        });
        console.log(`Order notification sent for customer ${customerId}`);
      } catch (orderNotificationError) {
        console.error(
          'Failed to send order notification:',
          orderNotificationError,
        );
      }
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
    const updatedOrder = await this.orderRepository.save(order);
    await this.notifyInventoryServiceOnOrderUpdate({
      customerId: order.customer.id,
      totalAmount: order.totalAmount,
      orderItems: order.orderItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      status: order.status,
    });

    return updatedOrder;
  }

  async getCustomerOrders(id: string): Promise<Order[]> {
    const orders = this.orderRepository.find({
      where: { customer: { id } },
    });
    return orders;
  }
  async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    const orders = await this.orderRepository.find({
      where: { status },
    });
    return orders;
  }
}
