import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permission } from '../../common/permissions/permission.enum';
import { PermissionsGuard } from '../../common/permissions/permissions.guard';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateShopDto } from './dto/create-shop.dto';
import { ListShopsQueryDto } from './dto/list-shops-query.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { ShopsService } from './shops.service';

@ApiTags('Магазины') @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard) @Roles(UserRole.SUPER_ADMIN) @Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}
  @Get() @RequirePermissions(Permission.SHOPS_VIEW) @ApiOperation({ summary: 'Список магазинов' }) @ApiQuery({ name: 'includeInactive', required: false, type: Boolean }) @ApiOkResponse() @ApiUnauthorizedResponse() @ApiForbiddenResponse()
  findAll(@Query() query: ListShopsQueryDto) { return this.shopsService.findAll(query.includeInactive); }
  @Post() @RequirePermissions(Permission.SHOPS_MANAGE) @ApiOperation({ summary: 'Создать магазин' }) @ApiCreatedResponse() @ApiBadRequestResponse() @ApiUnauthorizedResponse() @ApiForbiddenResponse()
  create(@Body() dto: CreateShopDto) { return this.shopsService.create(dto); }
  @Get(':id') @RequirePermissions(Permission.SHOPS_VIEW) @ApiOperation({ summary: 'Получить магазин' }) @ApiOkResponse() @ApiUnauthorizedResponse() @ApiForbiddenResponse() @ApiNotFoundResponse()
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.shopsService.findOne(id); }
  @Patch(':id') @RequirePermissions(Permission.SHOPS_MANAGE) @ApiOperation({ summary: 'Обновить магазин' }) @ApiOkResponse() @ApiBadRequestResponse() @ApiUnauthorizedResponse() @ApiForbiddenResponse() @ApiNotFoundResponse()
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateShopDto) { return this.shopsService.update(id, dto); }
  @Post(':id/deactivate') @RequirePermissions(Permission.SHOPS_MANAGE) @ApiOperation({ summary: 'Деактивировать магазин' }) @ApiOkResponse() @ApiUnauthorizedResponse() @ApiForbiddenResponse() @ApiNotFoundResponse()
  deactivate(@Param('id', ParseUUIDPipe) id: string) { return this.shopsService.deactivate(id); }
}
