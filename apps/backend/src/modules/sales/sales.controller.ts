import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import { Permission } from '../../common/permissions/permission.enum';
import { PermissionsGuard } from '../../common/permissions/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InventoryActor } from '../inventory-items/inventory-items.service';
import { CancelSaleDto } from './dto/cancel-sale.dto';
import { CreateSaleDto } from './dto/create-sale.dto';
import { QuerySalesDto } from './dto/query-sales.dto';
import { SalesService } from './sales.service';
@ApiTags('Sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.SHOP_ADMIN,
  UserRole.MANAGER,
  UserRole.SELLER,
  UserRole.VIEWER,
)
@Controller('sales')
export class SalesController {
  constructor(private s: SalesService) {}
  @Post()
  @RequirePermissions(Permission.SALES_CREATE)
  @ApiOperation({ summary: 'Создать продажу' })
  create(@Body() d: CreateSaleDto, @Req() r: { user: InventoryActor }) {
    return this.s.create(d, r.user);
  }
  @Get()
  @RequirePermissions(Permission.SALES_VIEW)
  @ApiOperation({ summary: 'Список продаж' })
  all(@Query() q: QuerySalesDto, @Req() r: { user: InventoryActor }) {
    return this.s.all(r.user, q);
  }
  @Get(':id')
  @RequirePermissions(Permission.SALES_VIEW)
  @ApiOperation({ summary: 'Продажа по ID' })
  one(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() r: { user: InventoryActor },
  ) {
    return this.s.one(id, r.user);
  }
  @Post(':id/cancel')
  @RequirePermissions(Permission.SALES_CANCEL)
  @ApiOperation({ summary: 'Отменить продажу' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() d: CancelSaleDto,
    @Req() r: { user: InventoryActor },
  ) {
    return this.s.cancel(id, d, r.user);
  }
}
