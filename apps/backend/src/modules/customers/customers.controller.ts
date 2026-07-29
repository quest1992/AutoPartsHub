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
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permission } from '../../common/permissions/permission.enum';
import { PermissionsGuard } from '../../common/permissions/permissions.guard';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InventoryActor } from '../inventory-items/inventory-items.service';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.SHOP_ADMIN, UserRole.MANAGER)
@RequirePermissions(Permission.ORDER_MANAGE)
@Controller('customers')
export class CustomersController {
  constructor(private readonly service: CustomersService) {}
  @Get() all(
    @Query('search') search: string | undefined,
    @Req() req: { user: InventoryActor },
  ) {
    return this.service.all(search, req.user);
  }
  @Post() create(
    @Body() dto: CreateCustomerDto,
    @Req() req: { user: InventoryActor },
  ) {
    return this.service.create(dto, req.user);
  }
  @Get(':id') one(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: InventoryActor },
  ) {
    return this.service.one(id, req.user);
  }
  @Patch(':id') update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
    @Req() req: { user: InventoryActor },
  ) {
    return this.service.update(id, dto, req.user);
  }
}
