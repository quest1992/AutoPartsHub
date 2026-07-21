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
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import { Permission } from '../../common/permissions/permission.enum';
import { PermissionsGuard } from '../../common/permissions/permissions.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateVehicleGenerationDto } from './dto/create-vehicle-generation.dto';
import { UpdateVehicleGenerationDto } from './dto/update-vehicle-generation.dto';
import { VehicleGenerationQueryDto } from './dto/vehicle-generation-query.dto';
import { VehicleGenerationsService } from './vehicle-generations.service';

@ApiTags('Поколения автомобилей')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.SHOP_ADMIN, UserRole.MANAGER, UserRole.SELLER, UserRole.VIEWER)
@ApiUnauthorizedResponse({ description: 'Требуется действующий JWT' })
@ApiForbiddenResponse({ description: 'Доступен только SUPER_ADMIN' })
@Controller('vehicle-generations')
export class VehicleGenerationsController {
  constructor(
    private readonly vehicleGenerationsService: VehicleGenerationsService,
  ) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.CATALOG_MANAGE)
  @ApiOperation({ summary: 'Создать поколение автомобиля' })
  @ApiCreatedResponse({ description: 'Поколение автомобиля создано' })
  @ApiBadRequestResponse({
    description: 'Данные некорректны или связанная запись отключена',
  })
  @ApiNotFoundResponse({ description: 'Модель автомобиля не найдена' })
  @ApiConflictResponse({ description: 'Название или slug уже заняты у модели' })
  create(@Body() createVehicleGenerationDto: CreateVehicleGenerationDto) {
    return this.vehicleGenerationsService.create(createVehicleGenerationDto);
  }

  @Get()
  @RequirePermissions(Permission.CATALOG_VIEW)
  @ApiOperation({ summary: 'Получить список поколений автомобилей' })
  @ApiOkResponse({ description: 'Список поколений автомобилей получен' })
  @ApiBadRequestResponse({ description: 'Параметры фильтрации некорректны' })
  findAll(@Query() query: VehicleGenerationQueryDto) {
    return this.vehicleGenerationsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(Permission.CATALOG_VIEW)
  @ApiOperation({ summary: 'Получить поколение автомобиля по ID' })
  @ApiOkResponse({ description: 'Поколение автомобиля получено' })
  @ApiNotFoundResponse({ description: 'Поколение автомобиля не найдено' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehicleGenerationsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.CATALOG_MANAGE)
  @ApiOperation({ summary: 'Обновить поколение автомобиля' })
  @ApiOkResponse({ description: 'Поколение автомобиля обновлено' })
  @ApiBadRequestResponse({
    description: 'Данные некорректны или связанная запись отключена',
  })
  @ApiNotFoundResponse({
    description: 'Поколение или модель автомобиля не найдены',
  })
  @ApiConflictResponse({ description: 'Название или slug уже заняты у модели' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVehicleGenerationDto: UpdateVehicleGenerationDto,
  ) {
    return this.vehicleGenerationsService.update(
      id,
      updateVehicleGenerationDto,
    );
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.CATALOG_MANAGE)
  @ApiOperation({ summary: 'Отключить поколение автомобиля' })
  @ApiOkResponse({ description: 'Поколение автомобиля отключено' })
  @ApiNotFoundResponse({ description: 'Поколение автомобиля не найдено' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehicleGenerationsService.remove(id);
  }
}
