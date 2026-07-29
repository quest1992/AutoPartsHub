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
import { CreateVehicleModelDto } from './dto/create-vehicle-model.dto';
import { FindVehicleModelsDto } from './dto/find-vehicle-models.dto';
import { UpdateVehicleModelDto } from './dto/update-vehicle-model.dto';
import { VehicleModelsService } from './vehicle-models.service';

@ApiTags('Модели автомобилей')
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
@ApiForbiddenResponse({ description: 'Доступен только SUPER_ADMIN' })
@Controller('vehicle-models')
export class VehicleModelsController {
  constructor(private readonly vehicleModelsService: VehicleModelsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.CATALOG_MANAGE)
  @ApiOperation({ summary: 'Создать модель автомобиля' })
  @ApiCreatedResponse({ description: 'Модель автомобиля создана' })
  @ApiBadRequestResponse({
    description: 'Производитель отключён или данные некорректны',
  })
  @ApiNotFoundResponse({ description: 'Производитель не найден' })
  @ApiConflictResponse({
    description: 'Название или slug уже заняты у производителя',
  })
  create(@Body() createVehicleModelDto: CreateVehicleModelDto) {
    return this.vehicleModelsService.create(createVehicleModelDto);
  }

  @Get()
  @RequirePermissions(Permission.CATALOG_VIEW)
  @ApiOperation({ summary: 'Получить список моделей автомобилей' })
  @ApiOkResponse({ description: 'Список моделей автомобилей получен' })
  findAll(@Query() filters: FindVehicleModelsDto) {
    return this.vehicleModelsService.findAll(filters);
  }

  @Get(':id')
  @RequirePermissions(Permission.CATALOG_VIEW)
  @ApiOperation({ summary: 'Получить модель автомобиля по ID' })
  @ApiOkResponse({ description: 'Модель автомобиля получена' })
  @ApiNotFoundResponse({ description: 'Модель автомобиля не найдена' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehicleModelsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.CATALOG_MANAGE)
  @ApiOperation({ summary: 'Обновить модель автомобиля' })
  @ApiOkResponse({ description: 'Модель автомобиля обновлена' })
  @ApiBadRequestResponse({
    description: 'Производитель отключён или данные некорректны',
  })
  @ApiNotFoundResponse({ description: 'Модель или производитель не найдены' })
  @ApiConflictResponse({
    description: 'Название или slug уже заняты у производителя',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVehicleModelDto: UpdateVehicleModelDto,
  ) {
    return this.vehicleModelsService.update(id, updateVehicleModelDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.CATALOG_MANAGE)
  @ApiOperation({ summary: 'Отключить модель автомобиля' })
  @ApiOkResponse({ description: 'Модель автомобиля отключена' })
  @ApiNotFoundResponse({ description: 'Модель автомобиля не найдена' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehicleModelsService.remove(id);
  }
}
