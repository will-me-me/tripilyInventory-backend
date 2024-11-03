import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  // UsePipes,
  // ValidationPipe,
} from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { CreateProductDto } from 'src/products/dto/create-product.dto';
// import { UpdateProductQuantityDto } from 'src/products/dto/update-product-quantity.dto';
import { InventoryService } from 'src/services/inventory.service';

@Controller('/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @MessagePattern({ cmd: 'check_stock' })
  async checkStock(orderData: any) {
    console.log('Received order data for stock check:', orderData);
    try {
      const orderItems = orderData.orderItems;
      if (!Array.isArray(orderItems)) {
        throw new Error('Invalid orderItems: Expected an array');
      }

      const isInStock = await this.inventoryService.checkStock(orderItems);
      return { isInStock, orderItems };
    } catch (error) {
      console.error('Error checking stock:', error.message);
      throw new HttpException(
        'Failed to check stock',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @MessagePattern({ cmd: 'update_order' })
  async updateOnOrderStatus(orderData: any) {
    console.log(
      `Order with that belongs to: ${orderData.customerId} status has been updated updated.\n
       Status: ${orderData.status}\n
       totalAmount: ${orderData.totalAmount}\n
       `,
    );

    if (orderData.orderItems && Array.isArray(orderData.orderItems)) {
      orderData.orderItems.forEach((item: any, index: number) => {
        console.log(
          `Order Item ${index + 1}: Product ID - ${item.productId}, Quantity - ${item.quantity}`,
        );
      });
    } else {
      console.warn('No valid order items found.');
    }

    return { message: 'Order status updated successfully' };
  }

  @Post('product')
  async CreateNewProduct(@Body() createProductDto: CreateProductDto) {
    return this.inventoryService.createNewProduct(createProductDto);
  }

  @Get(':productId')
  async getProductAvailability(@Param('productId') productId: string) {
    return this.inventoryService.getProductAvailability(productId);
  }

  @Get()
  async GetallProductsInDb() {
    return this.inventoryService.getAllProduct();
  }

  @Post('check')
  async bulkCheckProductAvailability(
    @Body() items: { productId: string; quantity: number }[],
  ) {
    try {
      return this.inventoryService.checkAvailability(items);
    } catch (error) {
      console.log(error);

      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':productId')
  async updatedInventory(
    @Param('productId') productId: string,
    @Body('quantity') quantity: number,
  ) {
    this.inventoryService.updateInventory(productId, quantity);
  }

  @Patch(':productId/quantity')
  async updateInventory(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() updateData: { quantity: number },
  ) {
    return this.inventoryService.UpdateProductQuantity(
      productId,
      updateData.quantity,
    );
  }
}
