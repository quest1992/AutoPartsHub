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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permission } from '../../common/permissions/permission.enum';
import { PermissionsGuard } from '../../common/permissions/permissions.guard';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OemSearchQueryDto } from './dto/oem-search-query.dto';
import {
  AddOemAliasDto,
  AddOemCategoryDto,
  AddOemCrossReferenceDto,
  AddOemFitmentDto,
  CreateOemContributionDto,
  CreateOemPartDto,
  UpdateOemPartDto,
  UpdateOemFitmentDto,
} from './dto/oem-write.dto';
import { OemActor, OemDatabaseService } from './oem-database.service';

type RequestWithUser = { user: OemActor };

@ApiTags('OEM Database')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.SHOP_ADMIN,
  UserRole.MANAGER,
  UserRole.SELLER,
  UserRole.VIEWER,
)
@RequirePermissions(Permission.CATALOG_VIEW)
@Controller(['oem', 'admin/oem'])
export class OemDatabaseController {
  constructor(private readonly service: OemDatabaseService) {}

  @Get('search')
  search(@Query() query: OemSearchQueryDto) {
    return this.service.search(query);
  }

  @Get()
  list(@Query() query: OemSearchQueryDto) {
    return this.service.list(query);
  }

  @Get('options')
  options() {
    return this.service.options();
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.CATALOG_MANAGE)
  create(@Body() dto: CreateOemPartDto, @Req() req: RequestWithUser) {
    return this.service.create(dto, req.user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.CATALOG_MANAGE)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOemPartDto,
    @Req() req: RequestWithUser,
  ) {
    return this.service.update(id, dto, req.user);
  }

  @Post(':id/aliases')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.CATALOG_MANAGE)
  alias(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddOemAliasDto,
    @Req() req: RequestWithUser,
  ) {
    return this.service.addAlias(id, dto, req.user);
  }

  @Post(':id/categories')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.CATALOG_MANAGE)
  category(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddOemCategoryDto,
    @Req() req: RequestWithUser,
  ) {
    return this.service.addCategory(id, dto, req.user);
  }

  @Post(':id/fitments')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.CATALOG_MANAGE)
  fitment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddOemFitmentDto,
    @Req() req: RequestWithUser,
  ) {
    return this.service.addFitment(id, dto, req.user);
  }

  @Patch(':id/fitments/:fitmentId')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.CATALOG_MANAGE)
  updateFitment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('fitmentId', ParseUUIDPipe) fitmentId: string,
    @Body() dto: UpdateOemFitmentDto,
    @Req() req: RequestWithUser,
  ) {
    return this.service.updateFitment(id, fitmentId, dto, req.user);
  }

  @Post(':id/fitments/:fitmentId/deactivate')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.CATALOG_MANAGE)
  deactivateFitment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('fitmentId', ParseUUIDPipe) fitmentId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.service.deactivateFitment(id, fitmentId, req.user);
  }
  @Post(':id/cross-references')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.CATALOG_MANAGE)
  crossReference(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddOemCrossReferenceDto,
    @Req() req: RequestWithUser,
  ) {
    return this.service.addCrossReference(id, dto, req.user);
  }

  @Post(':id/cross-references/:crossReferenceId/deactivate')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.CATALOG_MANAGE)
  deactivateCrossReference(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('crossReferenceId', ParseUUIDPipe) crossReferenceId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.service.deactivateCrossReference(
      id,
      crossReferenceId,
      req.user,
    );
  }
  @Post(':id/deactivate')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.CATALOG_MANAGE)
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ) {
    return this.service.deactivate(id, req.user);
  }

  @Post('contributions')
  @Roles(UserRole.SHOP_ADMIN, UserRole.MANAGER)
  contribution(
    @Body() dto: CreateOemContributionDto,
    @Req() req: RequestWithUser,
  ) {
    return this.service.contribute(dto, req.user);
  }
}
