import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateProductDto } from 'src/products/dto/create-product.dto';
import { InventoryService } from 'src/services/inventory.service';

@Controller('/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

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
}
