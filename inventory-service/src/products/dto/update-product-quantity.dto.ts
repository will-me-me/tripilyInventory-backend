import { IsNotEmpty, IsNumber, Min, IsUUID } from 'class-validator';

export class UpdateProductQuantityDto {
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1, { message: 'Quantity must be greater than 0' })
  quantity: number;
}
