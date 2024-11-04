import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from 'src/entities/product.entity';
import { InventoryService } from 'src/services/inventory.service';
import { DataSource } from 'typeorm';

describe('InventoryService', () => {
  let service: InventoryService;

  const mockProductRepository = {
    findOneByOrFail: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockProduct = {
    id: '1',
    name: 'Test Product',
    quantity: 10,
    price: 100,
    updatedAt: new Date(),
  };

  const mockInventoryService = {
    getProductAvailability: jest.fn(),
    checkStock: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: DataSource,
          useValue: mockInventoryService,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createNewProduct', () => {
    it('should create a new product and return it', async () => {
      const createProductDto = { name: 'New Product', quantity: 5, price: 50 };
      mockProductRepository.create.mockReturnValue(mockProduct);
      mockProductRepository.save.mockResolvedValue(mockProduct);

      const result = await service.createNewProduct(createProductDto);

      expect(result).toEqual(mockProduct);
      expect(mockProductRepository.create).toHaveBeenCalledWith(
        createProductDto,
      );
      expect(mockProductRepository.save).toHaveBeenCalledWith(mockProduct);
    });
  });

  describe('getProductAvailability', () => {
    it('should return product if it exists and is available', async () => {
      mockProductRepository.findOneByOrFail.mockResolvedValue(mockProduct);

      const result = await service.getProductAvailability(mockProduct.id);

      expect(result).toEqual(mockProduct);
      expect(mockProductRepository.findOneByOrFail).toHaveBeenCalledWith({
        id: mockProduct.id,
      });
    });

    it('should throw NotFoundException if product does not exist', async () => {
      mockProductRepository.findOneByOrFail.mockRejectedValue(new Error());

      await expect(
        service.getProductAvailability('invalid-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if product quantity is zero', async () => {
      mockProductRepository.findOneByOrFail.mockResolvedValue({
        ...mockProduct,
        quantity: 0,
      });

      await expect(
        service.getProductAvailability(mockProduct.id),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('checkStock', () => {
    it('should return isInStock false if any item is out of stock', async () => {
      const orderItems = [{ productId: '1', quantity: 15 }];

      // Mock the product availability to return insufficient quantity
      mockInventoryService.getProductAvailability.mockResolvedValueOnce({
        id: '1',
        quantity: 10, // Not enough stock
      });

      const result = await service.checkStock(orderItems);

      expect(result).toEqual({
        isInStock: false,
        details: orderItems[0], // Returning the single item object that caused the stock check to fail
      });
    });

    it('should return isInStock false if a product is not found', async () => {
      const orderItems = [{ productId: '1', quantity: 5 }];

      mockInventoryService.getProductAvailability.mockRejectedValue(
        new NotFoundException('Product not found or not available'),
      );

      const result = await service.checkStock(orderItems);

      expect(result).toEqual({
        isInStock: false,
        details: orderItems[0],
      });
    });
  });

  describe('updateInventory', () => {
    it('should update the product quantity', async () => {
      const newQuantity = 5;
      mockProductRepository.findOneByOrFail.mockResolvedValue(mockProduct);
      mockProductRepository.save.mockResolvedValue({
        ...mockProduct,
        quantity: newQuantity,
      });

      const result = await service.updateInventory(mockProduct.id, newQuantity);

      expect(result.quantity).toBe(newQuantity);
      expect(mockProductRepository.save).toHaveBeenCalledWith({
        ...mockProduct,
        quantity: newQuantity,
      });
    });

    it('should throw NotFoundException if product does not exist', async () => {
      mockProductRepository.findOneByOrFail.mockRejectedValue(new Error());

      await expect(service.updateInventory('invalid-id', 5)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('checkAvailability', () => {
    it('should return availability for each product', async () => {
      const items = [{ productId: mockProduct.id, quantity: 5 }];
      mockProductRepository.find.mockResolvedValue([mockProduct]);

      const result = await service.checkAvailability(items);

      expect(result).toEqual([
        {
          productId: mockProduct.id,
          isAvailable: true,
          availableQuantity: mockProduct.quantity,
          price: mockProduct.price,
        },
      ]);
    });

    it('should return availability as false if product is not found', async () => {
      const items = [{ productId: 'invalid-id', quantity: 5 }];
      mockProductRepository.find.mockResolvedValue([]);

      const result = await service.checkAvailability(items);

      expect(result).toEqual([
        {
          productId: 'invalid-id',
          isAvailable: false,
          availableQuantity: 0,
        },
      ]);
    });
  });
});
