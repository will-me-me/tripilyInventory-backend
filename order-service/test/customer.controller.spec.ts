import { Test, TestingModule } from '@nestjs/testing';
import { CustomerService } from 'src/services/customer.service';
import { CreateCustomerDto } from 'src/customers/dto/create-customer.dto';
import { customerController } from 'src/controllers/customers.controller';

describe('customerController', () => {
  let controller: customerController;
  let service: CustomerService;

  const mockCustomerService = {
    createCustomer: jest.fn(),
    getAllCustomers: jest.fn(),
    getCustomerById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [customerController],
      providers: [
        {
          provide: CustomerService,
          useValue: mockCustomerService,
        },
      ],
    }).compile();

    controller = module.get<customerController>(customerController);
    service = module.get<CustomerService>(CustomerService);
  });

  describe('CreateCustomer', () => {
    it('should create a customer', async () => {
      const createCustomerDto: CreateCustomerDto = {
        name: 'John Doe',
        email: 'john@example.com',
        address: '123 Main St',
      };

      mockCustomerService.createCustomer.mockResolvedValue(createCustomerDto);

      const result = await controller.CreateCustomer(createCustomerDto);
      expect(result).toEqual(createCustomerDto);
      expect(service.createCustomer).toHaveBeenCalledWith(createCustomerDto);
    });
  });

  describe('GetallCustomers', () => {
    it('should return an array of customers', async () => {
      const result = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          address: '123 Main St',
        },
      ];

      mockCustomerService.getAllCustomers.mockResolvedValue(result);

      expect(await controller.GetallCustomers()).toEqual(result);
      expect(service.getAllCustomers).toHaveBeenCalled();
    });
  });

  describe('getCustomer', () => {
    it('should return a customer by id', async () => {
      const id = '1';
      const result = {
        id,
        name: 'John Doe',
        email: 'john@example.com',
        address: '123 Main St',
      };

      mockCustomerService.getCustomerById.mockResolvedValue(result);

      expect(await controller.getCustomer(id)).toEqual(result);
      expect(service.getCustomerById).toHaveBeenCalledWith(id);
    });
  });
});
