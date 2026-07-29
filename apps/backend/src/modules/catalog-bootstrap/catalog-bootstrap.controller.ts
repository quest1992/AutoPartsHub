import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import { Permission } from '../../common/permissions/permission.enum';
import { PermissionsGuard } from '../../common/permissions/permissions.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CatalogBootstrapService } from './catalog-bootstrap.service';
import { CreateCatalogBootstrapItemsDto } from './dto/create-catalog-bootstrap-items.dto';

@ApiTags('Admin Catalog Bootstrap')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN)
@RequirePermissions(Permission.CATALOG_MANAGE)
@ApiForbiddenResponse({ description: 'Доступно только SUPER_ADMIN' })
@Controller('admin/catalog-bootstrap')
export class CatalogBootstrapController {
  constructor(private readonly service: CatalogBootstrapService) {}

  @Get()
  @ApiOperation({
    summary: 'Получить мастер наполнения по листовым категориям',
  })
  @ApiOkResponse({
    description: 'Все активные листовые категории с предложениями',
  })
  findAll() {
    return this.service.findAll();
  }

  @Post('create')
  @ApiOperation({ summary: 'Создать только явно выбранные позиции каталога' })
  @ApiConflictResponse({ description: 'Категория передана несколько раз' })
  create(@Body() dto: CreateCatalogBootstrapItemsDto) {
    return this.service.createSelected(dto);
  }

  @Post('auto-create-safe')
  @ApiOperation({
    summary: 'Автоматически создать до 200 позиций с подтверждёнными правилами',
  })
  autoCreateSafe() {
    return this.service.autoCreateSafe();
  }
}
