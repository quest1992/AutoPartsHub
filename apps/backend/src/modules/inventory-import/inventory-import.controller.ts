import {
  Body,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import { Permission } from '../../common/permissions/permission.enum';
import { PermissionsGuard } from '../../common/permissions/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InventoryActor } from '../inventory-items/inventory-items.service';
import { ConfirmInventoryImportDto, PreviewInventoryImportDto } from './dto/confirm-inventory-import.dto';
import { InventoryImportService } from './inventory-import.service';

@ApiTags('Inventory Import')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.SHOP_ADMIN,
  UserRole.MANAGER,
  UserRole.SELLER,
)
@Controller('inventory-import')
export class InventoryImportController {
  constructor(private readonly service: InventoryImportService) {}

  @Post('preview')
  @RequirePermissions(Permission.INVENTORY_IMPORT)
  @ApiOperation({
    summary: 'Предпросмотр Excel-импорта без записи в базу данных',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
        shopId: {
          type: 'string',
          format: 'uuid',
          description: 'Обязателен для SUPER_ADMIN',
        },
        partNumberColumn: { type: 'string' },
        nameColumn: { type: 'string' },
        priceColumn: { type: 'string' },
        quantityColumn: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Результат предпросмотра' })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  preview(
    @UploadedFile() file: { buffer: Buffer; originalname: string },
    @Body() dto: PreviewInventoryImportDto,
    @Req() req: { user: InventoryActor },
  ) {
    return this.service.preview(file, req.user, dto.shopId, {
      partNumberColumn: dto.partNumberColumn,
      nameColumn: dto.nameColumn,
      priceColumn: dto.priceColumn,
      quantityColumn: dto.quantityColumn,
    });
  }

  @Post('confirm')
  @RequirePermissions(Permission.INVENTORY_IMPORT)
  @ApiOperation({ summary: 'Подтвердить импорт Excel с выбранным сопоставлением колонок' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'nameColumn', 'priceColumn', 'quantityColumn'],
      properties: {
        file: { type: 'string', format: 'binary' },
        shopId: { type: 'string', format: 'uuid' },
        partNumberColumn: { type: 'string' },
        nameColumn: { type: 'string' },
        priceColumn: { type: 'string' },
        quantityColumn: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Статистика импорта' })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  confirm(
    @UploadedFile() file: { buffer: Buffer; originalname: string },
    @Body() dto: ConfirmInventoryImportDto,
    @Req() req: { user: InventoryActor },
  ) {
    return this.service.confirm(file, req.user, dto.shopId, {
      partNumberColumn: dto.partNumberColumn,
      nameColumn: dto.nameColumn,
      priceColumn: dto.priceColumn,
      quantityColumn: dto.quantityColumn,
    });
  }
}
