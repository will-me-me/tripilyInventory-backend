/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from '../src/services/orders.service';
import { CreateOrderDto } from '../src/orders/dto/create-order.dto';
import { Order } from '../src/entities/order.entity';
import { OrderStatus } from '../src/orders/order-status.type';
import { NotFoundException } from '@nestjs/common';
import { OrderController } from 'src/controllers/orders.controller';

describe('OrderController', () => {
  let controller: OrderController;
  let orderService: OrderService;

  // Mock order service
  const mockOrderService = {
    createNewOrder: jest.fn(),
    getOrderById: jest.fn(),
    getOrders: jest.fn(),
    updateOrderStatus: jest.fn(),
    getCustomerOrders: jest.fn(),
    getOrdersByStatus: jest.fn(),
    DeleteAll: jest.fn(),
  };

  // Mock order data
  const mockOrder: Partial<Order> = {
    id: '1',
    customer: {
      id: '1',
      name: 'John Doe',
      email: 'JohnDoe@gmail.com',
      address: '123 Main St',
    },
    orderItems: [
      { productId: '1', quantity: 2, price: 100 },
      { productId: '2', quantity: 1, price: 150 },
    ],
    totalAmount: 350,
    status: 'PENDING' as OrderStatus,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: mockOrderService,
        },
      ],
    }).compile();

    controller = module.get<OrderController>(OrderController);
    orderService = module.get<OrderService>(OrderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    const createOrderDto: CreateOrderDto = {
      customerId: '1',
      orderItems: [
        { productId: '1', quantity: 2 },
        { productId: '2', quantity: 1 },
      ],
    };

    it('should create a new order successfully', async () => {
      mockOrderService.createNewOrder.mockResolvedValue(mockOrder);

      const result = await controller.createOrder(createOrderDto);

      expect(result).toEqual(mockOrder);
      expect(mockOrderService.createNewOrder).toHaveBeenCalledWith(
        createOrderDto,
      );
    });

    it('should throw an error when order creation fails', async () => {
      mockOrderService.createNewOrder.mockRejectedValue(
        new Error('Creation failed'),
      );

      await expect(controller.createOrder(createOrderDto)).rejects.toThrow(
        'Creation failed',
      );
    });
  });

  describe('getOrder', () => {
    it('should return an order by id', async () => {
      mockOrderService.getOrderById.mockResolvedValue(mockOrder);

      const result = await controller.getOrder('1');

      expect(result).toEqual(mockOrder);
      expect(mockOrderService.getOrderById).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when order is not found', async () => {
      mockOrderService.getOrderById.mockRejectedValue(new NotFoundException());

      await expect(controller.getOrder('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listOrders', () => {
    const mockOrders = [mockOrder, { ...mockOrder, id: '2' }];

    it('should return paginated orders with default pagination', async () => {
      mockOrderService.getOrders.mockResolvedValue(mockOrders);

      const result = await controller.listOrders();

      expect(result).toEqual(mockOrders);
      expect(mockOrderService.getOrders).toHaveBeenCalledWith(1, 10);
    });

    it('should return paginated orders with custom pagination', async () => {
      mockOrderService.getOrders.mockResolvedValue(mockOrders);

      const result = await controller.listOrders(2, 20);

      expect(result).toEqual(mockOrders);
      expect(mockOrderService.getOrders).toHaveBeenCalledWith(2, 20);
    });
  });

  describe('updateOrderStatus', () => {
    const updatedOrder = { ...mockOrder, status: 'PENDING' as OrderStatus };

    it('should update order status successfully', async () => {
      mockOrderService.updateOrderStatus.mockResolvedValue(updatedOrder);

      const result = await controller.updateOrderStatus(
        '1',
        'SHIPPED' as OrderStatus,
      );

      expect(result).toEqual(updatedOrder);
      expect(mockOrderService.updateOrderStatus).toHaveBeenCalledWith(
        '1',
        'SHIPPED',
      );
    });
  });

  describe('getCustomerOrders', () => {
    const customerOrders = [mockOrder, { ...mockOrder, id: '2' }];

    it('should return all orders for a customer', async () => {
      mockOrderService.getCustomerOrders.mockResolvedValue(customerOrders);

      const result = await controller.getCustomerOrders('1');

      expect(result).toEqual(customerOrders);
      expect(mockOrderService.getCustomerOrders).toHaveBeenCalledWith('1');
    });

    it('should return empty array when customer has no orders', async () => {
      mockOrderService.getCustomerOrders.mockResolvedValue([]);

      const result = await controller.getCustomerOrders('999');

      expect(result).toEqual([]);
      expect(mockOrderService.getCustomerOrders).toHaveBeenCalledWith('999');
    });
  });

  describe('getOrdersByStatus', () => {
    const statusOrders = [mockOrder, { ...mockOrder, id: '2' }];

    it('should return orders filtered by status', async () => {
      mockOrderService.getOrdersByStatus.mockResolvedValue(statusOrders);

      const result = await controller.getOrdersByStatus('pending');

      expect(result).toEqual(statusOrders);
      expect(mockOrderService.getOrdersByStatus).toHaveBeenCalledWith(
        'PENDING',
      );
    });

    it('should handle case-insensitive status parameter', async () => {
      mockOrderService.getOrdersByStatus.mockResolvedValue(statusOrders);

      await controller.getOrdersByStatus('completed');

      expect(mockOrderService.getOrdersByStatus).toHaveBeenCalledWith(
        'COMPLETED',
      );
    });
  });

  describe('clearAll', () => {
    it('should clear all orders successfully', async () => {
      mockOrderService.DeleteAll.mockResolvedValue(undefined);

      await controller.clearAll();

      expect(mockOrderService.DeleteAll).toHaveBeenCalled();
    });

    it('should throw error when clear operation fails', async () => {
      mockOrderService.DeleteAll.mockRejectedValue(new Error('Clear failed'));

      await expect(controller.clearAll()).rejects.toThrow('Clear failed');
    });
  });
});
