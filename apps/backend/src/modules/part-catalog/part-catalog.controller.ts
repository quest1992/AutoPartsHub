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
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import { Permission } from '../../common/permissions/permission.enum';
import { PermissionsGuard } from '../../common/permissions/permissions.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CatalogSearchService } from './catalog-search.service';
import { CreatePartCatalogItemDto } from './dto/create-part-catalog-item.dto';
import { CreatePartAliasDto } from './dto/create-part-alias.dto';
import { CreatePartNumberDto } from './dto/create-part-number.dto';
import { PartCatalogItemQueryDto } from './dto/part-catalog-item-query.dto';
import { UpdatePartCatalogItemDto } from './dto/update-part-catalog-item.dto';
import { PartCatalogService } from './part-catalog.service';

@ApiTags('Part Catalog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN)
@ApiUnauthorizedResponse({ description: 'Требуется действующий JWT' })
@ApiForbiddenResponse({ description: 'Доступно только SUPER_ADMIN' })
@Controller('part-catalog')
export class PartCatalogController {
  constructor(
    private readonly partCatalogService: PartCatalogService,
    private readonly catalogSearchService: CatalogSearchService,
  ) {}

  @Post()
  @RequirePermissions(Permission.CATALOG_MANAGE)
  @ApiOperation({
    summary: 'Создать запись центрального каталога деталей',
    description:
      'internalCode генерируется сервером и не принимается во входных данных',
  })
  @ApiCreatedResponse({
    description: 'Деталь создана вместе с внутренним кодом',
  })
  @ApiBadRequestResponse({
    description: 'Категория неактивна или не является конечной',
  })
  @ApiNotFoundResponse({ description: 'Категория не найдена' })
  @ApiConflictResponse({ description: 'Дубликат детали в категории' })
  create(@Body() dto: CreatePartCatalogItemDto) {
    return this.partCatalogService.create(dto);
  }

  @Get('search')
  @RequirePermissions(Permission.CATALOG_VIEW)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SHOP_ADMIN,
    UserRole.MANAGER,
    UserRole.SELLER,
    UserRole.VIEWER,
  )
  @ApiOperation({
    summary:
      'Поиск по названию, нормализованному названию и подтверждённым синонимам',
  })
  search(@Query() query: PartCatalogItemQueryDto) {
    return this.catalogSearchService.search(query);
  }

  @Get(':partCatalogItemId/numbers')
  @RequirePermissions(Permission.CATALOG_VIEW)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SHOP_ADMIN,
    UserRole.MANAGER,
    UserRole.SELLER,
    UserRole.VIEWER,
  )
  @ApiOperation({ summary: 'Получить номера канонической запчасти' })
  @ApiParam({ name: 'partCatalogItemId', format: 'uuid' })
  @ApiOkResponse({ description: 'Номера запчасти в предсказуемом порядке' })
  @ApiNotFoundResponse({ description: 'Деталь каталога не найдена' })
  getPartNumbers(
    @Param('partCatalogItemId', ParseUUIDPipe) partCatalogItemId: string,
  ) {
    return this.partCatalogService.getPartNumbers(partCatalogItemId);
  }

  @Post(':partCatalogItemId/numbers')
  @RequirePermissions(Permission.CATALOG_MANAGE)
  @ApiOperation({ summary: 'Добавить номер к канонической запчасти' })
  @ApiParam({ name: 'partCatalogItemId', format: 'uuid' })
  @ApiCreatedResponse({ description: 'Номер добавлен к запчасти' })
  @ApiBadRequestResponse({ description: 'Номер пуст после нормализации' })
  @ApiNotFoundResponse({ description: 'Деталь каталога не найдена' })
  @ApiConflictResponse({ description: 'Такой номер уже добавлен к запчасти' })
  addPartNumber(
    @Param('partCatalogItemId', ParseUUIDPipe) partCatalogItemId: string,
    @Body() dto: CreatePartNumberDto,
  ) {
    return this.partCatalogService.addPartNumber(partCatalogItemId, dto);
  }

  @Delete(':partCatalogItemId/numbers/:partNumberId')
  @RequirePermissions(Permission.CATALOG_MANAGE)
  @ApiOperation({ summary: 'Удалить номер канонической запчасти' })
  @ApiParam({ name: 'partCatalogItemId', format: 'uuid' })
  @ApiParam({ name: 'partNumberId', format: 'uuid' })
  @ApiOkResponse({ description: 'Номер удалён' })
  @ApiNotFoundResponse({ description: 'Номер не найден у указанной запчасти' })
  deletePartNumber(
    @Param('partCatalogItemId', ParseUUIDPipe) partCatalogItemId: string,
    @Param('partNumberId', ParseUUIDPipe) partNumberId: string,
  ) {
    return this.partCatalogService.deletePartNumber(
      partCatalogItemId,
      partNumberId,
    );
  }

  @Get(':partCatalogItemId/aliases')
  @RequirePermissions(Permission.CATALOG_VIEW)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SHOP_ADMIN,
    UserRole.MANAGER,
    UserRole.SELLER,
    UserRole.VIEWER,
  )
  @ApiOperation({ summary: 'Получить варианты названия канонической запчасти' })
  @ApiParam({ name: 'partCatalogItemId', format: 'uuid' })
  @ApiOkResponse({ description: 'Варианты названия в предсказуемом порядке' })
  @ApiNotFoundResponse({ description: 'Деталь каталога не найдена' })
  getPartAliases(
    @Param('partCatalogItemId', ParseUUIDPipe) partCatalogItemId: string,
  ) {
    return this.partCatalogService.getPartAliases(partCatalogItemId);
  }

  @Post(':partCatalogItemId/aliases')
  @RequirePermissions(Permission.CATALOG_MANAGE)
  @ApiOperation({ summary: 'Добавить вариант названия канонической запчасти' })
  @ApiParam({ name: 'partCatalogItemId', format: 'uuid' })
  @ApiCreatedResponse({ description: 'Вариант названия добавлен' })
  @ApiBadRequestResponse({
    description: 'Вариант названия пуст после нормализации',
  })
  @ApiNotFoundResponse({ description: 'Деталь каталога не найдена' })
  @ApiConflictResponse({
    description: 'Такой вариант названия уже добавлен к запчасти',
  })
  addPartAlias(
    @Param('partCatalogItemId', ParseUUIDPipe) partCatalogItemId: string,
    @Body() dto: CreatePartAliasDto,
  ) {
    return this.partCatalogService.addPartAlias(partCatalogItemId, dto);
  }

  @Delete(':partCatalogItemId/aliases/:partAliasId')
  @RequirePermissions(Permission.CATALOG_MANAGE)
  @ApiOperation({ summary: 'Удалить вариант названия канонической запчасти' })
  @ApiParam({ name: 'partCatalogItemId', format: 'uuid' })
  @ApiParam({ name: 'partAliasId', format: 'uuid' })
  @ApiOkResponse({ description: 'Вариант названия удалён' })
  @ApiNotFoundResponse({
    description: 'Вариант названия не найден у указанной запчасти',
  })
  deletePartAlias(
    @Param('partCatalogItemId', ParseUUIDPipe) partCatalogItemId: string,
    @Param('partAliasId', ParseUUIDPipe) partAliasId: string,
  ) {
    return this.partCatalogService.deletePartAlias(
      partCatalogItemId,
      partAliasId,
    );
  }

  @Get(':id')
  @RequirePermissions(Permission.CATALOG_VIEW)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SHOP_ADMIN,
    UserRole.MANAGER,
    UserRole.SELLER,
  )
  @ApiOperation({
    summary: 'Получить деталь и её совместимости с автомобилями',
  })
  @ApiNotFoundResponse({ description: 'Деталь каталога не найдена' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.partCatalogService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(Permission.CATALOG_MANAGE)
  @ApiOperation({
    summary: 'Изменить запись каталога',
    description: 'internalCode изменить нельзя',
  })
  @ApiBadRequestResponse({
    description:
      'Категория неактивна, не конечная либо нельзя сделать деталь универсальной',
  })
  @ApiNotFoundResponse({ description: 'Деталь или категория не найдены' })
  @ApiConflictResponse({ description: 'Дубликат детали в категории' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePartCatalogItemDto,
  ) {
    return this.partCatalogService.update(id, dto);
  }

  @Delete(':id/permanent')
  @RequirePermissions(Permission.CATALOG_MANAGE)
  @ApiOperation({
    summary: 'Физически удалить неиспользуемую деталь каталога',
  })
  @ApiConflictResponse({
    description: 'На деталь ссылаются остатки, документы или совместимости',
  })
  @ApiNotFoundResponse({ description: 'Деталь каталога не найдена' })
  deletePermanently(@Param('id', ParseUUIDPipe) id: string) {
    return this.partCatalogService.deletePermanently(id);
  }

  @Delete(':id')
  @RequirePermissions(Permission.CATALOG_MANAGE)
  @ApiOperation({
    summary: 'Мягко отключить деталь каталога',
    description: 'Устанавливает isActive=false, compatibility сохраняются',
  })
  @ApiNotFoundResponse({ description: 'Деталь каталога не найдена' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.partCatalogService.remove(id);
  }
}
