import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
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
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type { Response } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permission } from '../../common/permissions/permission.enum';
import { PermissionsGuard } from '../../common/permissions/permissions.guard';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InventoryActor } from '../inventory-items/inventory-items.service';
import {
  ConfirmInventoryImportDto,
  PreviewInventoryImportDto,
} from './dto/confirm-inventory-import.dto';
import { InventoryImportService } from './inventory-import.service';

@ApiTags('Inventory Import')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.SHOP_ADMIN, UserRole.MANAGER)
@RequirePermissions(Permission.INVENTORY_IMPORT)
@Controller('inventory-import')
export class InventoryImportController {
  constructor(private readonly service: InventoryImportService) {}

  @Get('template')
  @ApiOperation({ summary: 'Скачать XLSX-шаблон импорта остатков' })
  @ApiProduces(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  template(@Res() response: Response) {
    const file = this.service.template();
    response.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="inventory-import-template.xlsx"',
    );
    response.send(file);
  }

  @Post('preview')
  @ApiOperation({
    summary: 'Загрузить XLSX, сопоставить каталог и создать preview-сессию',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
        shopId: { type: 'string', format: 'uuid' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  preview(
    @UploadedFile() file: { buffer: Buffer; originalname: string },
    @Body() dto: PreviewInventoryImportDto,
    @Req() request: { user: InventoryActor },
  ) {
    return this.service.preview(file, request.user, dto.shopId);
  }

  @Post(':sessionId/confirm')
  @ApiOperation({
    summary: 'Подтвердить отредактированные строки import-сессии',
  })
  confirm(
    @Param('sessionId') sessionId: string,
    @Body() dto: ConfirmInventoryImportDto,
    @Req() request: { user: InventoryActor },
  ) {
    return this.service.confirm(sessionId, dto, request.user);
  }
}
