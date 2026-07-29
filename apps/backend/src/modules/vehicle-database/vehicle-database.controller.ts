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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permission } from '../../common/permissions/permission.enum';
import { PermissionsGuard } from '../../common/permissions/permissions.guard';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateVehicleModificationDto,
  CreateVehicleRegistryItemDto,
  UpdateVehicleModificationDto,
  UpdateVehicleRegistryItemDto,
  VehicleModificationQueryDto,
  VehicleRegistryQueryDto,
} from './dto/vehicle-database.dto';
import { VehicleDatabaseService } from './vehicle-database.service';

type RequestWithUser = { user: { id: string } };

@ApiTags('Vehicle Database')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.SHOP_ADMIN,
  UserRole.MANAGER,
  UserRole.SELLER,
  UserRole.VIEWER,
)
@Controller('vehicle-database')
export class VehicleDatabaseController {
  constructor(private readonly service: VehicleDatabaseService) {}

  @Get('modifications')
  @RequirePermissions(Permission.CATALOG_VIEW)
  listModifications(@Query() query: VehicleModificationQueryDto) {
    return this.service.listModifications(query);
  }

  @Get('modifications/:id')
  @RequirePermissions(Permission.CATALOG_VIEW)
  getModification(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getModification(id);
  }

  @Post('modifications')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.CATALOG_MANAGE)
  createModification(
    @Body() dto: CreateVehicleModificationDto,
    @Req() req: RequestWithUser,
  ) {
    return this.service.createModification(dto, req.user);
  }

  @Patch('modifications/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.CATALOG_MANAGE)
  updateModification(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleModificationDto,
    @Req() req: RequestWithUser,
  ) {
    return this.service.updateModification(id, dto, req.user);
  }

  @Delete('modifications/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.CATALOG_MANAGE)
  removeModification(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ) {
    return this.service.setModificationActive(id, false, req.user);
  }

  @Post('modifications/:id/restore')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.CATALOG_MANAGE)
  restoreModification(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ) {
    return this.service.setModificationActive(id, true, req.user);
  }

  @Get(':resource/:id/history')
  @RequirePermissions(Permission.CATALOG_VIEW)
  history(
    @Param('resource') resource: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.history(resource, id);
  }

  @Get(':resource')
  @RequirePermissions(Permission.CATALOG_VIEW)
  @ApiOperation({
    summary: 'Список справочника автомобилей с поиском и пагинацией',
  })
  list(
    @Param('resource') resource: string,
    @Query() query: VehicleRegistryQueryDto,
  ) {
    return this.service.listRegistry(resource, query);
  }

  @Get(':resource/:id')
  @RequirePermissions(Permission.CATALOG_VIEW)
  get(
    @Param('resource') resource: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.getRegistry(resource, id);
  }

  @Post(':resource')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.CATALOG_MANAGE)
  create(
    @Param('resource') resource: string,
    @Body() dto: CreateVehicleRegistryItemDto,
    @Req() req: RequestWithUser,
  ) {
    return this.service.createRegistry(resource, dto, req.user);
  }

  @Patch(':resource/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.CATALOG_MANAGE)
  update(
    @Param('resource') resource: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleRegistryItemDto,
    @Req() req: RequestWithUser,
  ) {
    return this.service.updateRegistry(resource, id, dto, req.user);
  }

  @Delete(':resource/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.CATALOG_MANAGE)
  remove(
    @Param('resource') resource: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ) {
    return this.service.setRegistryActive(resource, id, false, req.user);
  }

  @Post(':resource/:id/restore')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.CATALOG_MANAGE)
  restore(
    @Param('resource') resource: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ) {
    return this.service.setRegistryActive(resource, id, true, req.user);
  }
}
