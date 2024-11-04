/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from 'src/services/inventory.service';
import { HttpException } from '@nestjs/common';
import { InventoryController } from 'src/controllers/inventory.controller';

describe('InventoryController', () => {
  let inventoryController: InventoryController;
  let inventoryService: InventoryService;

  const mockInventoryService = {
    checkStock: jest.fn(),
    createNewProduct: jest.fn(),
    getProductAvailability: jest.fn(),
    getAllProduct: jest.fn(),
    checkAvailability: jest.fn(),
    updateInventory: jest.fn(),
    UpdateProductQuantity: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [
        {
          provide: InventoryService,
          useValue: mockInventoryService,
        },
      ],
    }).compile();

    inventoryController = module.get<InventoryController>(InventoryController);
    inventoryService = module.get<InventoryService>(InventoryService);
  });

  describe('checkStock', () => {
    it('should return isInStock false when product is unavailable', async () => {
      const orderItems = [{ productId: '1', quantity: 2 }];
      const expectedResult = { isInStock: false, details: orderItems };

      mockInventoryService.getProductAvailability.mockRejectedValue(
        new Error('Product not found'),
      );

      await expect(inventoryController.checkStock(orderItems)).rejects.toThrow(
        HttpException,
      );
    });

    it('should throw an error if orderItems is not an array', async () => {
      await expect(
        inventoryController.checkStock('not an array'),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('CreateNewProduct', () => {
    it('should create a new product', async () => {
      const createProductDto = {
        name: 'Test Product',
        price: 100,
        quantity: 30,
      };
      const expectedResult = { id: '1', ...createProductDto };

      mockInventoryService.createNewProduct.mockResolvedValue(expectedResult);

      const result =
        await inventoryController.CreateNewProduct(createProductDto);
      expect(result).toEqual(expectedResult);
      expect(mockInventoryService.createNewProduct).toHaveBeenCalledWith(
        createProductDto,
      );
    });
  });

  describe('getProductAvailability', () => {
    it('should return product availability', async () => {
      const productId = '1';
      const expectedResult = { productId, quantity: 10 };

      mockInventoryService.getProductAvailability.mockResolvedValue(
        expectedResult,
      );

      const result =
        await inventoryController.getProductAvailability(productId);
      expect(result).toEqual(expectedResult);
      expect(mockInventoryService.getProductAvailability).toHaveBeenCalledWith(
        productId,
      );
    });
  });

  describe('GetallProductsInDb', () => {
    it('should return all products', async () => {
      const expectedProducts = [{ id: '1', name: 'Test Product' }];

      mockInventoryService.getAllProduct.mockResolvedValue(expectedProducts);

      const result = await inventoryController.GetallProductsInDb();
      expect(result).toEqual(expectedProducts);
    });
  });

  describe('bulkCheckProductAvailability', () => {
    it('should check availability of multiple products', async () => {
      const items = [{ productId: '1', quantity: 2 }];
      const expectedResult = { isInStock: true, details: items };

      mockInventoryService.checkAvailability.mockResolvedValue(expectedResult);

      const result =
        await inventoryController.bulkCheckProductAvailability(items);
      expect(result).toEqual(expectedResult);
      expect(mockInventoryService.checkAvailability).toHaveBeenCalledWith(
        items,
      );
    });
  });

  describe('updateInventory', () => {
    it('should update inventory for a product', async () => {
      const productId = '1';
      const quantity = 10;

      mockInventoryService.updateInventory.mockResolvedValue(undefined);

      await inventoryController.updatedInventory(productId, quantity);
      expect(mockInventoryService.updateInventory).toHaveBeenCalledWith(
        productId,
        quantity,
      );
    });
  });

  describe('updateInventory (patch quantity)', () => {
    it('should update product quantity', async () => {
      const productId = '1';
      const updateData = { quantity: 10 };

      mockInventoryService.UpdateProductQuantity.mockResolvedValue(undefined);

      await inventoryController.updateInventory(productId, updateData);
      expect(mockInventoryService.UpdateProductQuantity).toHaveBeenCalledWith(
        productId,
        updateData.quantity,
      );
    });
  });
});
