import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/entities/product.entity';
import { CreateProductDto } from 'src/products/dto/create-product.dto';
import { In, Repository } from 'typeorm';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async getProductAvailability(productId: string): Promise<Product> {
    try {
      const product = await this.productRepository.findOneByOrFail({
        id: productId,
      });

      if (product.quantity <= 0) {
        throw new Error('Product not available');
      }

      console.log(product);
      return product;
    } catch (error) {
      console.error(error);
      throw new NotFoundException('Product not found or not available');
    }
  }

  async createNewProduct(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(createProductDto);
    return this.productRepository.save(product);
  }

  async getAllProduct(): Promise<Product[]> {
    return this.productRepository.find();
  }

  async bulkCheckAvailability(productIds: string[]): Promise<Product[]> {
    return this.productRepository.findBy({ id: In([productIds]) });
  }

  async updateInventory(productId: string, quantity: number): Promise<Product> {
    const product = await this.productRepository.findOneByOrFail({
      id: productId,
    });
    product.quantity = quantity;
    return this.productRepository.save(product);
  }

  async checkAvailability(items: { productId: string; quantity: number }[]) {
    const productIds = items.map((item) => item.productId);
    console.log('Requested Product IDs:', productIds);
    const products = await this.productRepository.find({
      where: { id: In(productIds) },
    });

    console.log('Fetched Products:', products);
    return items.map((item) => {
      const product = products.find((p) => p.id === item.productId);

      console.log(`Checking availability for Product ID: ${item.productId}`);

      if (product) {
        const isAvailable = product.quantity >= item.quantity;
        console.log(
          `Product Found: ${item.productId}, Available: ${isAvailable}, Available Quantity: ${product.quantity}`,
        );

        return {
          productId: item.productId,
          isAvailable,
          availableQuantity: product.quantity,
          price: product.price,
        };
      } else {
        console.log(`Product Not Found: ${item.productId}`);
        return {
          productId: item.productId,
          isAvailable: false,
          availableQuantity: 0,
        };
      }
    });
  }
}
