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
@Controller('oem')
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

  @Post('contributions')
  @Roles(UserRole.SHOP_ADMIN, UserRole.MANAGER)
  contribution(
    @Body() dto: CreateOemContributionDto,
    @Req() req: RequestWithUser,
  ) {
    return this.service.contribute(dto, req.user);
  }
}
