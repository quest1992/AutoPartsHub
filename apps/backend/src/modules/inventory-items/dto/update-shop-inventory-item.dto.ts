import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateShopInventoryItemDto } from './create-shop-inventory-item.dto';
export class UpdateShopInventoryItemDto extends PartialType(
  OmitType(CreateShopInventoryItemDto, [
    'shopId',
    'partCatalogItemId',
    'quantity',
  ] as const),
) {}
