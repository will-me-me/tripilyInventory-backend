import { IsIn } from 'class-validator';
import { OrderStatus } from '../order-status.type';

export class UpdateOrderStatusDto {
  @IsIn(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'])
  status: OrderStatus;
}
