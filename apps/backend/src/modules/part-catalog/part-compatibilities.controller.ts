import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import { Permission } from '../../common/permissions/permission.enum';
import { PermissionsGuard } from '../../common/permissions/permissions.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePartCompatibilityDto } from './dto/create-part-compatibility.dto';
import { UpdatePartCompatibilityDto } from './dto/update-part-compatibility.dto';
import { PartCatalogService } from './part-catalog.service';

@ApiTags('Part Compatibilities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.SHOP_ADMIN,
  UserRole.MANAGER,
  UserRole.SELLER,
  UserRole.VIEWER,
)
@ApiUnauthorizedResponse({ description: 'Требуется действующий JWT' })
@ApiForbiddenResponse({ description: 'Доступно только SUPER_ADMIN' })
@Controller('part-catalog/:partId/compatibilities')
export class PartCompatibilitiesController {
  constructor(private readonly partCatalogService: PartCatalogService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.CATALOG_MANAGE)
  @ApiOperation({
    summary: 'Добавить совместимость детали с поколением автомобиля',
  })
  @ApiCreatedResponse({ description: 'Совместимость создана' })
  @ApiBadRequestResponse({
    description: 'Деталь универсальна, отключена или диапазон лет недопустим',
  })
  @ApiNotFoundResponse({ description: 'Деталь либо поколение не найдены' })
  @ApiConflictResponse({ description: 'Совместимость уже существует' })
  create(
    @Param('partId', ParseUUIDPipe) partId: string,
    @Body() dto: CreatePartCompatibilityDto,
  ) {
    return this.partCatalogService.createCompatibility(partId, dto);
  }

  @Get()
  @RequirePermissions(Permission.CATALOG_VIEW)
  @ApiOperation({ summary: 'Получить compatibility детали' })
  @ApiOkResponse({ description: 'Список compatibility с цепочкой автомобиля' })
  findAll(@Param('partId', ParseUUIDPipe) partId: string) {
    return this.partCatalogService.findCompatibilities(partId);
  }

  @Get(':compatibilityId')
  @RequirePermissions(Permission.CATALOG_VIEW)
  @ApiOperation({ summary: 'Получить одну compatibility детали' })
  @ApiNotFoundResponse({
    description: 'Совместимость не найдена для указанной детали',
  })
  findOne(
    @Param('partId', ParseUUIDPipe) partId: string,
    @Param('compatibilityId', ParseUUIDPipe) compatibilityId: string,
  ) {
    return this.partCatalogService.findCompatibility(partId, compatibilityId);
  }

  @Patch(':compatibilityId')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.CATALOG_MANAGE)
  @ApiOperation({ summary: 'Изменить compatibility детали' })
  @ApiBadRequestResponse({
    description:
      'Диапазон лет или активность связанного автомобиля недопустимы',
  })
  @ApiConflictResponse({ description: 'Совместимость уже существует' })
  update(
    @Param('partId', ParseUUIDPipe) partId: string,
    @Param('compatibilityId', ParseUUIDPipe) compatibilityId: string,
    @Body() dto: UpdatePartCompatibilityDto,
  ) {
    return this.partCatalogService.updateCompatibility(
      partId,
      compatibilityId,
      dto,
    );
  }

  @Delete(':compatibilityId')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.CATALOG_MANAGE)
  @ApiOperation({
    summary: 'Удалить compatibility',
    description: 'Связь удаляется физически; сама деталь не изменяется',
  })
  @ApiNotFoundResponse({
    description: 'Совместимость не найдена для указанной детали',
  })
  remove(
    @Param('partId', ParseUUIDPipe) partId: string,
    @Param('compatibilityId', ParseUUIDPipe) compatibilityId: string,
  ) {
    return this.partCatalogService.removeCompatibility(partId, compatibilityId);
  }
}
