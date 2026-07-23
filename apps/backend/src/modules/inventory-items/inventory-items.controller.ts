import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import { Permission } from '../../common/permissions/permission.enum';
import { PermissionsGuard } from '../../common/permissions/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChangeQuantityDto } from './dto/change-quantity.dto';
import { CreateShopInventoryItemDto } from './dto/create-shop-inventory-item.dto';
import { ShopInventoryItemQueryDto } from './dto/shop-inventory-item-query.dto';
import { UpdateShopInventoryItemDto } from './dto/update-shop-inventory-item.dto';
import {
  InventoryActor,
  InventoryItemsService,
} from './inventory-items.service';
import {
  INVENTORY_IMAGE_MAX_BYTES,
  INVENTORY_IMAGE_MIME_TYPES,
} from './inventory-image.service';
import type { InventoryImageFile } from './inventory-image.service';
@ApiTags('Inventory Items')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.SHOP_ADMIN,
  UserRole.MANAGER,
  UserRole.SELLER,
  UserRole.VIEWER,
)
@ApiUnauthorizedResponse({ description: 'Требуется JWT' })
@ApiForbiddenResponse({ description: 'Доступ ограничен своим магазином' })
@Controller('inventory-items')
export class InventoryItemsController {
  constructor(private readonly service: InventoryItemsService) {}
  @Post()
  @RequirePermissions(Permission.INVENTORY_CREATE)
  @ApiOperation({ summary: 'Создать позицию магазина' })
  @ApiCreatedResponse({
    description:
      'SUPER_ADMIN указывает shopId; пользователь магазина использует shopId из JWT',
  })
  @ApiBadRequestResponse({
    description: 'Некорректные данные, неактивный магазин или деталь',
  })
  @ApiConflictResponse({ description: 'Дубликат складской позиции' })
  create(
    @Body() dto: CreateShopInventoryItemDto,
    @Req() req: { user: InventoryActor },
  ) {
    return this.service.create(dto, req.user);
  }
  @Get()
  @RequirePermissions(Permission.INVENTORY_VIEW)
  @ApiOperation({
    summary: 'Получить складские позиции',
    description: 'Пользователь магазина видит только свой магазин',
  })
  findAll(
    @Query() q: ShopInventoryItemQueryDto,
    @Req() req: { user: InventoryActor },
  ) {
    return this.service.findAll(q, req.user);
  }
  @Get(':id')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  @ApiOperation({ summary: 'Получить складскую позицию' })
  @ApiNotFoundResponse({ description: 'Складская позиция не найдена' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: InventoryActor },
  ) {
    return this.service.findOne(id, req.user);
  }
  @Patch(':id')
  @RequirePermissions(Permission.INVENTORY_UPDATE)
  @ApiOperation({
    summary: 'Изменить складскую позицию',
    description: 'shopId и partCatalogItemId изменить нельзя',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShopInventoryItemDto,
    @Req() req: { user: InventoryActor },
  ) {
    return this.service.update(id, dto, req.user);
  }
  @Post(':id/image')
  @RequirePermissions(Permission.INVENTORY_UPDATE)
  @ApiOperation({ summary: 'Загрузить или заменить фотографию товара' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['image'],
      properties: { image: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: INVENTORY_IMAGE_MAX_BYTES },
      fileFilter: (_request, file, callback) =>
        callback(
          null,
          INVENTORY_IMAGE_MIME_TYPES.includes(
            file.mimetype as (typeof INVENTORY_IMAGE_MIME_TYPES)[number],
          ),
        ),
    }),
  )
  uploadImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: InventoryImageFile,
    @Req() req: { user: InventoryActor },
  ) {
    return this.service.uploadImage(id, file, req.user);
  }

  @Delete(':id/image')
  @RequirePermissions(Permission.INVENTORY_UPDATE)
  @ApiOperation({ summary: 'Удалить фотографию товара' })
  deleteImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: InventoryActor },
  ) {
    return this.service.deleteImage(id, req.user);
  }
  @Patch(':id/quantity')
  @RequirePermissions(Permission.INVENTORY_QUANTITY_UPDATE)
  @ApiOperation({
    summary: 'Атомарно изменить количество',
    description: 'Например change=-1 для списания',
  })
  @ApiConflictResponse({ description: 'Недостаточно товара на складе' })
  changeQuantity(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeQuantityDto,
    @Req() req: { user: InventoryActor },
  ) {
    return this.service.changeQuantity(id, dto, req.user);
  }
  @Delete(':id')
  @RequirePermissions(Permission.INVENTORY_DELETE)
  @ApiOperation({
    summary: 'Мягко отключить позицию',
    description: 'Количество и запись сохраняются',
  })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: InventoryActor },
  ) {
    return this.service.remove(id, req.user);
  }
}
