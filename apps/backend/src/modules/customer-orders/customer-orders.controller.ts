import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CustomerOrderStatus, UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permission } from '../../common/permissions/permission.enum';
import { PermissionsGuard } from '../../common/permissions/permissions.guard';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InventoryActor } from '../inventory-items/inventory-items.service';
import { CustomerOrdersService } from './customer-orders.service';
import {
  CancelCustomerOrderDto,
  CreateCustomerOrderDto,
  CustomerOrderQueryDto,
  ExtendReservationDto,
  OrderInventorySearchDto,
  ReserveOrderDto,
  UpdateCustomerOrderDto,
} from './dto/customer-order.dto';

@ApiTags('Customer orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.SHOP_ADMIN, UserRole.MANAGER)
@RequirePermissions(Permission.ORDER_MANAGE)
@Controller('customer-orders')
export class CustomerOrdersController {
  constructor(private readonly service: CustomerOrdersService) {}
  @Get('inventory-search') inventorySearch(
    @Query() q: OrderInventorySearchDto,
    @Req() req: { user: InventoryActor },
  ) {
    return this.service.inventorySearch(q, req.user);
  }
  @Post() create(
    @Body() dto: CreateCustomerOrderDto,
    @Req() req: { user: InventoryActor },
  ) {
    return this.service.create(dto, req.user);
  }
  @Get() all(
    @Query() q: CustomerOrderQueryDto,
    @Req() req: { user: InventoryActor },
  ) {
    return this.service.all(q, req.user);
  }
  @Get(':id') one(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: InventoryActor },
  ) {
    return this.service.one(id, req.user);
  }
  @Get(':id/finance') finance(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: InventoryActor },
  ) {
    return this.service.finance(id, req.user);
  }
  @Patch(':id') update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerOrderDto,
    @Req() req: { user: InventoryActor },
  ) {
    return this.service.update(id, dto, req.user);
  }
  @Post(':id/reserve') reserve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReserveOrderDto,
    @Req() req: { user: InventoryActor },
  ) {
    return this.service.reserve(id, dto, req.user);
  }
  @Post(':id/confirm') confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: InventoryActor },
  ) {
    return this.service.confirm(id, req.user);
  }
  @Post(':id/ready') ready(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: InventoryActor },
  ) {
    return this.service.transition(
      id,
      CustomerOrderStatus.CONFIRMED,
      CustomerOrderStatus.READY,
      req.user,
    );
  }
  @Post(':id/complete') complete(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: InventoryActor },
  ) {
    return this.service.transition(
      id,
      CustomerOrderStatus.READY,
      CustomerOrderStatus.COMPLETED,
      req.user,
    );
  }
  @Post(':id/cancel') cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelCustomerOrderDto,
    @Req() req: { user: InventoryActor },
  ) {
    return this.service.cancel(id, dto, req.user);
  }
  @Post(':id/extend-reservation') extend(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExtendReservationDto,
    @Req() req: { user: InventoryActor },
  ) {
    return this.service.extend(id, dto, req.user);
  }
}
