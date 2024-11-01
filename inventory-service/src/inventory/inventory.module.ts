import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryController } from 'src/controllers/inventory.controller';
import { Product } from 'src/entities/product.entity';
import { InventoryService } from 'src/services/inventory.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
