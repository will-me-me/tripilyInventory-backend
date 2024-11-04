import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateCustomerDto } from 'src/customers/dto/create-customer.dto';
import { Customer } from 'src/entities/customer.entity';
import { CustomerService } from 'src/services/customer.service';

describe('CustomerService', () => {
  let customerService: CustomerService;

  const mockCustomerRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository,
        },
      ],
    }).compile();

    customerService = module.get<CustomerService>(CustomerService);
  });

  it('should be defined', () => {
    expect(customerService).toBeDefined();
  });

  describe('createCustomer', () => {
    it('should successfully create a customer', async () => {
      const createCustomerDto: CreateCustomerDto = {
        name: 'John Doe',
        email: 'john@example.com',
        address: '123 Main St',
      };

      const newCustomer = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...createCustomerDto,
      };

      mockCustomerRepository.create.mockReturnValue(newCustomer);
      mockCustomerRepository.save.mockResolvedValue(newCustomer);

      const result = await customerService.createCustomer(createCustomerDto);

      expect(mockCustomerRepository.create).toHaveBeenCalledWith(
        createCustomerDto,
      );
      expect(mockCustomerRepository.save).toHaveBeenCalledWith(newCustomer);
      expect(result).toEqual(newCustomer);
    });

    it('should handle save errors appropriately', async () => {
      const createCustomerDto: CreateCustomerDto = {
        name: 'John Doe',
        email: 'john@example.com',
        address: '123 Main St',
      };

      mockCustomerRepository.create.mockReturnValue(createCustomerDto);
      mockCustomerRepository.save.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        customerService.createCustomer(createCustomerDto),
      ).rejects.toThrow();
    });
  });

  describe('getCustomerById', () => {
    it('should successfully return a customer by ID', async () => {
      const mockCustomer = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'john@example.com',
      };

      mockCustomerRepository.findOneBy.mockResolvedValue(mockCustomer);

      const result = await customerService.getCustomerById(
        '123e4567-e89b-12d3-a456-426614174000',
      );

      expect(mockCustomerRepository.findOneBy).toHaveBeenCalledWith({
        id: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(result).toEqual(mockCustomer);
    });

    it('should throw BadRequestException for invalid UUID', async () => {
      await expect(
        customerService.getCustomerById('invalid-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when customer is not found', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      mockCustomerRepository.findOneBy.mockResolvedValue(null);

      await expect(customerService.getCustomerById(validUuid)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAllCustomers', () => {
    it('should return an array of customers', async () => {
      const mockCustomers = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'John Doe',
          email: 'john@example.com',
        },
        {
          id: '987fcdeb-51d3-a456-426614174000',
          name: 'Jane Doe',
          email: 'jane@example.com',
        },
      ];

      mockCustomerRepository.find.mockResolvedValue(mockCustomers);

      const result = await customerService.getAllCustomers();

      expect(mockCustomerRepository.find).toHaveBeenCalled();
      expect(result).toEqual(mockCustomers);
      expect(result.length).toBe(2);
    });

    it('should return empty array when no customers exist', async () => {
      mockCustomerRepository.find.mockResolvedValue([]);

      const result = await customerService.getAllCustomers();

      expect(mockCustomerRepository.find).toHaveBeenCalled();
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
