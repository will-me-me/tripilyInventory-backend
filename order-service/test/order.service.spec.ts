/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { DataSource, Repository } from 'typeorm';
import { Order } from '../src/entities/order.entity';
import { CustomerService } from '../src/services/customer.service';
import { CreateOrderDto } from '../src/orders/dto/create-order.dto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { of } from 'rxjs';
import { OrderService } from 'src/services/orders.service';

describe('OrderService', () => {
  let orderService: OrderService;
  let orderRepository: Repository<Order>;
  let customerService: CustomerService;
  let httpService: HttpService;
  let dataSource: DataSource;

  const mockOrderRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOneByOrFail: jest.fn(),
    find: jest.fn(),
    clear: jest.fn(),
    count: jest.fn(),
  };

  const mockCustomerService = {
    getCustomerById: jest.fn(),
  };

  const mockHttpService = {
    post: jest.fn(),
    patch: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => ({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepository,
        },
        {
          provide: CustomerService,
          useValue: mockCustomerService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    orderService = module.get<OrderService>(OrderService);
    orderRepository = module.get<Repository<Order>>(getRepositoryToken(Order));
    customerService = module.get<CustomerService>(CustomerService);
    httpService = module.get<HttpService>(HttpService);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createNewOrder', () => {
    const mockCreateOrderDto: CreateOrderDto = {
      customerId: '1',
      orderItems: [
        { productId: '1', quantity: 2 },
        { productId: '2', quantity: 1 },
      ],
    };

    const mockCustomer = {
      id: '1',
      name: 'Test Customer',
    };

    const mockProductAvailability = [
      { productId: '1', isAvailable: true, price: 100 },
      { productId: '2', isAvailable: true, price: 150 },
    ];

    it('should create a new order successfully', async () => {
      // Mock customer service
      mockCustomerService.getCustomerById.mockResolvedValue(mockCustomer);

      // Mock HTTP service responses
      mockHttpService.post.mockReturnValue(
        of({ data: mockProductAvailability }),
      );
      mockHttpService.patch.mockReturnValue(of({}));

      // Mock repository
      const mockOrder = {
        id: '1',
        customer: mockCustomer,
        orderItems: mockCreateOrderDto.orderItems,
        totalAmount: 350,
        status: 'PENDING',
      };
      mockOrderRepository.create.mockReturnValue(mockOrder);
      mockOrderRepository.save.mockResolvedValue(mockOrder);

      const result = await orderService.createNewOrder(mockCreateOrderDto);

      expect(result).toEqual(mockOrder);
      expect(mockCustomerService.getCustomerById).toHaveBeenCalledWith('1');
      expect(mockHttpService.post).toHaveBeenCalled();
      expect(mockHttpService.patch).toHaveBeenCalledTimes(2);
      expect(mockOrderRepository.create).toHaveBeenCalled();
      expect(mockOrderRepository.save).toHaveBeenCalled();
    });

    it('should throw an error when customer is not found', async () => {
      mockCustomerService.getCustomerById.mockResolvedValue(null);

      await expect(
        orderService.createNewOrder(mockCreateOrderDto),
      ).rejects.toThrow(
        new HttpException('Customer not found', HttpStatus.NOT_FOUND),
      );
    });

    it('should throw an error when products are unavailable', async () => {
      mockCustomerService.getCustomerById.mockResolvedValue(mockCustomer);
      mockHttpService.post.mockReturnValue(
        of({
          data: [
            { productId: '1', isAvailable: false, price: 100 },
            { productId: '2', isAvailable: true, price: 150 },
          ],
        }),
      );

      await expect(
        orderService.createNewOrder(mockCreateOrderDto),
      ).rejects.toThrow(
        new HttpException('Unavailable items: 1', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('getOrderById', () => {
    it('should return an order by id', async () => {
      const mockOrder = { id: '1', customer: { id: '1' }, orderItems: [] };
      mockOrderRepository.findOneByOrFail.mockResolvedValue(mockOrder);

      const result = await orderService.getOrderById('1');

      expect(result).toEqual(mockOrder);
      expect(mockOrderRepository.findOneByOrFail).toHaveBeenCalledWith({
        id: '1',
      });
    });
  });

  describe('getOrders', () => {
    it('should return paginated orders', async () => {
      const mockOrders = [
        { id: '1', customer: { id: '1' }, orderItems: [] },
        { id: '2', customer: { id: '2' }, orderItems: [] },
      ];
      mockOrderRepository.find.mockResolvedValue(mockOrders);
      mockOrderRepository.count.mockResolvedValue(2);

      const result = await orderService.getOrders(1, 10);

      expect(result).toEqual(mockOrders);
      expect(mockOrderRepository.find).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        relations: ['customer'],
      });
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      const mockOrder = {
        id: '1',
        customer: { id: '1' },
        orderItems: [],
        status: 'PENDING',
        totalAmount: 100,
      };
      mockOrderRepository.findOneByOrFail.mockResolvedValue(mockOrder);
      mockOrderRepository.save.mockResolvedValue({
        ...mockOrder,
        status: 'SHIPPED',
      });

      const result = await orderService.updateOrderStatus('1', 'SHIPPED');

      expect(result.status).toBe('SHIPPED');
      expect(mockOrderRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when order not found', async () => {
      mockOrderRepository.findOneByOrFail.mockRejectedValue(new Error());

      await expect(
        orderService.updateOrderStatus('999', 'DELIVERED'),
      ).rejects.toThrow();
    });
  });
});
